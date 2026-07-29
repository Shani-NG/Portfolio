import { reportUIPayloadSchema } from "../contracts/index.ts";
import type { RoleFitChatInput, RoleFitChatResult, RoleFitModelInput, RoleFitModelProvider, RoleFitModelResult } from "./provider.ts";

export function createMockRoleFitProvider(): RoleFitModelProvider {
  return {
    name: "mock",
    async generateChat(input: RoleFitChatInput): Promise<RoleFitChatResult> {
      return {
        ok: true,
        provider: "mock",
        model: "mock-local",
        answer: `I can help with that. In this local mock mode, I can preserve the conversation flow and ask for the next useful detail, but Gemini is not being called. Your message was: "${input.message.slice(0, 220)}"`,
      };
    },
    async generateReport(input: RoleFitModelInput): Promise<RoleFitModelResult> {
      const report = reportUIPayloadSchema.parse({
        schemaVersion: "1.0",
        reportId: `rpt_mock_${Date.now()}`,
        createdAt: new Date().toISOString(),
        language: input.language === "he" ? "he" : "en",
        state: "ready",
        roleSnapshot: {
          company: "Submitted company",
          title: "Submitted role",
        },
        overallFitVisual: {
          mode: "fit",
          level: "partial",
          fitVisualValue: 45,
          illustrationKey: "fit-partial",
          colorToken: "fit.partial",
          label: "Initial qualitative fit",
          rationale: "This is a schema-valid placeholder report used to verify the live connection path. It is not a final AI-generated evidence assessment.",
          qualifiers: ["evidence-limited"],
        },
        evidenceConfidence: {
          level: "low",
          rationale: `The live evidence retrieval and Gemini report generation steps are not yet enabled in this local mock mode. Task: ${input.task}. Output limit: ${input.maxOutputTokens} tokens.`,
        },
        skillsMatch: {
          items: [],
          visualCoverage: {
            mode: "qualitative",
            label: "Pending evidence mapping",
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
          text: "This qualitative report is based on the submitted role description and approved portfolio evidence. It is not an ATS decision, does not replace human judgment, and the visual fit indicator is not a literal numeric score.",
        },
        contactCta: {
          variant: "partial",
          label: "Contact Shani",
          enabled: true,
        },
      });

      return {
        ok: true,
        provider: "mock",
        model: "mock-local",
        report,
      };
    },
  };
}
