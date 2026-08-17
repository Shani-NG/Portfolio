import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { afterEach, describe, test } from "node:test";

import { appendContactLeadPersistenceRow } from "./google-sheets-store.ts";

const environmentKeys = [
  "GOOGLE_SHEETS_RUNTIME_SPREADSHEET_ID",
  "GOOGLE_SHEETS_CLIENT_EMAIL",
  "GOOGLE_SHEETS_PRIVATE_KEY",
] as const;
const previousEnvironment = Object.fromEntries(environmentKeys.map((key) => [key, process.env[key]]));
const originalFetch = globalThis.fetch;
const originalWarn = console.warn;
const originalInfo = console.info;
const testPrivateKey = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey.export({ type: "pkcs8", format: "pem" }).toString();
let diagnostics: Array<Record<string, unknown>> = [];

function configureGoogleSheets() {
  process.env.GOOGLE_SHEETS_RUNTIME_SPREADSHEET_ID = "spreadsheet-test-id";
  process.env.GOOGLE_SHEETS_CLIENT_EMAIL = "service@example.test";
  process.env.GOOGLE_SHEETS_PRIVATE_KEY = testPrivateKey;
}

function captureDiagnostics() {
  diagnostics = [];
  console.warn = ((label: unknown, details: unknown) => {
    if (label === "[rolefit-persistence]" && details && typeof details === "object") diagnostics.push(details as Record<string, unknown>);
  }) as typeof console.warn;
  console.info = ((label: unknown, details: unknown) => {
    if (label === "[rolefit-persistence]" && details && typeof details === "object") diagnostics.push(details as Record<string, unknown>);
  }) as typeof console.info;
}

const lead = {
  lead_id: "L9K2Q",
  created_at: "17.08.26 12:00",
  name: "Sensitive Person",
  email: "sensitive@example.test",
  company: "Private Company",
  message: "PRIVATE_LEAD_MESSAGE",
  report_id: "R9K2Q",
  source_context: "role-fit-report-cta",
};

afterEach(() => {
  for (const key of environmentKeys) {
    const value = previousEnvironment[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  globalThis.fetch = originalFetch;
  console.warn = originalWarn;
  console.info = originalInfo;
});

describe("Google Sheets persistence diagnostics", () => {
  test("logs a correlated safe auth diagnostic when OAuth rejects the service account", async () => {
    configureGoogleSheets();
    captureDiagnostics();
    globalThis.fetch = (async () => new Response("denied", { status: 401 })) as typeof fetch;

    assert.equal(await appendContactLeadPersistenceRow(lead), false);
    const diagnostic = diagnostics.at(-1);
    assert.equal(diagnostic?.provider, "google-sheets");
    assert.equal(diagnostic?.target, "lead");
    assert.equal(diagnostic?.operation, "append-lead");
    assert.equal(diagnostic?.stage, "auth");
    assert.equal(diagnostic?.result, "failure");
    assert.equal(diagnostic?.errorCategory, "api-rejected");
    assert.equal(diagnostic?.httpStatus, 401);
    assert.equal(diagnostic?.correlationId, "L9K2Q");
    assert.doesNotMatch(JSON.stringify(diagnostic), /Sensitive Person|sensitive@example|PRIVATE_LEAD_MESSAGE/);
  });

  test("logs a correlated safe append diagnostic when Sheets rejects a write", async () => {
    configureGoogleSheets();
    captureDiagnostics();
    let requestCount = 0;
    globalThis.fetch = (async () => {
      requestCount += 1;
      return requestCount === 1
        ? new Response(JSON.stringify({ access_token: "test-token", expires_in: 0 }), { status: 200 })
        : new Response("write denied", { status: 403 });
    }) as typeof fetch;

    assert.equal(await appendContactLeadPersistenceRow(lead), false);
    const diagnostic = diagnostics.at(-1);
    assert.equal(diagnostic?.stage, "append");
    assert.equal(diagnostic?.errorCategory, "api-rejected");
    assert.equal(diagnostic?.httpStatus, 403);
    assert.equal(diagnostic?.correlationId, "L9K2Q");
  });

  test("logs a correlated success diagnostic after a successful append", async () => {
    configureGoogleSheets();
    captureDiagnostics();
    let requestCount = 0;
    globalThis.fetch = (async () => {
      requestCount += 1;
      return requestCount === 1
        ? new Response(JSON.stringify({ access_token: "test-token", expires_in: 0 }), { status: 200 })
        : new Response(JSON.stringify({ updates: {} }), { status: 200 });
    }) as typeof fetch;

    assert.equal(await appendContactLeadPersistenceRow(lead), true);
    const diagnostic = diagnostics.at(-1);
    assert.equal(diagnostic?.provider, "google-sheets");
    assert.equal(diagnostic?.target, "lead");
    assert.equal(diagnostic?.operation, "append-lead");
    assert.equal(diagnostic?.stage, "append");
    assert.equal(diagnostic?.result, "success");
    assert.equal(diagnostic?.httpStatus, 200);
    assert.equal(diagnostic?.correlationId, "L9K2Q");
  });
});
