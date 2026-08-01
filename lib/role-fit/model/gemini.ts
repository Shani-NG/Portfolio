import { z } from "zod";
import { buildPortfolioAgentPrompt } from "../prompts/assembly.ts";
import { getGoogleAiStudioModel } from "../runtime/policy.ts";
import type { QualitativeReportAnalysis, RoleFitChatInput, RoleFitChatResult, RoleFitModelInput, RoleFitModelProvider, RoleFitModelResult } from "./provider.ts";

type GeminiCandidate = {
  content?: {
    parts?: Array<{ text?: string }>;
  };
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
}): Promise<GeminiCallResult> {
  let lastError: GeminiCallResult | undefined;

  for (const model of input.models) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${input.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: input.prompt }] }],
        generationConfig: {
          maxOutputTokens: input.maxOutputTokens,
          temperature: input.temperature,
          ...(input.responseMimeType ? { responseMimeType: input.responseMimeType } : {}),
        },
      }),
    });

    if (response.ok) {
      return {
        ok: true,
        model,
        data: (await response.json()) as GeminiResponse,
      };
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

function limitChatAnswer(answer: string): string {
  const lines = answer.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const limited: string[] = [];
  let sentenceCount = 0;

  for (const line of lines) {
    const prefix = /^[-*]\s+/.test(line) ? line.match(/^[-*]\s+/)?.[0] ?? "" : "";
    const content = prefix ? line.slice(prefix.length) : line;
    const sentences = content.split(/(?<=[.!?])\s+/).filter(Boolean);

    for (const sentence of sentences) {
      if (sentenceCount >= 4) return limited.join("\n");
      limited.push(`${prefix}${sentence}`);
      sentenceCount += 1;
    }
  }

  return limited.join("\n");
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

      const response = await generateGeminiContent({
        apiKey,
        models: getCandidateModels(model),
        prompt,
        maxOutputTokens: input.maxOutputTokens,
        temperature: 0.25,
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

      const answer = response.data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();

      if (!answer) {
        return {
          ok: false,
          provider: "gemini",
          model: response.model,
          error: "invalid-output",
          safeMessageKey: "model.google_ai_studio_empty_output",
        };
      }

      return {
        ok: true,
        provider: "gemini",
        model: response.model,
        answer: limitChatAnswer(answer),
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
        "Use only exact APPROVED_SOURCE_ID values supplied in Retrieved Approved Evidence. Positive or partial matches require at least one supporting evidenceSourceId; gaps may use an empty list.",
        "Do not create links, destinations, cluster IDs, report IDs, timestamps, UI payload fields, markdown, or explanations outside JSON.",
        "Keep the analysis to at most five role items. Strength and gap wording must be expressed through displayLabel and shortRationale on those same items, not through separate lists.",
      ].join("\n\n");

      const response = await generateGeminiContent({
        apiKey,
        models: getCandidateModels(model),
        prompt: reportPrompt,
        maxOutputTokens: input.maxOutputTokens,
        temperature: 0.15,
        responseMimeType: "application/json",
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
