import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, test } from "node:test";
import { roleFitBoundaryEvents, roleFitClientBoundaryEventSchema, roleFitClientBoundaryEvents } from "./boundary-events.ts";

const root = process.cwd();
const validEvent = {
  eventName: "rolefit.confirmation_yes_received",
  sessionId: "session_12345678",
  correlationId: "b8d9d39f-aea2-4c8f-b95a-2b4cf9c6c2e2",
  clientTimestamp: "2026-09-30T12:00:00.000Z",
  snapshot: {
    roleDraftPresent: true,
    roleDraftValidationStatus: "not-checked",
    pendingReportConfirmation: false,
    reportPayloadPresent: false,
    clientState: "awaiting-report-confirmation",
    routingDecision: "chat-fall-through",
  },
};

describe("RoleFit boundary instrumentation", () => {
  test("accepts only bounded, non-content client telemetry", () => {
    for (const eventName of roleFitClientBoundaryEvents) assert.ok(roleFitBoundaryEvents.includes(eventName), eventName);
    assert.equal(roleFitClientBoundaryEventSchema.safeParse(validEvent).success, true);
    assert.equal(roleFitClientBoundaryEventSchema.safeParse({ ...validEvent, rawJD: "private" }).success, false);
    assert.equal(roleFitClientBoundaryEventSchema.safeParse({ ...validEvent, eventName: "rolefit.provider_call_completed" }).success, false);
    assert.equal(roleFitClientBoundaryEventSchema.safeParse({ ...validEvent, snapshot: { ...validEvent.snapshot, chatText: "private" } }).success, false);
    assert.equal(roleFitClientBoundaryEventSchema.safeParse({ ...validEvent, correlationId: "not-a-uuid" }).success, false);
  });

  test("records both YES decisions without changing the PR19 confirmation guard", async () => {
    const page = await readFile(join(root, "app", "minime", "page.tsx"), "utf8");
    const received = page.indexOf('recordBoundary("rolefit.confirmation_yes_received"');
    const guard = page.indexOf('if (currentSession.pendingReportConfirmation && isReportConfirmationText(submittedText))');
    const routed = page.indexOf('recordBoundary("rolefit.confirmation_yes_routed_to_report"');
    const fellThrough = page.indexOf('recordBoundary("rolefit.confirmation_yes_fell_through_to_chat"');
    const chatFetch = page.indexOf('fetch("/api/role-fit/chat"');

    assert.ok(received >= 0 && received < guard);
    assert.ok(routed > guard && routed < fellThrough);
    assert.ok(fellThrough < chatFetch);
    assert.match(page, /await requestReport\(sessionAfterUser, correlationId, "confirmation"\)/);
    assert.match(page, /correlationId: confirmationCorrelationId \?\? options\?\.correlationId/);
  });

  test("records CTA draft loss, revalidation, report request, and real report DOM display", async () => {
    const page = await readFile(join(root, "app", "minime", "page.tsx"), "utf8");
    assert.match(page, /recordBoundary\("rolefit.cta_clicked"/);
    assert.match(page, /if \(!reportSession.pendingReportConfirmation \|\| !hasRoleDraftContent\(reportSession.activeRoleDraft\)\)/);
    assert.match(page, /recordBoundary\("rolefit.cta_missing_active_draft"/);
    assert.match(page, /recordBoundary\("rolefit.cta_revalidated_draft"/);
    assert.match(page, /recordBoundary\("rolefit.request_report_entered"/);
    assert.match(page, /recordBoundary\("rolefit.generating_report_state_set"/);
    assert.match(page, /recordBoundary\("rolefit.report_post_started"/);
    assert.match(page, /recordBoundary\("rolefit.report_post_failed"/);
    assert.match(page, /recordBoundary\("rolefit.report_ready_state_set"/);
    assert.match(page, /querySelector\("#role-fit-live-report"\)/);
    assert.match(page, /recordBoundary\("rolefit.report_display_state_reached"/);
    assert.match(page, /onClick=\{handleReportCtaClick\}/);
  });

  test("propagates one action correlation through report API and server milestones", async () => {
    const [page, reportRoute, chatRoute, telemetryRoute] = await Promise.all([
      readFile(join(root, "app", "minime", "page.tsx"), "utf8"),
      readFile(join(root, "app", "api", "role-fit", "report", "route.ts"), "utf8"),
      readFile(join(root, "app", "api", "role-fit", "chat", "route.ts"), "utf8"),
      readFile(join(root, "app", "api", "role-fit", "telemetry", "route.ts"), "utf8"),
    ]);
    assert.match(page, /reportId,\s*correlationId,\s*language: "en"/);
    assert.match(reportRoute, /correlationId: z\.uuid\(\)\.optional\(\)/);
    assert.match(reportRoute, /eventName: "rolefit.report_api_validation_started"|recordBoundary\("rolefit.report_api_validation_started"/);
    for (const eventName of [
      "rolefit.report_api_validation_completed", "rolefit.provider_call_started",
      "rolefit.provider_call_completed", "rolefit.provider_call_failed", "rolefit.report_persisted",
      "rolefit.report_persistence_failed",
    ]) assert.ok(reportRoute.includes(eventName), eventName);
    assert.match(chatRoute, /rolefit.confirmation_yes_fell_through_to_chat/);
    assert.match(telemetryRoute, /roleFitClientBoundaryEventSchema\.safeParse\(value\)/);
    assert.doesNotMatch(telemetryRoute, /SUPABASE_SERVICE_ROLE_KEY|roleDraft:|message:|prompt:/);
  });
});
