import { reportUIPayloadSchema } from "../contracts/index.ts";
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

type GeminiCallResult =
  | { ok: true; model: string; data: GeminiResponse }
  | { ok: false; model: string; detail: string };

const geminiFallbackModels = ["gemini-2.5-flash", "gemini-1.5-flash"];

function normalizeGeminiModel(model: string): string {
  return model.replace(/^models\//, "");
}

function getCandidateModels(model: string): string[] {
  return Array.from(new Set([normalizeGeminiModel(model), ...geminiFallbackModels]));
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

function extractLabeledValue(roleText: string, labels: string[], fallback: string): string {
  const lines = roleText.split(/\r?\n/).map((line) => line.trim());

  for (const label of labels) {
    const match = lines.find((line) => line.toLowerCase().startsWith(`${label.toLowerCase()}:`));
    if (match) return match.slice(label.length + 1).trim() || fallback;
  }

  return fallback;
}

function createEvidenceLimitedReport(input: RoleFitModelInput, model: string, modelText: string) {
  const now = new Date().toISOString();
  const company = extractLabeledValue(input.roleText, ["company", "organization"], "Submitted company");
  const title = extractLabeledValue(input.roleText, ["title", "role"], "Submitted role");
  const rationale = modelText.length > 900 ? `${modelText.slice(0, 897)}...` : modelText;

  return reportUIPayloadSchema.parse({
    schemaVersion: "1.0",
    reportId: `rpt_gemini_${Date.now()}`,
    createdAt: now,
    language: input.language === "he" ? "he" : "en",
    state: "ready",
    roleSnapshot: {
      company,
      title,
    },
    overallFitVisual: {
      mode: "insufficient",
      label: "Live model connected; evidence analysis pending",
      rationale,
    },
    evidenceConfidence: {
      level: "insufficient",
      rationale: `Gemini responded through the server-side provider (${model}), but approved portfolio evidence retrieval is not enabled in this vertical slice yet.`,
    },
    skillsMatch: {
      items: [],
      visualCoverage: {
        mode: "qualitative",
        label: "Pending approved evidence mapping",
      },
    },
    requirementMapping: {
      items: [],
    },
    evidencePanel: {
      clusters: [],
    },
    topStrengths: {
      items: [],
    },
    keyGaps: {
      items: [],
    },
    disclaimer: {
      copyKey: "report.disclaimer.v1",
      text: "This qualitative report must be based only on approved portfolio evidence. The current response confirms the live model connection and does not yet represent a completed evidence-based fit report.",
    },
    contactCta: {
      variant: "insufficient",
      label: "Contact Shani",
      enabled: true,
    },
  });
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

      const prompt = [
        "You are Shani Nakash-Gomel's portfolio conversation agent.",
        "Answer in the user's active language when clear.",
        "Keep normal conversation to no more than four short sentences.",
        "When structure helps, use at most three short bullets.",
        "Ask only one focused clarification question at a time.",
        "Do not repeat information the user already provided.",
        "Use only the approved context below for professional claims.",
        "Do not invent achievements, metrics, clients, recommendations, rankings, or hiring decisions.",
        "Do not generate a role-fit report in chat. If the user asks for a report or fit analysis, explain that the role details must be validated and explicitly confirmed first.",
        "For unclear general questions, ask one focused clarifying question or answer with a brief relevant direction.",
        `Approved context:\n${input.approvedContext}`,
        `User message:\n${input.message}`,
      ].join("\n\n");

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

      const prompt = [
        "Answer in one concise paragraph.",
        "This is a server-side connectivity check for a portfolio Role Fit Agent vertical slice.",
        "Do not include a visible numeric score, percentage, ranking, or hiring recommendation.",
        "Do not invent portfolio evidence, claims, metrics, clients, or project details.",
        "State that approved evidence retrieval is still required before a real qualitative fit report can be produced.",
        `Role text:\n${input.roleText}`,
      ].join("\n\n");

      const response = await generateGeminiContent({
        apiKey,
        models: getCandidateModels(model),
        prompt,
        maxOutputTokens: input.maxOutputTokens,
        temperature: 0.2,
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

      return {
        ok: true,
        provider: "gemini",
        model: response.model,
        report: createEvidenceLimitedReport(input, response.model, text),
      };
    },
  };
}
