import assert from "node:assert/strict";
import test from "node:test";
import type { JobFitEvaluatorResponse, NormalizedJobCandidate } from "./contracts.ts";
import { runJobFitEvaluation } from "./evaluation-service.ts";
import {
  cacheJobFitEvaluation,
  evaluateJobFitOnce,
  getCachedJobFitEvaluation,
  resetJobFitRetryStateForTest,
} from "./retry.ts";

const candidate: NormalizedJobCandidate = {
  sourceDedupeKey: "company-example-solution-architect-2026",
  role: "Solution Architect",
  company: "Example",
  location: "Tel Aviv",
  workModel: "hybrid",
  cleanedJobContent: "A sufficiently detailed normalized job description for a solution architect who leads discovery, maps technical requirements, partners with product and engineering teams, communicates with enterprise customers, validates implementation constraints, and translates complex platform capabilities into reliable operational solutions for emerging products.",
  conciseRoleSummary: "Solution architecture role connecting customer needs with complex product implementation.",
  responsibilities: ["Lead technical discovery and translate customer requirements into reliable implementation plans."],
  requirements: ["Experience connecting complex platform capabilities with enterprise customer requirements."],
  preferredQualifications: [],
  language: "en",
};

const readyResult: JobFitEvaluatorResponse = {
  state: "ready",
  fitLabel: "Good",
  recommendedAction: "APPLY WITH POSITIONING",
  cvPositioningGuidance: "Use approved evidence.",
  rationale: "Approved evidence supports the role.",
  evidenceConfidence: { level: "high", rationale: "Evidence is direct." },
  requirementAssessments: [],
  strengths: [],
  gaps: [],
};

test.afterEach(() => resetJobFitRetryStateForTest());

function dependencies(overrides: Record<string, unknown> = {}) {
  return {
    evaluationKeyForCandidate: () => "stable-key",
    getCached: () => undefined,
    cache: () => false,
    reserve: async () => ({ ok: true as const, outcome: "reserved" as const, dailyCount: 1, attemptToken: "attempt-1", leaseExpiresAt: "2026-09-03T12:02:00Z" }),
    evaluateOnce: async (_key: string, evaluate: () => Promise<JobFitEvaluatorResponse>) => evaluate(),
    evaluate: async () => readyResult,
    complete: async () => ({ ok: true as const, accepted: true }),
    ...overrides,
  };
}

test("a real cached result is returned without reservation or model execution", async () => {
  let reservations = 0;
  let evaluations = 0;
  const result = await runJobFitEvaluation(candidate, dependencies({
    getCached: () => readyResult,
    reserve: async () => { reservations += 1; throw new Error("must not reserve"); },
    evaluate: async () => { evaluations += 1; return readyResult; },
  }));
  assert.equal(result.status, 200);
  assert.equal(reservations, 0);
  assert.equal(evaluations, 0);
});

test("an active attempt owned by another instance returns deterministic 503 without a duplicate model call", async () => {
  let evaluations = 0;
  const result = await runJobFitEvaluation(candidate, dependencies({
    reserve: async () => ({ ok: true as const, outcome: "in_progress" as const, dailyCount: 1, retryAfterSeconds: 17, leaseExpiresAt: "2026-09-03T12:02:00Z" }),
    evaluate: async () => { evaluations += 1; return readyResult; },
  }));
  assert.deepEqual(result, { body: { state: "model-unavailable", reason: "evaluation-in-progress" }, status: 503, headers: { "Retry-After": "17" } });
  assert.equal(evaluations, 0);
});

test("two concurrent instances for the same key start only one canonical evaluation", async () => {
  let reservationCalls = 0;
  let modelCalls = 0;
  let releaseEvaluation: (() => void) | undefined;
  let signalStarted: (() => void) | undefined;
  const evaluationStarted = new Promise<void>((resolve) => { signalStarted = resolve; });
  const evaluationGate = new Promise<void>((resolve) => { releaseEvaluation = resolve; });
  const shared = dependencies({
    reserve: async () => {
      reservationCalls += 1;
      return reservationCalls === 1
        ? { ok: true as const, outcome: "reserved" as const, dailyCount: 1, attemptToken: "attempt-1", leaseExpiresAt: "2026-09-03T12:02:00Z" }
        : { ok: true as const, outcome: "in_progress" as const, dailyCount: 1, retryAfterSeconds: 90, leaseExpiresAt: "2026-09-03T12:02:00Z" };
    },
    evaluate: async () => {
      modelCalls += 1;
      signalStarted?.();
      await evaluationGate;
      return readyResult;
    },
  });

  const first = runJobFitEvaluation(candidate, shared);
  await evaluationStarted;
  const second = await runJobFitEvaluation(candidate, shared);
  releaseEvaluation?.();
  const firstResult = await first;

  assert.equal(firstResult.status, 200);
  assert.equal(second.status, 503);
  assert.equal(second.body.state, "model-unavailable");
  assert.equal(modelCalls, 1);
});

