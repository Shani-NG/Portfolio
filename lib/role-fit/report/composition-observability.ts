import type { RoleFitModelResult } from "../model/provider.ts";

type FailedModelResult = Extract<RoleFitModelResult, { ok: false }>;

export type CompositionRepairOutcome =
  | "not-attempted"
  | "repair-call-failed"
  | "repaired-output-still-invalid";

export function createCompositionFailureMetadata(input: {
  traceId: string;
  provider: string;
  model: string;
  originalDiagnostic: string;
  repairOutcome: CompositionRepairOutcome;
  repairFailureCategory?: FailedModelResult["error"];
  finalDiagnostic: string;
}) {
  return {
    traceId: input.traceId,
    provider: input.provider,
    model: input.model,
    originalDiagnostic: input.originalDiagnostic,
    repairAttempted: input.repairOutcome !== "not-attempted",
    repairOutcome: input.repairOutcome,
    ...(input.repairFailureCategory ? { repairFailureCategory: input.repairFailureCategory } : {}),
    finalDiagnostic: input.finalDiagnostic,
  };
}
