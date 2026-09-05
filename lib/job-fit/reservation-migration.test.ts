import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL("../../supabase/migrations/20260903120000_fix_job_evaluator_retry_lifecycle.sql", import.meta.url);
const v1MigrationUrl = new URL("../../supabase/migrations/20260819130000_replace_job_evaluator_reservation_table_with_runtime_logs.sql", import.meta.url);

test("migration serializes daily quota and same-key lifecycle in a fixed lock order", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  const dayLock = sql.indexOf("'job-evaluator:' || v_day::text");
  const keyLock = sql.indexOf("'job-evaluator-key:' || p_evaluation_key");
  const quotaCount = sql.indexOf("select count(*)::integer into v_daily_count");
  const reservationInsert = sql.indexOf("insert into public.runtime_logs (event_name, status, details)");
  assert.ok(dayLock >= 0);
  assert.ok(keyLock > dayLock);
  assert.ok(quotaCount > keyLock);
  assert.ok(reservationInsert > quotaCount);
  assert.match(sql, /if v_daily_count >= p_daily_limit then/);
});

test("migration fences completion by the current active attempt token", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /details ->> 'lifecycle' = 'active'/);
  assert.match(sql, /details ->> 'attemptToken' = p_attempt_token/);
  assert.match(sql, /if v_updated = 0 then\s+return false;/);
});

test("known failures retry immediately and abandoned attempts retry after the lease", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /p_outcome = 'model-unavailable' then 'retryable'/);
  assert.match(sql, /v_lease_expires_at > now\(\)/);
  assert.match(sql, /interval '120 seconds'/);
  assert.match(sql, /'retry_reserved'::text/);
});

test("same-key retries update the reservation instead of consuming another slot", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  const retryComment = sql.indexOf("Retryable, expired, completed-without-result");
  const updateIndex = sql.indexOf("update public.runtime_logs", retryComment);
  const retryReturnIndex = sql.indexOf("'retry_reserved'::text", updateIndex);
  assert.ok(retryComment >= 0 && updateIndex > retryComment && retryReturnIndex > updateIndex);
  assert.doesNotMatch(sql.slice(updateIndex, retryReturnIndex), /insert into public\.runtime_logs/);
});

test("a different new key consumes exactly one slot while a retry preserves the existing count", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /'reserved'::text, v_daily_count \+ 1/);
  assert.match(sql, /'retry_reserved'::text, v_daily_count,/);
});

test("legacy retry-ambiguous response is absent from route and OpenAPI", async () => {
  const route = await readFile(new URL("../../app/api/internal/job-fit/evaluate/v1/route.ts", import.meta.url), "utf8");
  const openApi = await readFile(new URL("../../docs/gpt-actions/job-fit-evaluator-v1.openapi.yaml", import.meta.url), "utf8");
  assert.doesNotMatch(route, /retry-ambiguous|existing-evaluation-cannot-be-replayed/);
  assert.doesNotMatch(openApi, /retry-ambiguous|existing-evaluation-cannot-be-replayed|'409'/);
  assert.match(openApi, /Retry-After:/);
  assert.match(openApi, /const: model-unavailable/);
});

test("additive migration leaves both v1 RPC definitions untouched and creates uniquely named v2 RPCs", async () => {
  const [v1Sql, v2Sql] = await Promise.all([
    readFile(v1MigrationUrl, "utf8"),
    readFile(migrationUrl, "utf8"),
  ]);
  assert.match(v1Sql, /create or replace function public\.reserve_job_evaluator_slot\(/);
  assert.match(v1Sql, /create or replace function public\.complete_job_evaluator_evaluation\(/);
  assert.doesNotMatch(v2Sql, /drop function/i);
  assert.doesNotMatch(v2Sql, /create(?: or replace)? function public\.reserve_job_evaluator_slot\(/i);
  assert.doesNotMatch(v2Sql, /create(?: or replace)? function public\.complete_job_evaluator_evaluation\(/i);
  assert.match(v2Sql, /create function public\.reserve_job_evaluator_slot_v2\(/);
  assert.match(v2Sql, /create function public\.complete_job_evaluator_evaluation_v2\(/);
});

test("v1 and v2 reserve calls share the same day lock so mixed-version quota remains race-safe", async () => {
  const [v1Sql, v2Sql] = await Promise.all([
    readFile(v1MigrationUrl, "utf8"),
    readFile(migrationUrl, "utf8"),
  ]);
  const sharedDayLock = "pg_catalog.hashtextextended('job-evaluator:' || v_day::text, 0)";
  assert.match(v1Sql, new RegExp(sharedDayLock.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(v2Sql, new RegExp(sharedDayLock.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(v1Sql, /if v_daily_count >= p_daily_limit then/);
  assert.match(v2Sql, /if v_daily_count >= p_daily_limit then/);
});

test("recent legacy v1 reservation is protected during the 120-second grace window", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /v_lifecycle := coalesce\(v_reservation\.details ->> 'lifecycle', 'legacy'\)/);
  assert.match(sql, /v_lifecycle = 'legacy'/);
  assert.match(sql, /v_reservation\.occurred_at \+ interval '120 seconds'/);
  assert.match(sql, /v_lease_expires_at is not null and v_lease_expires_at > now\(\)/);
  assert.match(sql, /'in_progress'::text/);
});

test("v1 transient completion makes v2 retryable without pretending a result can be replayed", async () => {
  const [v1Sql, v2Sql] = await Promise.all([
    readFile(v1MigrationUrl, "utf8"),
    readFile(migrationUrl, "utf8"),
  ]);
  assert.match(v1Sql, /p_outcome = 'model-unavailable' then 'failure'/);
  assert.match(v1Sql, /'job\.evaluation\.completed'/);
  const legacyStart = v2Sql.indexOf("elsif v_lifecycle = 'legacy'");
  const activeCheck = v2Sql.indexOf("if v_lease_expires_at is not null", legacyStart);
  const retryReservation = v2Sql.indexOf("'retry_reserved'::text", activeCheck);
  const legacyBlock = v2Sql.slice(legacyStart, activeCheck);
  assert.match(legacyBlock, /if not exists[\s\S]*job\.evaluation\.completed/);
  assert.ok(retryReservation > activeCheck);
  assert.doesNotMatch(v2Sql, /replayableResult|canonicalResult/);
});

test("v1 sees a v2 reservation as reused and cannot reserve parallel work for the same key", async () => {
  const v1Sql = await readFile(v1MigrationUrl, "utf8");
  const existingReservationCheck = v1Sql.indexOf("if exists (");
  const reusedReturn = v1Sql.indexOf("'reused'::text", existingReservationCheck);
  const reservationInsert = v1Sql.indexOf("insert into public.runtime_logs (event_name, status, details)", reusedReturn);
  assert.ok(existingReservationCheck >= 0 && reusedReturn > existingReservationCheck);
  assert.ok(reservationInsert > reusedReturn);
});
