import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createReportProviderFailureContract } from "./failure-contract.ts";
import { generateReportWithRetry } from "./report-retry.ts";
import type { RoleFitModelResult } from "./provider.ts";

describe("report provider failure contract", () => {
  it("returns a safe retryable 429 contract without raw provider detail", () => {
    const contract = createReportProviderFailureContract({
      ok: false,
      provider: "gemini",
      model: "gemini-3-flash-preview",
      error: "rate-limited",
      safeMessageKey: "model.provider_rate_limited",
      providerStatus: 429,
      retryable: true,
      retryAfterSeconds: 34,
      detail: "raw quota payload must never reach the browser",
    });

    assert.equal(contract.status, 429);
    assert.deepEqual(contract.body, {
      state: "provider-retryable",
      provider: "gemini",
      model: "gemini-3-flash-preview",
      error: "rate-limited",
      safeMessageKey: "model.provider_rate_limited",
      safeMessage: "I couldn’t finish the report this time. The role details are still here, so you can try again without pasting them again.",
      retryable: true,
      providerStatus: 429,
      retryAfterSeconds: 34,
    });
    assert.equal("detail" in contract.body, false);
  });

  it("returns a retryable 503 contract for transient report provider failures", () => {
    const contract = createReportProviderFailureContract({
      ok: false,
      provider: "gemini",
      model: "gemini-3.5-flash",
      error: "provider-error",
      safeMessageKey: "model.google_ai_studio_provider_error",
      providerStatus: 503,
      retryable: true,
      detail: "raw upstream response",
      diagnostics: {
        attemptPhase: "schema-repair",
        repairTriggerCategory: "max_tokens",
        elapsedMs: 45000,
        failureCategory: "provider_timeout",
        responseBodyPresent: false,
      },
    });

    assert.equal(contract.status, 503);
    assert.deepEqual(contract.body, {
      state: "provider-retryable",
      provider: "gemini",
      model: "gemini-3.5-flash",
      error: "provider-error",
      safeMessageKey: "model.google_ai_studio_provider_error",
      safeMessage: "I couldn’t finish the report this time. The role details are still here, so you can try again without pasting them again.",
      retryable: true,
      providerStatus: 503,
    });
    assert.equal("detail" in contract.body, false);
    assert.equal("diagnostics" in contract.body, false);
  });

  it("does not expose raw provider detail for other provider failures", () => {
    const contract = createReportProviderFailureContract({
      ok: false,
      provider: "gemini",
      model: "gemini-3-flash-preview",
      error: "provider-error",
      safeMessageKey: "model.google_ai_studio_provider_error",
      providerStatus: 500,
      detail: "raw upstream response",
    });

    assert.equal(contract.status, 503);
    assert.equal(contract.body.state, "model-unavailable");
    assert.equal(contract.body.retryable, false);
    assert.equal("detail" in contract.body, false);
  });
});

describe("initial report provider retry", () => {
  const unavailable: RoleFitModelResult = {
    ok: false, provider: "gemini", error: "provider-error",
    safeMessageKey: "model.google_ai_studio_provider_error",
    providerStatus: 503, retryable: true,
    diagnostics: { attemptPhase: "initial-analysis", failureCategory: "provider_http_503" },
  };
  const success = { ok: true, provider: "gemini", model: "test", analysis: {}, diagnostics: { providerElapsedMs: 1, schemaRepairUsed: false } } as RoleFitModelResult;

  it("retries one 503 and returns one successful analysis for the normal persistence path", async () => {
    let providerCalls = 0;
    let waits = 0;
    const outcome = await generateReportWithRetry(async () => ++providerCalls === 1 ? unavailable : success, async () => { waits++; });
    assert.equal(outcome.result.ok, true);
    assert.equal(outcome.attempts, 2);
    assert.equal(providerCalls, 2);
    assert.equal(waits, 1);
  });

  it("reports each provider attempt and its classified result in order", async () => {
    let calls = 0;
    const observed: string[] = [];
    await generateReportWithRetry(
      async () => ++calls === 1 ? unavailable : success,
      async () => {},
      (attempt, result) => observed.push(`${attempt}:${result ? result.ok ? "success" : "failure" : "started"}`),
    );
    assert.deepEqual(observed, ["1:started", "1:failure", "2:started", "2:success"]);
  });

  it("returns a recoverable failure after two 503 responses", async () => {
    let providerCalls = 0;
    const outcome = await generateReportWithRetry(async () => { providerCalls++; return unavailable; }, async () => {});
    assert.equal(providerCalls, 2);
    assert.equal(outcome.attempts, 2);
    assert.equal(outcome.result.ok, false);
    if (outcome.result.ok) return;
    assert.equal(createReportProviderFailureContract(outcome.result).body.state, "provider-retryable");
  });

  it("does not retry invalid output or non-retryable provider errors", async () => {
    for (const failure of [
      { ...unavailable, error: "invalid-output" as const, retryable: false, providerStatus: undefined },
      { ...unavailable, providerStatus: 500, retryable: false },
    ]) {
      let calls = 0;
      const outcome = await generateReportWithRetry(async () => { calls++; return failure; }, async () => assert.fail("unexpected retry"));
      assert.equal(calls, 1);
      assert.equal(outcome.attempts, 1);
    }
  });

  it("retries classified 429 and timeout failures once", async () => {
    const failures: RoleFitModelResult[] = [
      { ...unavailable, error: "rate-limited", providerStatus: 429, diagnostics: { failureCategory: "provider_http_429" } },
      { ...unavailable, providerStatus: undefined, diagnostics: { failureCategory: "provider_timeout" } },
    ];
    for (const failure of failures) {
      let calls = 0;
      const outcome = await generateReportWithRetry(async () => ++calls === 1 ? failure : success, async () => {});
      assert.equal(calls, 2);
      assert.equal(outcome.result.ok, true);
    }
  });

  it("honors a short Retry-After and leaves longer rate limits for a later user retry", async () => {
    const limited = { ...unavailable, error: "rate-limited" as const, providerStatus: 429 };
    const waits: number[] = [];
    const short = await generateReportWithRetry(async () => ({ ...limited, retryAfterSeconds: 2 }), async (delay) => { waits.push(delay); });
    assert.equal(short.attempts, 2);
    assert.deepEqual(waits, [2_000]);

    let calls = 0;
    const long = await generateReportWithRetry(async () => { calls++; return { ...limited, retryAfterSeconds: 34 }; }, async () => assert.fail("unexpected wait"));
    assert.equal(long.attempts, 1);
    assert.equal(calls, 1);
  });
});
