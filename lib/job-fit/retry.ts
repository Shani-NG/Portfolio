import type { JobFitEvaluatorResponse } from "./contracts";

type CachedEvaluation = { result: JobFitEvaluatorResponse; expiresAt: number };

const cache = new Map<string, CachedEvaluation>();
const inFlight = new Map<string, Promise<JobFitEvaluatorResponse>>();
const cacheTtlMs = 15 * 60 * 1_000;

function isFinalResult(result: JobFitEvaluatorResponse) {
  return result.state === "ready" || result.state === "rejected" || result.state === "insufficient-evidence";
}

export function getCachedJobFitEvaluation(evaluationKey: string) {
  const entry = cache.get(evaluationKey);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(evaluationKey);
    return undefined;
  }
  return entry.result;
}

export function hasInFlightJobFitEvaluation(evaluationKey: string) {
  return inFlight.has(evaluationKey);
}

export async function evaluateJobFitOnce(
  evaluationKey: string,
  evaluate: () => Promise<JobFitEvaluatorResponse>,
): Promise<JobFitEvaluatorResponse> {
  const cached = getCachedJobFitEvaluation(evaluationKey);
  if (cached) return cached;

  const active = inFlight.get(evaluationKey);
  if (active) return active;

  const evaluation = evaluate().then((result) => {
    if (isFinalResult(result)) cache.set(evaluationKey, { result, expiresAt: Date.now() + cacheTtlMs });
    return result;
  }).finally(() => {
    inFlight.delete(evaluationKey);
  });
  inFlight.set(evaluationKey, evaluation);
  return evaluation;
}

export function resetJobFitRetryStateForTest() {
  cache.clear();
  inFlight.clear();
}
