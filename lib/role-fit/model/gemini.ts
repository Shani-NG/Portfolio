import { z } from "zod";
import { buildPortfolioAgentPrompt } from "../prompts/assembly.ts";
import { getGoogleAiStudioModel } from "../runtime/policy.ts";
import type { QualitativeReportAnalysis, RoleFitChatInput, RoleFitChatResult, RoleFitModelInput, RoleFitModelProvider, RoleFitModelResult } from "./provider.ts";

type GeminiCandidate = {
  content?: {
    parts?: Array<{ text?: string }>;
  };
  finishReason?: string;
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
};

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return JSON.parse(fenced?.[1] ?? trimmed);
}

type GeminiCallResult =
  | { ok: true; model: string; data: GeminiResponse }
  | { ok: false; model: string; detail: string };

const qualitativeReportAnalysisSchema = z
  .object({
    fitLevel: z.enum(["strong", "good", "partial", "insufficient", "out-of-scope"]),
    fitRationale: z.string().min(1),
    evidenceConfidence: z.enum(["high", "medium", "low", "insufficient"]),
    evidenceConfidenceRationale: z.string().min(1),
    skillsCoverageLabel: z.string().min(1),
    items: z
      .array(
        z
          .object({
            roleItemIndex: z.number().int().nonnegative(),
            displayLabel: z.string().min(1),
            importance: z.enum(["must-have", "core", "supporting"]),
            matchType: z.enum(["direct", "semantic", "transferable", "partial", "insufficient-evidence", "real-gap"]),
            impact: z.enum(["strength", "gap", "neutral"]),
            evidenceConfidence: z.enum(["high", "medium", "low", "insufficient"]),
            shortRationale: z.string().min(1),
            sharedCapability: z.string().min(1).optional(),
            contextDifference: z.string().min(1).optional(),
            bridgeability: z.string().min(1).optional(),
            unproven: z.string().min(1).optional(),
            evidenceSourceIds: z.array(z.string()),
          })
          .strict(),
      )
      .min(1)
      .max(5),
  })
  .strict();

const reportAnalysisJsonSchema = JSON.stringify(z.toJSONSchema(qualitativeReportAnalysisSchema));

function normalizeGeminiModel(model: string): string {
  return model.replace(/^models\//, "");
}

function getCandidateModels(model: string): string[] {
  return [normalizeGeminiModel(model)];
}

function safeSchemaDiagnostic(error: z.ZodError) {
  return error.issues
    .slice(0, 6)
    .map((issue) => `${issue.path.join(".") || "root"}:${issue.code}`)
    .join(",");
}

function getRoleIndexConstraint(runtimeState: string | undefined) {
  if (!runtimeState) return null;

  try {
    const parsed = JSON.parse(runtimeState) as { roleItems?: unknown[] };
    if (!Array.isArray(parsed.roleItems) || parsed.roleItems.length === 0) return null;
    return {
      allowedIndexes: parsed.roleItems.map((_, index) => index),
      maxItems: Math.min(parsed.roleItems.length, 5),
    };
  } catch {
    return null;
  }
}

async function readProviderError(response: Response): Promise<string> {
  const fallback = `${response.status} ${response.statusText}`;

  try {
    const data = (await response.json()) as { error?: { message?: string } };
    return data.error?.message ? `${fallback}: ${data.error.message}` : fallback;
  } catch {
    return fallback;
  }
}

async function generateGeminiContent(input: {
  apiKey: string;
  models: string[];
  prompt: string;
  maxOutputTokens: number;
  temperature: number;
  responseMimeType?: "application/json";
  thinkingLevel?: "minimal" | "low" | "medium" | "high";
}): Promise<GeminiCallResult> {
  let lastError: GeminiCallResult | undefined;

  for (const model of input.models) {
    let response: Response;

    try {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${input.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: input.prompt }] }],
          generationConfig: {
            maxOutputTokens: input.maxOutputTokens,
            temperature: input.temperature,
            ...(input.responseMimeType ? { responseMimeType: input.responseMimeType } : {}),
            ...(input.thinkingLevel && model.startsWith("gemini-3")
              ? { thinkingConfig: { thinkingLevel: input.thinkingLevel } }
              : {}),
          },
        }),
        signal: AbortSignal.timeout(45_000),
      });
    } catch (error) {
      const isTimeout = error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");
      return {
        ok: false,
        model,
        detail: isTimeout ? "provider-request:timeout" : "provider-request:network-error",
      };
    }

    if (response.ok) {
      try {
        return {
          ok: true,
          model,
          data: (await response.json()) as GeminiResponse,
        };
      } catch {
        return { ok: false, model, detail: "provider-response:invalid-json" };
      }
    }

    lastError = {
      ok: false,
      model,
      detail: await readProviderError(response),
    };

    if (response.status !== 400 && response.status !== 404) break;
  }

  return lastError ?? {
    ok: false,
    model: input.models[0] ?? "unknown",
    detail: "Gemini request failed before a provider response was available.",
  };
}

