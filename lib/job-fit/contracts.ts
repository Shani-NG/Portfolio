import { z } from "zod";

const cleanText = z.string().trim().min(1).max(12_000);
const structuredItem = z.string().trim().min(18).max(1_000);

export const normalizedJobCandidateSchema = z
  .object({
    sourceDedupeKey: z.string().trim().min(12).max(1_000),
    contentHash: z.string().trim().regex(/^[a-f0-9]{32,128}$/i),
    role: z.string().trim().min(2).max(500),
    company: z.string().trim().min(1).max(500),
    location: z.string().trim().max(160).nullable(),
    workModel: z.enum(["on-site", "hybrid", "remote", "unknown"]).nullable(),
    cleanedJobContent: cleanText.min(240),
    conciseRoleSummary: z.string().trim().min(24).max(1_200),
    responsibilities: z.array(structuredItem).min(1).max(80),
    requirements: z.array(structuredItem).min(1).max(80),
    preferredQualifications: z.array(structuredItem).max(80).default([]),
    language: z.enum(["he", "en", "mixed"]).default("en"),
  })
  .strict();

export type NormalizedJobCandidate = z.infer<typeof normalizedJobCandidateSchema>;

export const jobFitActionSchema = z.enum(["APPLY", "APPLY WITH POSITIONING", "CONSIDER", "LOW PRIORITY"]);
export const jobFitLabelSchema = z.enum(["Strong", "Good", "Partial", "Insufficient Evidence"]);

export type JobFitRequirementAssessment = {
  requirement: string;
  source: "requirement" | "responsibility";
  importance: "must-have" | "core" | "supporting";
  matchType: "direct" | "semantic" | "transferable" | "partial" | "insufficient-evidence" | "real-gap";
  impact: "strength" | "gap" | "neutral";
  evidenceConfidence: "high" | "medium" | "low" | "insufficient";
  rationale: string;
  evidenceSourceIds: string[];
};

export type JobFitEvaluatorResponse =
  | {
      state: "ready";
      fitLabel: z.infer<typeof jobFitLabelSchema>;
      recommendedAction: z.infer<typeof jobFitActionSchema>;
      cvPositioningGuidance: string;
      rationale: string;
      evidenceConfidence: { level: "high" | "medium" | "low" | "insufficient"; rationale: string };
      requirementAssessments: JobFitRequirementAssessment[];
      strengths: string[];
      gaps: string[];
    }
  | {
      state: "insufficient-evidence" | "rejected" | "quota-blocked" | "validation-failed" | "model-unavailable";
      reason: string;
      rationale?: string;
      requirementAssessments?: JobFitRequirementAssessment[];
    };