test("in_progress returns 503 even when a local evaluation is in flight", async () => {
  let evaluateOnceCalls = 0;
  let releaseEvaluation: (() => void) | undefined;
  let signalStarted: (() => void) | undefined;
  const evaluationStarted = new Promise<void>((resolve) => { signalStarted = resolve; });
  const evaluationGate = new Promise<void>((resolve) => { releaseEvaluation = resolve; });
  const localEvaluation = evaluateJobFitOnce("stable-key", async () => {
    signalStarted?.();
    await evaluationGate;
    return readyResult;
  });
  await evaluationStarted;

  const result = await runJobFitEvaluation(candidate, dependencies({
    reserve: async () => ({ ok: true as const, outcome: "in_progress" as const, dailyCount: 1, retryAfterSeconds: 10, leaseExpiresAt: "2026-09-03T12:02:00Z" }),
    evaluateOnce: async () => { evaluateOnceCalls += 1; return readyResult; },
  }));

  assert.deepEqual(result, { body: { state: "model-unavailable", reason: "evaluation-in-progress" }, status: 503, headers: { "Retry-After": "10" } });
  assert.equal(evaluateOnceCalls, 0);
  releaseEvaluation?.();
  await localEvaluation;
});

test("a transient failure becomes immediately retryable and a later attempt can succeed", async () => {
  let reservationCall = 0;
  let evaluationCall = 0;
  const completionTokens: string[] = [];
  const shared = dependencies({
    getCached: getCachedJobFitEvaluation,
    cache: cacheJobFitEvaluation,
    reserve: async () => {
      reservationCall += 1;
      return { ok: true as const, outcome: reservationCall === 1 ? "reserved" as const : "retry_reserved" as const, dailyCount: 1, attemptToken: `attempt-${reservationCall}`, leaseExpiresAt: "2026-09-03T12:02:00Z" };
    },
    evaluate: async () => {
      evaluationCall += 1;
      return evaluationCall === 1
        ? { state: "model-unavailable" as const, reason: "provider-timeout", diagnostics: { provider: "gemini" as const, failureCategory: "provider_timeout" as const, retryable: true } }
        : readyResult;
    },
    complete: async (_key: string, _state: string, token: string) => { completionTokens.push(token); return { ok: true as const, accepted: true }; },
  });
  const first = await runJobFitEvaluation(candidate, shared);
  assert.equal(getCachedJobFitEvaluation("stable-key"), undefined);
  const second = await runJobFitEvaluation(candidate, shared);
  assert.deepEqual(first, { body: { state: "model-unavailable", reason: "provider-timeout" }, status: 503 });
  assert.equal(second.status, 200);
  assert.equal(evaluationCall, 2);
  assert.deepEqual(completionTokens, ["attempt-1", "attempt-2"]);
  assert.deepEqual(getCachedJobFitEvaluation("stable-key"), readyResult);
});

test("completed metadata without a cached result permits a freshly fenced evaluation", async () => {
  let evaluations = 0;
  const result = await runJobFitEvaluation(candidate, dependencies({
    reserve: async () => ({ ok: true as const, outcome: "retry_reserved" as const, dailyCount: 1, attemptToken: "attempt-after-completion", leaseExpiresAt: "2026-09-03T12:02:00Z" }),
    evaluate: async () => { evaluations += 1; return readyResult; },
  }));
  assert.equal(result.status, 200);
  assert.equal(evaluations, 1);
});

test("a superseded ready result is not cached or replayed by a subsequent request", async () => {
  let reservations = 0;
  const shared = dependencies({
    getCached: getCachedJobFitEvaluation,
    cache: cacheJobFitEvaluation,
    reserve: async () => {
      reservations += 1;
      return reservations === 1
        ? { ok: true as const, outcome: "reserved" as const, dailyCount: 1, attemptToken: "attempt-1", leaseExpiresAt: "2026-09-03T12:02:00Z" }
        : { ok: true as const, outcome: "in_progress" as const, dailyCount: 1, retryAfterSeconds: 12, leaseExpiresAt: "2026-09-03T12:02:00Z" };
    },
    complete: async () => ({ ok: true as const, accepted: false }),
  });

  const result = await runJobFitEvaluation(candidate, shared);
  assert.deepEqual(result, { body: { state: "model-unavailable", reason: "evaluation-superseded" }, status: 503 });
  assert.equal(getCachedJobFitEvaluation("stable-key"), undefined);

  const subsequent = await runJobFitEvaluation(candidate, shared);
  assert.deepEqual(subsequent, { body: { state: "model-unavailable", reason: "evaluation-in-progress" }, status: 503, headers: { "Retry-After": "12" } });
  assert.equal(reservations, 2);
});

test("an accepted completion caches the successful final result", async () => {
  const result = await runJobFitEvaluation(candidate, dependencies({
    getCached: getCachedJobFitEvaluation,
    cache: cacheJobFitEvaluation,
  }));

  assert.equal(result.status, 200);
  assert.deepEqual(getCachedJobFitEvaluation("stable-key"), readyResult);
});

test("completion persistence failure is not cached and returns 503", async () => {
  const result = await runJobFitEvaluation(candidate, dependencies({
    getCached: getCachedJobFitEvaluation,
    cache: cacheJobFitEvaluation,
    complete: async () => ({ ok: false as const, reason: "persistence-failed" }),
  }));

  assert.deepEqual(result, { body: { state: "model-unavailable", reason: "evaluation-completion-unavailable" }, status: 503 });
  assert.equal(getCachedJobFitEvaluation("stable-key"), undefined);
});

test("daily quota rejection remains HTTP 429 and never invokes the evaluator", async () => {
  let evaluations = 0;
  const result = await runJobFitEvaluation(candidate, dependencies({
    reserve: async () => ({ ok: false as const, reason: "quota-blocked" as const }),
    evaluate: async () => { evaluations += 1; return readyResult; },
  }));
  assert.deepEqual(result, { body: { state: "quota-blocked", reason: "quota-blocked" }, status: 429 });
  assert.equal(evaluations, 0);
});
