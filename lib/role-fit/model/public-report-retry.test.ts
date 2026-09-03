import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { RoleFitModelResult } from "./provider.ts";
import {
  earlyProvider503MaxElapsedMs,
  earlyRetryRouteElapsedLimitMs,
  publicReportRetryTimeoutMs,
  retryEarlyPublicReport503,
  shouldRetryEarlyPublicReport503,
} from "./public-report-retry.ts";

function failure(overrides: Partial<Extract<RoleFitModelResult, { ok: false }>> = {}): Extract<RoleFitModelResult, { ok: false }> {
  return {
    ok: false,
    provider: "gemini",
    model: "gemini-3.6-flash",
    error: "provider-error",
    safeMessageKey: "model.google_ai_studio_provider_error",
    providerStatus: 503,
    retryable: true,
    diagnostics: {
      attemptPhase: "initial-analysis",
      elapsedMs: 3_920,
      failureCategory: "provider_http_503",
      providerStatus: 503,
      responseBodyPresent: true,
    },
    ...overrides,
  };
}

const success: RoleFitModelResult = {
  ok: true,
  provider: "gemini",
  model: "gemini-3.6-flash",
  analysis: {
    fitLevel: "good",
    fitRationale: "Approved evidence supports the role context.",
    evidenceConfidence: "high",
    evidenceConfidenceRationale: "The evidence is direct.",
    skillsCoverageLabel: "Evidence-backed coverage",
    items: [],
  },
  diagnostics: { providerElapsedMs: 8_000, schemaRepairUsed: false },
};

describe("Public RoleFit early 503 retry", () => {
  it("retries one early retryable initial-analysis HTTP 503 and stops after the second attempt", async () => {
    let retryCalls = 0;
    const result = await retryEarlyPublicReport503({
      initialResult: failure(),
      routeElapsedMs: 5_000,
      retry: async () => {
        retryCalls += 1;
        return success;
      },
    });

    assert.equal(retryCalls, 1);
    assert.equal(result.result, success);
    assert.equal(result.retryUsed, true);
    assert.equal(result.attempts.length, 2);
    assert.deepEqual(result.attempts.map((attempt) => attempt.attemptPhase), ["initial-analysis", "initial-analysis-retry"]);
    assert.equal(result.totalProviderElapsedMs, 11_920);
    assert.equal(result.finalOutcome, "success");
  });

  it("does not retry timeouts, late 503s, schema repair, 429s, or non-retryable failures", async () => {
    const cases: Array<{ result: RoleFitModelResult; routeElapsedMs: number }> = [
      { result: failure({ providerStatus: undefined, diagnostics: { attemptPhase: "initial-analysis", elapsedMs: 90_000, failureCategory: "provider_timeout" } }), routeElapsedMs: 90_000 },
      { result: failure({ diagnostics: { attemptPhase: "initial-analysis", elapsedMs: earlyProvider503MaxElapsedMs + 1, failureCategory: "provider_http_503" } }), routeElapsedMs: 11_000 },
      { result: failure(), routeElapsedMs: earlyRetryRouteElapsedLimitMs + 1 },
      { result: failure({ diagnostics: { attemptPhase: "schema-repair", elapsedMs: 3_000, failureCategory: "provider_http_503" } }), routeElapsedMs: 5_000 },
      { result: failure({ providerStatus: 429, error: "rate-limited", diagnostics: { attemptPhase: "initial-analysis", elapsedMs: 3_000, failureCategory: "provider_http_429" } }), routeElapsedMs: 5_000 },
      { result: failure({ retryable: false }), routeElapsedMs: 5_000 },
      { result: success, routeElapsedMs: 5_000 },
    ];

    for (const testCase of cases) {
      let retryCalls = 0;
      const result = await retryEarlyPublicReport503({
        initialResult: testCase.result,
        routeElapsedMs: testCase.routeElapsedMs,
        retry: async () => {
          retryCalls += 1;
          return success;
        },
      });
      assert.equal(shouldRetryEarlyPublicReport503(testCase), false);
      assert.equal(retryCalls, 0);
      assert.equal(result.retryUsed, false);
      assert.equal(result.attempts.length, 1);
    }
  });

  it("bounds the retry path to 105 seconds including a possible schema repair", () => {
    assert.equal(publicReportRetryTimeoutMs, 45_000);
    assert.equal(earlyRetryRouteElapsedLimitMs + publicReportRetryTimeoutMs + 45_000, 105_000);
  });
});
