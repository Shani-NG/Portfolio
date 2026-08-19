import assert from "node:assert/strict";
import test from "node:test";
import { isInternalJobFitRequestAuthorized } from "./internal-auth.ts";

const previousSecret = process.env.JOB_FIT_INTERNAL_API_KEY;

test.after(() => {
  if (previousSecret === undefined) delete process.env.JOB_FIT_INTERNAL_API_KEY;
  else process.env.JOB_FIT_INTERNAL_API_KEY = previousSecret;
});

test("Central Job-Fit endpoint accepts only the configured server bearer secret", () => {
  process.env.JOB_FIT_INTERNAL_API_KEY = "a".repeat(32);
  assert.equal(isInternalJobFitRequestAuthorized(new Request("https://example.com", { headers: { authorization: `Bearer ${"a".repeat(32)}` } })), true);
  assert.equal(isInternalJobFitRequestAuthorized(new Request("https://example.com", { headers: { authorization: `Bearer ${"b".repeat(32)}` } })), false);
  assert.equal(isInternalJobFitRequestAuthorized(new Request("https://example.com")), false);
});
