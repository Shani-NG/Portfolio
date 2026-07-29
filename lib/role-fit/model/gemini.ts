import { reportUIPayloadSchema } from "../contracts/index.ts";
import { getGoogleAiStudioModel } from "../runtime/policy.ts";
import type { RoleFitModelInput, RoleFitModelProvider, RoleFitModelResult } from "./provider.ts";

type GeminiCandidate = {
  content?: {
    parts?: Array<{ text?: string }>;
  };
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
};

function normalizeGeminiModel(model: string): string {
  return model.replace(/^models\//, "");
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

      const normalizedModel = normalizeGeminiModel(model);
      const prompt = [
        "Answer in one concise paragraph.",
        "This is a server-side connectivity check for a portfolio Role Fit Agent vertical slice.",
        "Do not include a visible numeric score, percentage, ranking, or hiring recommendation.",
        "Do not invent portfolio evidence, claims, metrics, clients, or project details.",
        "State that approved evidence retrieval is still required before a real qualitative fit report can be produced.",
        `Role text:\n${input.roleText}`,
      ].join("\n\n");

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(normalizedModel)}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            maxOutputTokens: input.maxOutputTokens,
            temperature: 0.2,
          },
        }),
      });

      if (!response.ok) {
        return {
          ok: false,
          provider: "gemini",
          model: normalizedModel,
          error: "provider-error",
          safeMessageKey: "model.google_ai_studio_provider_error",
          detail: `${response.status} ${response.statusText}`,
        };
      }

      const data = (await response.json()) as GeminiResponse;
      const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();

      if (!text) {
        return {
          ok: false,
          provider: "gemini",
          model: normalizedModel,
          error: "invalid-output",
          safeMessageKey: "model.google_ai_studio_empty_output",
        };
      }

      return {
        ok: true,
        provider: "gemini",
        model: normalizedModel,
        report: createEvidenceLimitedReport(input, normalizedModel, text),
      };
    },
  };
}
