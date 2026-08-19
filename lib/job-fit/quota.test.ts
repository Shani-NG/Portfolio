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

test("Central Job-Fit quota sends one stable reservation RPC before evaluation", async () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test";
  process.env.JOB_EVALUATOR_DAILY_LIMIT = "5";
  let receivedBody: Record<string, unknown> | undefined;
  globalThis.fetch = async (_input, init) => {
    receivedBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ outcome: "reused", daily_count: 3 }), { status: 200 });
  };

  assert.deepEqual(await reserveJobEvaluatorSlot("stable-evaluation-key"), { ok: true, outcome: "reused", dailyCount: 3 });
  assert.deepEqual(receivedBody, { p_evaluation_key: "stable-evaluation-key", p_daily_limit: 5 });
});

test("Central Job-Fit requires an explicit bounded daily quota", () => {
  delete process.env.JOB_EVALUATOR_DAILY_LIMIT;
  assert.equal(getJobEvaluatorDailyLimit(), undefined);
  process.env.JOB_EVALUATOR_DAILY_LIMIT = "invalid";
  assert.equal(getJobEvaluatorDailyLimit(), undefined);
  process.env.JOB_EVALUATOR_DAILY_LIMIT = "101";
  assert.equal(getJobEvaluatorDailyLimit(), undefined);
  process.env.JOB_EVALUATOR_DAILY_LIMIT = "5";
  assert.equal(getJobEvaluatorDailyLimit(), 5);
});

test("Central Job-Fit completion uses a technical ledger RPC without report identifiers", async () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test";
  let receivedBody: Record<string, unknown> | undefined;
  globalThis.fetch = async (input, init) => {
    assert.match(String(input), /complete_job_evaluator_evaluation/);
    receivedBody = JSON.parse(String(init?.body));
    return new Response("true", { status: 200 });
  };

  assert.deepEqual(await recordJobEvaluatorCompletion("stable-evaluation-key", "ready"), { ok: true });
  assert.deepEqual(receivedBody, { p_evaluation_key: "stable-evaluation-key", p_outcome: "ready" });
});
