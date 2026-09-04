import assert from "node:assert/strict";
import test from "node:test";
import { cacheJobFitEvaluation, evaluateJobFitOnce, getCachedJobFitEvaluation, resetJobFitRetryStateForTest } from "./retry.ts";

test.afterEach(() => resetJobFitRetryStateForTest());

test("same evaluation key shares one in-flight evaluation without caching before ownership confirmation", async () => {
  let calls = 0;
  let release: (() => void) | undefined;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const evaluate = async () => {
    calls += 1;
    await gate;
    return {
      state: "ready" as const,
      fitLabel: "Good" as const,
      recommendedAction: "APPLY WITH POSITIONING" as const,
      cvPositioningGuidance: "Use evidence-grounded positioning.",
      rationale: "Approved evidence supports the role.",
      evidenceConfidence: { level: "high" as const, rationale: "Evidence is direct." },
      requirementAssessments: [],
      strengths: [],
      gaps: [],
    };
  };

  const first = evaluateJobFitOnce("stable-key", evaluate);
  const retry = evaluateJobFitOnce("stable-key", evaluate);
  release?.();

  const [firstResult, retryResult] = await Promise.all([first, retry]);
  assert.equal(calls, 1);
  assert.deepEqual(retryResult, firstResult);
  assert.equal(getCachedJobFitEvaluation("stable-key"), undefined);
  assert.equal(cacheJobFitEvaluation("stable-key", firstResult), true);
  assert.deepEqual(getCachedJobFitEvaluation("stable-key"), firstResult);
});

test("transient model failure is not cached and a later request executes again", async () => {
  let calls = 0;
  const evaluate = async () => {
    calls += 1;
    if (calls === 1) return { state: "model-unavailable" as const, reason: "provider-timeout" };
    return {
      state: "ready" as const,
      fitLabel: "Good" as const,
      recommendedAction: "APPLY WITH POSITIONING" as const,
      cvPositioningGuidance: "Use evidence-grounded positioning.",
      rationale: "Approved evidence supports the role.",
      evidenceConfidence: { level: "high" as const, rationale: "Evidence is direct." },
      requirementAssessments: [],
      strengths: [],
      gaps: [],
    };
  };

  assert.equal((await evaluateJobFitOnce("retryable-key", evaluate)).state, "model-unavailable");
  assert.equal(getCachedJobFitEvaluation("retryable-key"), undefined);
  assert.equal((await evaluateJobFitOnce("retryable-key", evaluate)).state, "ready");
  assert.equal(calls, 2);
});
