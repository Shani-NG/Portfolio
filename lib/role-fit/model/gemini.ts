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

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return JSON.parse(fenced?.[1] ?? trimmed);
}

export function createGeminiRoleFitProvider(): RoleFitModelProvider {
  return {
    name: "gemini",
    async generateReport(input: RoleFitModelInput): Promise<RoleFitModelResult> {
      const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
      const model = getGoogleAiStudioModel(input.task);

      if (!apiKey || !model) {
        return {
          ok: false,
          provider: "gemini",
          error: "missing-configuration",
          safeMessageKey: "model.google_ai_studio_missing_configuration",
        };
      }

      const prompt = [
        "Return only valid JSON matching the approved ReportUIPayload schema.",
        "Do not include a visible numeric score, percentage, ranking, or hiring recommendation.",
        "Do not invent portfolio evidence. If approved evidence is unavailable, return an evidence-limited qualitative placeholder with empty evidence arrays.",
        "This temporary vertical slice verifies provider connectivity; full evidence retrieval is not enabled yet.",
        `Role text:\n${input.roleText}`,
      ].join("\n\n");

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`, {
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
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        }),
      });

      if (!response.ok) {
        return {
          ok: false,
          provider: "gemini",
          error: "provider-error",
          safeMessageKey: "model.google_ai_studio_provider_error",
        };
      }

      const data = (await response.json()) as GeminiResponse;
      const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();

      if (!text) {
        return {
          ok: false,
          provider: "gemini",
          error: "invalid-output",
          safeMessageKey: "model.google_ai_studio_empty_output",
        };
      }

      const parsed = reportUIPayloadSchema.safeParse(extractJson(text));

      if (!parsed.success) {
        return {
          ok: false,
          provider: "gemini",
          error: "invalid-output",
          safeMessageKey: "model.google_ai_studio_invalid_report_payload",
        };
      }

      return {
        ok: true,
        provider: "gemini",
        report: parsed.data,
      };
    },
  };
}
