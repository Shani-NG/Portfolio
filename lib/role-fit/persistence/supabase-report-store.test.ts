import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";

import { getPersistedRoleFitCompletedReportCount, persistRoleFitCompletedReport } from "./supabase-report-store.ts";

const previousUrl = process.env.SUPABASE_URL;
const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const originalFetch = globalThis.fetch;

afterEach(() => {
  if (previousUrl === undefined) delete process.env.SUPABASE_URL;
  else process.env.SUPABASE_URL = previousUrl;
  if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
  globalThis.fetch = originalFetch;
});

function configureFetch(responseBody: unknown) {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "server-only-test-key";
  const requests: Array<{ url: string; body: Record<string, unknown> }> = [];
  globalThis.fetch = (async (input, init) => {
    requests.push({ url: String(input), body: JSON.parse(String(init?.body)) as Record<string, unknown> });
    return new Response(JSON.stringify(responseBody), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  return requests;
}

describe("RoleFit Supabase report RPC adapter", () => {
  test("reads the completed report count by exact session_id", async () => {
    const requests = configureFetch(1);
    const result = await getPersistedRoleFitCompletedReportCount("session_abc");

    assert.deepEqual(result, { ok: true, completedReportCount: 1 });
    assert.equal(requests[0]?.url, "https://example.supabase.co/rest/v1/rpc/rolefit_completed_report_count");
    assert.deepEqual(requests[0]?.body, { p_session_id: "session_abc" });
  });

  test("persists with the exact report_id and session_id returned by the runtime", async () => {
    const requests = configureFetch([{ outcome: "persisted", completed_report_count: 1 }]);
    const result = await persistRoleFitCompletedReport({
      reportId: "R9K2Q",
      sessionId: "session_abc",
      roleTitle: "Senior UX Strategist",
      companyName: "Acme",
      fitLabel: "Good",
      schemaVersion: "1.0",
      evidenceProjectsUsed: ["Project A"],
      contactCtaClicked: false,
      reportJson: { result: { fit: "Good" } },
    });

    assert.deepEqual(result, { ok: true, outcome: "persisted", completedReportCount: 1 });
    assert.equal(requests[0]?.body.p_report_id, "R9K2Q");
    assert.equal(requests[0]?.body.p_session_id, "session_abc");
  });

  test("allows a failed persistence attempt to retry with the same report_id", async () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "server-only-test-key";
    let attempt = 0;
    globalThis.fetch = (async () => {
      attempt += 1;
      return attempt === 1
        ? new Response("failed", { status: 503 })
        : new Response(JSON.stringify([{ outcome: "persisted", completed_report_count: 1 }]), { status: 200 });
    }) as typeof fetch;
    const input = {
      reportId: "R9K2Q", sessionId: "session_retry", roleTitle: "Role", companyName: "Company",
      fitLabel: "Good" as const, schemaVersion: "1.0", evidenceProjectsUsed: [], contactCtaClicked: false, reportJson: {},
    };

    assert.deepEqual(await persistRoleFitCompletedReport(input), { ok: false, reason: "request-failed" });
    assert.deepEqual(await persistRoleFitCompletedReport(input), { ok: true, outcome: "persisted", completedReportCount: 1 });
  });

  test("recognizes database-backed duplicate and limit outcomes", async () => {
    const duplicateRequests = configureFetch([{ outcome: "duplicate", completed_report_count: 2 }]);
    const duplicate = await persistRoleFitCompletedReport({
      reportId: "R9K2Q", sessionId: "session_abc", roleTitle: "Role", companyName: "Company",
      fitLabel: "Strong", schemaVersion: "1.0", evidenceProjectsUsed: [], contactCtaClicked: false, reportJson: {},
    });
    assert.deepEqual(duplicate, { ok: true, outcome: "duplicate", completedReportCount: 2 });
    assert.equal(duplicateRequests.length, 1);

    const limitRequests = configureFetch([{ outcome: "limit_reached", completed_report_count: 2 }]);
    const limited = await persistRoleFitCompletedReport({
      reportId: "R9K3Q", sessionId: "session_abc", roleTitle: "Role", companyName: "Company",
      fitLabel: "Partial", schemaVersion: "1.0", evidenceProjectsUsed: [], contactCtaClicked: false, reportJson: {},
    });
    assert.deepEqual(limited, { ok: false, reason: "limit-reached", completedReportCount: 2 });
    assert.equal(limitRequests.length, 1);
  });
});
