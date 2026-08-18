import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";

import { getPersistedRoleFitCompletedReportCount, persistRoleFitCompletedReport } from "./supabase-report-store.ts";

const previousUrl = process.env.SUPABASE_URL;
const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const originalFetch = globalThis.fetch;
const originalWarn = console.warn;
const originalInfo = console.info;
let diagnostics: Array<Record<string, unknown>> = [];

function captureDiagnostics() {
  diagnostics = [];
  console.warn = ((label: unknown, details: unknown) => {
    if (label === "[rolefit-persistence]" && details && typeof details === "object") diagnostics.push(details as Record<string, unknown>);
  }) as typeof console.warn;
  console.info = ((label: unknown, details: unknown) => {
    if (label === "[rolefit-persistence]" && details && typeof details === "object") diagnostics.push(details as Record<string, unknown>);
  }) as typeof console.info;
}

afterEach(() => {
  if (previousUrl === undefined) delete process.env.SUPABASE_URL;
  else process.env.SUPABASE_URL = previousUrl;
  if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
  globalThis.fetch = originalFetch;
  console.warn = originalWarn;
  console.info = originalInfo;
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
  test("emits a safe structured diagnostic for missing configuration", async () => {
    captureDiagnostics();
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    assert.deepEqual(await getPersistedRoleFitCompletedReportCount("session_config"), { ok: false, reason: "missing-config" });
    assert.deepEqual(diagnostics.at(-1), {
      target: "report", provider: "supabase", operation: "completed-report-count",
      functionName: "rolefit_completed_report_count", sessionId: "session_config",
      stage: "config", result: "failure", errorCategory: "missing-config",
    });
  });

  test("emits a safe client-init diagnostic for an invalid configured URL", async () => {
    captureDiagnostics();
    process.env.SUPABASE_URL = "not a URL";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "server-only-test-key";

    assert.deepEqual(await getPersistedRoleFitCompletedReportCount("session_client"), { ok: false, reason: "request-failed" });
    assert.equal(diagnostics.at(-1)?.stage, "client-init");
    assert.equal(diagnostics.at(-1)?.errorCategory, "invalid-url");
  });

  test("emits safe auth/API diagnostics with status and sanitized provider code", async () => {
    captureDiagnostics();
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "server-only-test-key";
    globalThis.fetch = (async () => new Response(JSON.stringify({ code: "PGRST301", message: "sensitive body is not logged" }), { status: 401 })) as typeof fetch;

    assert.deepEqual(await getPersistedRoleFitCompletedReportCount("session_auth"), { ok: false, reason: "request-failed" });
    const diagnostic = diagnostics.at(-1);
    assert.equal(diagnostic?.stage, "rpc");
    assert.equal(diagnostic?.result, "blocked");
    assert.equal(diagnostic?.httpStatus, 401);
    assert.equal(diagnostic?.providerCode, "PGRST301");
    assert.doesNotMatch(JSON.stringify(diagnostic), /sensitive body/);
  });

  test("emits a safe RPC write diagnostic for a network failure", async () => {
    captureDiagnostics();
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "server-only-test-key";
    globalThis.fetch = (async () => { throw new Error("network details are not logged"); }) as typeof fetch;

    assert.deepEqual(await getPersistedRoleFitCompletedReportCount("session_network"), { ok: false, reason: "request-failed" });
    assert.equal(diagnostics.at(-1)?.stage, "rpc");
    assert.equal(diagnostics.at(-1)?.errorCategory, "network");
    assert.doesNotMatch(JSON.stringify(diagnostics.at(-1)), /network details/);
  });

  test("reads the completed report count by exact session_id", async () => {
    const requests = configureFetch(1);
    const result = await getPersistedRoleFitCompletedReportCount("session_abc");

    assert.deepEqual(result, { ok: true, completedReportCount: 1 });
    assert.equal(requests[0]?.url, "https://example.supabase.co/rest/v1/rpc/rolefit_completed_report_count");
    assert.deepEqual(requests[0]?.body, { p_session_id: "session_abc" });
  });

  test("persists with the exact report_id and session_id returned by the runtime", async () => {
    captureDiagnostics();
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
    assert.equal(diagnostics.at(-1)?.result, "success");
    assert.equal(diagnostics.at(-1)?.stage, "rpc");
    assert.equal(diagnostics.at(-1)?.reportId, "R9K2Q");
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
