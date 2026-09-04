import assert from "node:assert/strict";
import test from "node:test";
import { getJobEvaluatorDailyLimit, recordJobEvaluatorCompletion, reserveJobEvaluatorSlot } from "./quota.ts";

const previousUrl = process.env.SUPABASE_URL;
const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const previousLimit = process.env.JOB_EVALUATOR_DAILY_LIMIT;
const nativeFetch = globalThis.fetch;

test.afterEach(() => {
  if (previousUrl === undefined) delete process.env.SUPABASE_URL;
  else process.env.SUPABASE_URL = previousUrl;
  if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
  if (previousLimit === undefined) delete process.env.JOB_EVALUATOR_DAILY_LIMIT;
  else process.env.JOB_EVALUATOR_DAILY_LIMIT = previousLimit;
  globalThis.fetch = nativeFetch;
});

test("Central Job-Fit quota returns the fenced attempt contract", async () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test";
  process.env.JOB_EVALUATOR_DAILY_LIMIT = "5";
  let receivedBody: Record<string, unknown> | undefined;
  globalThis.fetch = async (_input, init) => {
    assert.match(String(_input), /reserve_job_evaluator_slot_v2/);
    receivedBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({
      outcome: "retry_reserved",
      daily_count: 3,
      attempt_token: "attempt-2",
      lease_expires_at: "2026-09-03T12:02:00Z",
      retry_after_seconds: null,
    }), { status: 200 });
  };

  assert.deepEqual(await reserveJobEvaluatorSlot("stable-evaluation-key"), {
    ok: true,
    outcome: "retry_reserved",
    dailyCount: 3,
    attemptToken: "attempt-2",
    leaseExpiresAt: "2026-09-03T12:02:00Z",
  });
  assert.deepEqual(receivedBody, { p_evaluation_key: "stable-evaluation-key", p_daily_limit: 5 });
});

test("Central Job-Fit quota returns deterministic active-attempt timing", async () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test";
  process.env.JOB_EVALUATOR_DAILY_LIMIT = "5";
  globalThis.fetch = async () => new Response(JSON.stringify({
    outcome: "in_progress",
    daily_count: 2,
    attempt_token: null,
    lease_expires_at: "2026-09-03T12:02:00Z",
    retry_after_seconds: 17.2,
  }), { status: 200 });

  assert.deepEqual(await reserveJobEvaluatorSlot("active-evaluation-key"), {
    ok: true,
    outcome: "in_progress",
    dailyCount: 2,
    retryAfterSeconds: 18,
    leaseExpiresAt: "2026-09-03T12:02:00Z",
  });
});

test("Central Job-Fit requires an explicit bounded daily quota", () => {
  delete process.env.JOB_EVALUATOR_DAILY_LIMIT;
  assert.equal(getJobEvaluatorDailyLimit(), undefined);
  process.env.JOB_EVALUATOR_DAILY_LIMIT = "invalid";
  assert.equal(getJobEvaluatorDailyLimit(), undefined);
  process.env.JOB_EVALUATOR_DAILY_LIMIT = "101";
  assert.equal(getJobEvaluatorDailyLimit(), undefined);
  process.env.JOB_EVALUATOR_DAILY_LIMIT = "4";
  assert.equal(getJobEvaluatorDailyLimit(), undefined);
  process.env.JOB_EVALUATOR_DAILY_LIMIT = "5";
  assert.equal(getJobEvaluatorDailyLimit(), 5);
});

test("Central Job-Fit completion sends token ownership and safe diagnostics", async () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test";
  let receivedBody: Record<string, unknown> | undefined;
  globalThis.fetch = async (input, init) => {
    assert.match(String(input), /complete_job_evaluator_evaluation_v2/);
    receivedBody = JSON.parse(String(init?.body));
    return new Response("true", { status: 200 });
  };

  assert.deepEqual(await recordJobEvaluatorCompletion(
    "stable-evaluation-key",
    "model-unavailable",
    "attempt-2",
    { provider: "gemini", failureCategory: "provider_http_503", providerStatus: 503, retryable: true },
  ), { ok: true, accepted: true });
  assert.deepEqual(receivedBody, {
    p_evaluation_key: "stable-evaluation-key",
    p_outcome: "model-unavailable",
    p_attempt_token: "attempt-2",
    p_diagnostics: { provider: "gemini", failureCategory: "provider_http_503", providerStatus: 503, retryable: true },
  });
});

test("Central Job-Fit completion reports a superseded attempt without treating it as persistence failure", async () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test";
  globalThis.fetch = async () => new Response("false", { status: 200 });

  assert.deepEqual(
    await recordJobEvaluatorCompletion("stable-evaluation-key", "ready", "expired-attempt"),
    { ok: true, accepted: false },
  );
});
