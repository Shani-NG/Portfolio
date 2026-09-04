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

export function cacheJobFitEvaluation(evaluationKey: string, result: JobFitEvaluatorResponse) {
  if (!isFinalResult(result)) return false;
  cache.set(evaluationKey, { result, expiresAt: Date.now() + cacheTtlMs });
  return true;
}

export async function evaluateJobFitOnce(
  evaluationKey: string,
  evaluate: () => Promise<JobFitEvaluatorResponse>,
): Promise<JobFitEvaluatorResponse> {
  const active = inFlight.get(evaluationKey);
  if (active) return active;

  const evaluation = evaluate().finally(() => {
    inFlight.delete(evaluationKey);
  });
  inFlight.set(evaluationKey, evaluation);
  return evaluation;
}

export function resetJobFitRetryStateForTest() {
  cache.clear();
  inFlight.clear();
}
