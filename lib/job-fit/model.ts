import { getGoogleAiStudioModel } from "../role-fit/runtime/policy.ts";

/**
 * Resolves the model for the canonical Job Fit evaluator only.
 * The dedicated override is intentionally independent from Chat and Report.
 */
export function getJobFitModel(): string | undefined {
  const dedicatedModel = process.env.GOOGLE_AI_STUDIO_JOB_FIT_MODEL?.trim();
  return dedicatedModel || getGoogleAiStudioModel("analysis");
}
