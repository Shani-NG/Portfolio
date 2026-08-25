import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";

import { logRoleFitEvent, persistContactLeadToSupabase } from "./supabase-runtime-store.ts";

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

afterEach(() => {
  if (previousUrl === undefined) delete process.env.SUPABASE_URL;
  else process.env.SUPABASE_URL = previousUrl;
  if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
  globalThis.fetch = originalFetch;
  console.warn = originalWarn;
  console.info = originalInfo;
});

describe("RoleFit Supabase runtime persistence", () => {
  test("persists the approved Contact lead fields through the server-only Supabase RPC", async () => {
    captureDiagnostics();
    const requests = configureFetch(true);

    const result = await persistContactLeadToSupabase({
      leadId: "L9K2Q",
      name: "Ada",
      email: "ada@example.test",
      companyName: "Acme",
      message: "Let's talk.",
      sourceContext: "role-fit-report-cta",
      reportId: "R9K2Q",
    });

    assert.deepEqual(result, { ok: true });
    assert.equal(requests[0]?.url, "https://example.supabase.co/rest/v1/rpc/persist_rolefit_contact_lead");
    assert.deepEqual(requests[0]?.body, {
      p_lead_id: "L9K2Q",
      p_name: "Ada",
      p_email: "ada@example.test",
      p_company_name: "Acme",
      p_message: "Let's talk.",
      p_source_context: "role-fit-report-cta",
      p_report_id: "R9K2Q",
    });
    assert.equal(diagnostics.at(-1)?.provider, "supabase");
    assert.equal(diagnostics.at(-1)?.operation, "lead-persist");
    assert.equal(diagnostics.at(-1)?.stage, "rpc");
    assert.equal(diagnostics.at(-1)?.result, "success");
    assert.doesNotMatch(JSON.stringify(diagnostics.at(-1)), /Ada|example\.test|Let's talk/);
  });

  test("keeps a failed Contact write diagnosable without presenting it as success", async () => {
    captureDiagnostics();
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "server-only-test-key";
    globalThis.fetch = (async () => new Response(JSON.stringify({ code: "PGRST301", message: "sensitive provider response" }), { status: 403 })) as typeof fetch;

    const result = await persistContactLeadToSupabase({
      leadId: "L9K2Q",
      name: "Ada",
      email: "ada@example.test",
      companyName: "Acme",
      message: "Let's talk.",
      sourceContext: "direct-contact-page",
    });

    assert.deepEqual(result, { ok: false, reason: "request-failed" });
    assert.deepEqual(diagnostics.at(-1), {
      target: "lead",
      provider: "supabase",
      operation: "lead-persist",
      functionName: "persist_rolefit_contact_lead",
      correlationId: "L9K2Q",
      stage: "rpc",
      result: "blocked",
      errorCategory: "api-rejected",
      httpStatus: 403,
      providerCode: "PGRST301",
    });
  });

  test("persists useful runtime events with safe metadata and a correlation identifier", async () => {
    captureDiagnostics();
    const requests = configureFetch(true);

    const result = await logRoleFitEvent({
      eventName: "report.completed",
      sessionId: "session_abc",
      reportId: "R9K2Q",
      traceId: "trace_abc",
      mode: "fit-analysis",
      outcome: "success",
      durationMs: 123,
      metadata: {
        provider: "google-ai-studio",
        model: "gemini-test",
        fitMode: "fit",
        providerStatus: 429,
        retryable: true,
        retryAfterSeconds: 34,
        safeMessageKey: "model.invalid_output",
        rawRoleText: "must-not-persist",
        companyName: "must-not-persist",
      },
    });

    assert.deepEqual(result, { ok: true });
    assert.equal(requests[0]?.url, "https://example.supabase.co/rest/v1/rpc/persist_rolefit_runtime_event");
    assert.deepEqual(requests[0]?.body.p_details, {
      provider: "google-ai-studio",
      model: "gemini-test",
      fitMode: "fit",
      providerStatus: 429,
      retryable: true,
      retryAfterSeconds: 34,
    });
    assert.equal(requests[0]?.body.p_error_code, "model.invalid_output");
    assert.equal("safeMessageKey" in (requests[0]?.body.p_details ?? {}), false);
    assert.equal(requests[0]?.body.p_session_id, "session_abc");
    assert.equal(requests[0]?.body.p_report_id, "R9K2Q");
    assert.equal(diagnostics.at(-1)?.correlationId, "trace_abc");
  });
});
