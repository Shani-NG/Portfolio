import type { NormalizedJobCandidate, JobFitEvaluatorResponse } from "./contracts.ts";
import { evaluateCanonicalJobFit, evaluationKeyForCandidate } from "./evaluate.ts";
import { recordJobEvaluatorCompletion, reserveJobEvaluatorSlot } from "./quota.ts";
import { cacheJobFitEvaluation, evaluateJobFitOnce, getCachedJobFitEvaluation } from "./retry.ts";

type EvaluationHttpResult = {
  body: JobFitEvaluatorResponse;
  status: number;
  headers?: Record<string, string>;
};

type EvaluationDependencies = {
  evaluationKeyForCandidate: typeof evaluationKeyForCandidate;
  getCached: typeof getCachedJobFitEvaluation;
  cache: typeof cacheJobFitEvaluation;
  reserve: typeof reserveJobEvaluatorSlot;
  evaluateOnce: typeof evaluateJobFitOnce;
  evaluate: typeof evaluateCanonicalJobFit;
  complete: typeof recordJobEvaluatorCompletion;
};

const defaultDependencies: EvaluationDependencies = {
  evaluationKeyForCandidate,
  getCached: getCachedJobFitEvaluation,
  cache: cacheJobFitEvaluation,
  reserve: reserveJobEvaluatorSlot,
  evaluateOnce: evaluateJobFitOnce,
  evaluate: evaluateCanonicalJobFit,
  complete: recordJobEvaluatorCompletion,
};

export async function runJobFitEvaluation(
  candidate: NormalizedJobCandidate,
  dependencies: EvaluationDependencies = defaultDependencies,
): Promise<EvaluationHttpResult> {
  const evaluationKey = dependencies.evaluationKeyForCandidate(candidate);
  const cached = dependencies.getCached(evaluationKey);
  if (cached) return httpResult(cached);

  const reservation = await dependencies.reserve(evaluationKey);
  if (!reservation.ok) {
    return {
      body: {
        state: reservation.reason === "quota-blocked" ? "quota-blocked" : "model-unavailable",
        reason: reservation.reason,
      },
      status: reservation.reason === "quota-blocked" ? 429 : 503,
    };
  }

  if (reservation.outcome === "in_progress") {
    return {
      body: { state: "model-unavailable", reason: "evaluation-in-progress" },
      status: 503,
      headers: { "Retry-After": String(reservation.retryAfterSeconds) },
    };
  }

  const result = await dependencies.evaluateOnce(evaluationKey, () => dependencies.evaluate(candidate));
  const diagnostics = result.state === "model-unavailable" ? result.diagnostics : undefined;
  const completion = await dependencies.complete(evaluationKey, result.state, reservation.attemptToken, diagnostics);
  if (!completion.ok) {
    return { body: { state: "model-unavailable", reason: "evaluation-completion-unavailable" }, status: 503 };
  }
  if (!completion.accepted) {
    return { body: { state: "model-unavailable", reason: "evaluation-superseded" }, status: 503 };
  }
  dependencies.cache(evaluationKey, result);
  return httpResult(result);
}

function httpResult(result: JobFitEvaluatorResponse): EvaluationHttpResult {
  const body = stripInternalDiagnostics(result);
  if (body.state === "ready" || body.state === "insufficient-evidence") return { body, status: 200 };
  if (body.state === "model-unavailable") return { body, status: 503 };
  if (body.state === "quota-blocked") return { body, status: 429 };
  return { body, status: 422 };
}

function stripInternalDiagnostics(result: JobFitEvaluatorResponse): JobFitEvaluatorResponse {
  if (!("diagnostics" in result)) return result;
  const { diagnostics: _diagnostics, ...publicResult } = result;
  return publicResult;
}
