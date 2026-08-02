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
  thinkingLevel?: "low" | "medium" | "high";
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
  const normalized = answer.replace(/\s+/g, " ").trim();
  const completeSentences = normalized.match(/[^.!?…]+[.!?…]+/gu)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [];

  if (completeSentences.length < 2) return null;
  return completeSentences.slice(0, 5).join(" ");
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
          prompt: `${prompt}\n\n---\n\nReturn a fresh, concise answer of 2-5 short complete sentences. End every sentence with punctuation and do not stop mid-sentence.`,
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

      const reportPrompt = [
        prompt,
        "Return only qualitative report analysis. The application owns IDs, timestamps, links, evidence clusters, UI composition, and final schema validation.",
        `Exact qualitative analysis JSON Schema: ${reportAnalysisJsonSchema}`,
        "roleItemIndex must reference the zero-based roleItems list in Runtime State. Do not rewrite or add role requirements.",
        "Use only exact APPROVED_SOURCE_ID values supplied in Retrieved Approved Evidence. Prefer case-study evidence over CV/profile evidence whenever both support the same claim. Positive or partial matches require at least one supporting evidenceSourceId; gaps may use an empty list.",
        "Each displayLabel must be a short capability name, not a sentence. Each shortRationale must be one concrete evidence-based insight and must not repeat the displayLabel.",
        "fitRationale must be maximum two short sentences: sentence 1 says what the role is looking for; sentence 2 says why Shani's profile does or does not fit. Do not use inflated language or unsupported metrics.",
        "Do not repeat the same APPROVED_SOURCE_ID for multiple items unless it is clearly the strongest evidence for each item. Prefer varied public case-study evidence when available.",
        "Do not create links, destinations, cluster IDs, report IDs, timestamps, UI payload fields, markdown, or explanations outside JSON.",
        "Keep the analysis to at most five role items. Strength and gap wording must be expressed through displayLabel and shortRationale on those same items, not through separate lists.",
      ].join("\n\n");

      let response = await generateGeminiContent({
        apiKey,
        models: getCandidateModels(model),
        prompt: reportPrompt,
        maxOutputTokens: input.maxOutputTokens,
        temperature: 0.15,
        responseMimeType: "application/json",
      });

      if (response.ok && candidateFinishReason(response.data) === "MAX_TOKENS") {
        response = await generateGeminiContent({
          apiKey,
          models: getCandidateModels(model),
          prompt: `${reportPrompt}\n\nThe previous attempt reached its token limit. Return one complete JSON object that satisfies the schema; keep each rationale concise.`,
          maxOutputTokens: Math.max(input.maxOutputTokens * 2, 4000),
          temperature: 0.1,
          responseMimeType: "application/json",
        });
      }

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

      if (candidateFinishReason(response.data) === "MAX_TOKENS") {
        return {
          ok: false,
          provider: "gemini",
          model: response.model,
          error: "invalid-output",
          safeMessageKey: "model.google_ai_studio_invalid_report_payload",
          detail: "qualitative-analysis-finish-reason:MAX_TOKENS",
        };
      }

      const text = response.data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();

      if (!text) {
        return {
          ok: false,
          provider: "gemini",
          model: response.model,
          error: "invalid-output",
          safeMessageKey: "model.google_ai_studio_empty_output",
        };
      }

      try {
        const parsed = qualitativeReportAnalysisSchema.safeParse(extractJson(text));
        if (!parsed.success) {
          return {
            ok: false,
            provider: "gemini",
            model: response.model,
            error: "invalid-output",
            safeMessageKey: "model.google_ai_studio_invalid_report_payload",
            detail: `qualitative-analysis-schema:${safeSchemaDiagnostic(parsed.error)}`,
          };
        }

        return { ok: true, provider: "gemini", model: response.model, analysis: parsed.data satisfies QualitativeReportAnalysis };
      } catch {
        return {
          ok: false,
          provider: "gemini",
          model: response.model,
          error: "invalid-output",
          safeMessageKey: "model.google_ai_studio_invalid_report_payload",
          detail: "qualitative-analysis-json:invalid-json",
        };
      }

    },
  };
}
