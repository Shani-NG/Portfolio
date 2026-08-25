import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createReportProviderFailureContract } from "./failure-contract.ts";

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
      safeMessage: "The analysis service is temporarily busy. Your job details are saved. Try generating the report again shortly.",
      retryable: true,
      providerStatus: 429,
      retryAfterSeconds: 34,
    });
    assert.equal("detail" in contract.body, false);
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
