import { z } from "zod";
import { reportUIPayloadSchema, type ReportUIPayload } from "../contracts/index.ts";
import { buildPortfolioAgentPrompt } from "../prompts/assembly.ts";
import { getGoogleAiStudioModel } from "../runtime/policy.ts";
import type { RoleFitChatInput, RoleFitChatResult, RoleFitModelInput, RoleFitModelProvider, RoleFitModelResult } from "./provider.ts";

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

const reportJsonSchema = JSON.stringify(z.toJSONSchema(reportUIPayloadSchema));

function normalizeGeminiModel(model: string): string {
  return model.replace(/^models\//, "");
}

function getCandidateModels(model: string): string[] {
  return [normalizeGeminiModel(model)];
}

function reportUsesOnlyApprovedEvidence(report: ReportUIPayload, approvedEvidence: string | undefined) {
  const approvedSourceIds = new Set(
    Array.from(approvedEvidence?.matchAll(/^### APPROVED_SOURCE_ID: ([a-z0-9-]+)$/gim) ?? [], (match) => match[1]),
  );
  const clusterIds = new Set(report.evidencePanel.clusters.map((cluster) => cluster.clusterId));
  const reportItems = [
    ...report.skillsMatch.items,
    ...report.requirementMapping.items,
  ];
  const reportItemsById = new Map(reportItems.map((item) => [item.itemId, item]));

  if (report.evidencePanel.clusters.some((cluster) => cluster.evidenceIds.length === 0 || cluster.evidenceIds.some((id) => !approvedSourceIds.has(id)))) {
    return false;
  }

  const referencesAreValid = reportItems.every((item) => {
    if (item.clusterIds.some((clusterId) => !clusterIds.has(clusterId))) return false;
    const requiresEvidence = ["direct", "semantic", "transferable", "partial"].includes(item.matchType);
    return !requiresEvidence || item.clusterIds.length > 0;
  });

  const strengthsAreDerived = report.topStrengths.items.every((item) => reportItemsById.get(item.itemId)?.impact === "strength");
  const gapsAreDerived = report.keyGaps.items.every((item) => reportItemsById.get(item.itemId)?.impact === "gap");
  const visibleLimitsAreValid =
    report.requirementMapping.items.length <= 5 &&
    report.topStrengths.items.length <= 5 &&
    report.keyGaps.items.length <= 3;

  return referencesAreValid && strengthsAreDerived && gapsAreDerived && visibleLimitsAreValid;
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
        "Return only one JSON object matching the browser-facing ReportUIPayload contract.",
        "Required top-level keys: schemaVersion, reportId, createdAt, language, state, roleSnapshot, overallFitVisual, evidenceConfidence, skillsMatch, requirementMapping, evidencePanel, topStrengths, keyGaps, disclaimer, contactCta.",
        `Exact JSON Schema: ${reportJsonSchema}`,
        "Use only evidence present in Retrieved Approved Evidence. In evidencePanel clusters, evidenceIds must contain only the exact APPROVED_SOURCE_ID values supplied by the application. Every positive or partial item must reference a valid clusterId.",
        "Keep requirementMapping to at most 5 items, topStrengths to 3-5 evidence-backed items when available, and keyGaps to at most 3 items. Top strengths and key gaps must reuse the same itemId and object content from skillsMatch or requirementMapping; do not generate them independently.",
        "Do not return markdown, explanations outside JSON, numeric scores as visible text, or fields not in the contract.",
        "If evidence is insufficient, use overallFitVisual.mode=insufficient and keep unsupported items empty; do not invent evidence.",
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
        const parsed = reportUIPayloadSchema.safeParse(extractJson(text));
        if (!parsed.success || !reportUsesOnlyApprovedEvidence(parsed.data, input.approvedEvidence)) {
          return {
            ok: false,
            provider: "gemini",
            model: response.model,
            error: "invalid-output",
            safeMessageKey: "model.google_ai_studio_invalid_report_payload",
          };
        }

        return { ok: true, provider: "gemini", model: response.model, report: parsed.data };
      } catch {
        return {
          ok: false,
          provider: "gemini",
          model: response.model,
          error: "invalid-output",
          safeMessageKey: "model.google_ai_studio_invalid_report_payload",
        };
      }
    },
  };
}