function candidateText(response: GeminiResponse): string {
  return response.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() ?? "";
}

function candidateFinishReason(response: GeminiResponse): string {
  return response.candidates?.[0]?.finishReason ?? "FINISH_REASON_UNSPECIFIED";
}

export function completeChatAnswer(answer: string): string | null {
  const cleanedLines = answer
    .replace(/```(?:\w+)?/g, "")
    .split(/\r?\n/)
    .map((line) => line
      .trim()
      .replace(/^#{1,6}\s*/, "")
      .replace(/^>\s*/, "")
      .replace(/^(?:[*+]\s+)/, "- ")
      .replace(/\*\*|__/g, "")
      .replace(/[“”„"]/g, "")
      .replace(/[ \t]+/g, " ")
      .trim())
    .filter(Boolean);
  const bulletLines = cleanedLines.filter((line) => line.startsWith("- ")).slice(0, 5);

  if (bulletLines.length > 0) {
    const lead = cleanedLines.find((line) => !line.startsWith("- "));
    return [lead, ...bulletLines].filter(Boolean).join("\n");
  }

  const normalized = cleanedLines.join(" ").trim();
  const completeSentences = normalized.match(/[^.!?…]+[.!?…]+/gu)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [];

  if (completeSentences.length < 1) return null;

  const optionStartIndex = completeSentences.findIndex((sentence) => /^(?:If\b|You can\b|One option\b|Another option\b)/i.test(sentence));
  const optionSentences = optionStartIndex >= 0
    ? completeSentences.slice(optionStartIndex).filter((sentence) => /^(?:If\b|You can\b|One option\b|Another option\b)/i.test(sentence))
    : [];
  if (optionSentences.length >= 2) {
    const lead = completeSentences.slice(0, optionStartIndex).join(" ");
    return [lead, ...optionSentences.slice(0, 4).map((sentence) => `- ${sentence}`)].filter(Boolean).join("\n");
  }

  return completeSentences.slice(0, 3).join(" ");
}

function safeChatFallback(language: RoleFitChatInput["language"]): string {
  if (language === "he" || language === "mixed") {
    return "לא הצלחתי להשלים תשובה אמינה ברגע זה. אפשר לנסות שוב, והקשר השיחה יישמר.";
  }

  return "I could not complete a reliable answer just now. Please try again, and I will preserve the conversation context.";
}

export function createGeminiRoleFitProvider(): RoleFitModelProvider {
  return {
    name: "gemini",
    async generateChat(input: RoleFitChatInput): Promise<RoleFitChatResult> {
      const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY ?? process.env.GEMINI_API_KEY;
      const model = getGoogleAiStudioModel("chat");

      if (!apiKey || !model) {
        return {
          ok: false,
          provider: "gemini",
          model,
          error: "missing-configuration",
          safeMessageKey: "model.google_ai_studio_missing_configuration",
        };
      }

      const prompt = buildPortfolioAgentPrompt({
        mode: input.mode ?? "general-chat",
        language: input.language,
        runtimeState: input.runtimeState,
        approvedEvidence: input.approvedContext,
        conversationContext: input.conversationContext,
        userInput: input.message,
      });

      let response = await generateGeminiContent({
        apiKey,
        models: getCandidateModels(model),
        prompt,
        maxOutputTokens: input.maxOutputTokens,
        temperature: 0.25,
        thinkingLevel: "low",
      });

      if (!response.ok) {
        return {
          ok: false,
          provider: "gemini",
          model: response.model,
          error: "provider-error",
          safeMessageKey: "model.google_ai_studio_provider_error",
          detail: response.detail,
        };
      }

      let rawAnswer = candidateText(response.data);
      let answer = completeChatAnswer(rawAnswer);
      const shouldRetry = candidateFinishReason(response.data) === "MAX_TOKENS" || !answer;

      if (shouldRetry) {
        const retry = await generateGeminiContent({
          apiKey,
          models: getCandidateModels(model),
          prompt: `${prompt}\n\n---\n\nReturn a fresh, concise answer of 1-3 short complete sentences. One complete sentence is valid. End every sentence with punctuation and do not stop mid-sentence.`,
          maxOutputTokens: Math.max(input.maxOutputTokens * 2, 1800),
          temperature: 0.2,
          thinkingLevel: "low",
        });

        if (!retry.ok) {
          return { ok: true, provider: "gemini", model: response.model, answer: safeChatFallback(input.language) };
        }

        response = retry;
        rawAnswer = candidateText(response.data);
        answer = completeChatAnswer(rawAnswer);
      }

      if (!answer) {
        return { ok: true, provider: "gemini", model: response.model, answer: safeChatFallback(input.language) };
      }

      return {
        ok: true,
        provider: "gemini",
        model: response.model,
        answer,
      };
    },
    async generateReport(input: RoleFitModelInput): Promise<RoleFitModelResult> {
      const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY ?? process.env.GEMINI_API_KEY;
      const model = getGoogleAiStudioModel(input.task);

      if (!apiKey || !model) {
        return {
          ok: false,
          provider: "gemini",
          model,
          error: "missing-configuration",
          safeMessageKey: "model.google_ai_studio_missing_configuration",
        };
      }

      const prompt = buildPortfolioAgentPrompt({
        mode: input.mode ?? "fit-analysis",
        language: input.language,
        runtimeState: input.runtimeState ?? "The role was validated by the deterministic server runtime.",
        approvedEvidence: input.approvedEvidence,
        conversationContext: input.conversationContext,
        userInput: input.roleText,
      });
      const roleIndexConstraint = getRoleIndexConstraint(input.runtimeState);

      const reportPrompt = [
        prompt,
        "Return only qualitative report analysis. The application owns IDs, timestamps, links, evidence clusters, UI composition, and final schema validation.",
        `Exact qualitative analysis JSON Schema: ${reportAnalysisJsonSchema}`,
        roleIndexConstraint
          ? `Return at most ${roleIndexConstraint.maxItems} items. The only allowed roleItemIndex values are [${roleIndexConstraint.allowedIndexes.join(", ")}]. Use each index at most once and do not split one compound role item into several analysis items.`
          : "roleItemIndex must reference the zero-based roleItems list in Runtime State. Use each index at most once and do not rewrite, split, or add role requirements.",
        "Use only exact EVIDENCE_ID / APPROVED_SOURCE_ID values supplied in Retrieved Approved Evidence. ROLE_ITEM_CANDIDATE_SOURCE_IDS are ranked suggestions, not an authorization boundary. Resolve evidence in this order: direct case study, semantic/contextual case study, transferable case study, legitimate reuse, CV fallback, then insufficient evidence. Prefer an unused project only when alternatives are similarly relevant. The same canonical evidence ID may support multiple requirements when it truthfully supports each; the application will deduplicate its visible cluster. Positive or partial matches require at least one supporting evidenceSourceId. If the complete ladder yields no truthful support, classify that item as insufficient-evidence with no evidence ID; do not call absence of evidence a real gap.",
        "Each displayLabel must be a short capability name, not a sentence. Each shortRationale must be one concrete evidence-based insight and must not repeat the displayLabel.",
        "First identify the underlying professional capability. Keyword overlap is only for finding candidate evidence and never proves a match. Do not match from a shared word, similar title, buzzword, project name, or generic UX term alone.",
        "For every semantic or transferable item, sharedCapability, contextDifference, bridgeability, and unproven are required. State the common capability, the different context, why the difference is bridgeable or only partial, and what the approved evidence still does not prove.",
        "fitRationale must be exactly one concise factual sentence describing the shared domain, platform, or product context that connects the role to the approved evidence. Do not mention Shani by name, years of experience, card values, or use promotional language.",
        "Prefer varied public case-study evidence only after truthfulness, relevance, evidence strength, and case-study-first fallback. Never choose cosmetic diversity over stronger support.",
        "Do not create links, destinations, cluster IDs, report IDs, timestamps, UI payload fields, markdown, or explanations outside JSON.",
        "Keep the analysis to at most five role items. Strength and gap wording must be expressed through displayLabel and shortRationale on those same items, not through separate lists.",
      ].join("\n\n");

      let response = await generateGeminiContent({
        apiKey,
        models: getCandidateModels(model),
        prompt: reportPrompt,
        maxOutputTokens: input.maxOutputTokens,
        temperature: 0,
        responseMimeType: "application/json",
        thinkingLevel: "minimal",
      });

      let invalidDetail = "qualitative-analysis:unknown";

      for (let attempt = 0; attempt < 2; attempt += 1) {
        if (!response.ok) {
          return {
            ok: false,
            provider: "gemini",
            model: response.model,
            error: "provider-error",
            safeMessageKey: "model.google_ai_studio_provider_error",
            detail: response.detail,
          };
        }

        const finishReason = candidateFinishReason(response.data);
        const text = candidateText(response.data);

        if (finishReason === "MAX_TOKENS") {
          invalidDetail = "qualitative-analysis-finish-reason:MAX_TOKENS";
        } else if (!text) {
          invalidDetail = "qualitative-analysis-output:empty";
        } else {
          try {
            const parsed = qualitativeReportAnalysisSchema.safeParse(extractJson(text));
            if (parsed.success) {
              const indexes = parsed.data.items.map((item) => item.roleItemIndex);
              const hasInvalidIndex = roleIndexConstraint
                ? indexes.some((index) => !roleIndexConstraint.allowedIndexes.includes(index))
                : false;
              const hasDuplicateIndex = new Set(indexes).size !== indexes.length;
              if (!hasInvalidIndex && !hasDuplicateIndex) {
                return { ok: true, provider: "gemini", model: response.model, analysis: parsed.data satisfies QualitativeReportAnalysis };
              }
              invalidDetail = `qualitative-analysis-role-index:allowed=${roleIndexConstraint?.allowedIndexes.join(",") ?? "runtime"};received=${indexes.join(",")}`;
            } else {
              invalidDetail = `qualitative-analysis-schema:${safeSchemaDiagnostic(parsed.error)}`;
            }
          } catch {
            invalidDetail = "qualitative-analysis-json:invalid-json";
          }
        }

        if (attempt === 1) {
          return {
            ok: false,
            provider: "gemini",
            model: response.model,
            error: "invalid-output",
            safeMessageKey: invalidDetail === "qualitative-analysis-output:empty"
              ? "model.google_ai_studio_empty_output"
              : "model.google_ai_studio_invalid_report_payload",
            detail: invalidDetail,
          };
        }

        response = await generateGeminiContent({
          apiKey,
          models: getCandidateModels(model),
          prompt: `${reportPrompt}\n\nThe previous output was invalid (${invalidDetail}). Return one corrected, complete JSON object that satisfies the exact schema. Keep each rationale concise and do not add fields.`,
          maxOutputTokens: Math.max(input.maxOutputTokens * 2, 4000),
          temperature: 0,
          responseMimeType: "application/json",
          thinkingLevel: "minimal",
        });
      }

      return {
        ok: false,
        provider: "gemini",
        model,
        error: "invalid-output",
        safeMessageKey: "model.google_ai_studio_invalid_report_payload",
        detail: invalidDetail,
      };

    },
  };
}
