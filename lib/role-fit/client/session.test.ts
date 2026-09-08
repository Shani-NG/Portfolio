import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";

import type { ReportUIPayload, RoleValidationResult } from "../contracts/index.ts";
import { resetRoleFitAnalysis, restoreRoleFitLiveSession, serializeRoleFitSession, sessionLifetimeMs, updateRoleFitLiveSession } from "./session.ts";

class MemoryStorage {
  private values = new Map<string, string>();

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const report: ReportUIPayload = {
  schemaVersion: "1.0",
  reportId: "report_1",
  createdAt: "2026-08-09T00:00:00.000Z",
  language: "en",
  state: "ready",
  roleSnapshot: { company: "Acme", title: "Senior UX Strategist" },
  overallFitVisual: {
    mode: "fit",
    level: "good",
    fitVisualValue: 65,
    illustrationKey: "fit-good",
    colorToken: "fit.good",
    label: "Good fit",
    rationale: "Supported by approved evidence.",
  },
  evidenceConfidence: { level: "medium", rationale: "Sufficient evidence." },
  skillsMatch: { items: [], visualCoverage: { mode: "qualitative", label: "Meaningful overlap" } },
  requirementMapping: { items: [] },
  evidencePanel: { clusters: [] },
  topStrengths: { items: [] },
  keyGaps: { items: [] },
  disclaimer: {
    copyKey: "report.disclaimer.v1",
    text: "Qualitative evidence-based report.",
  },
  contactCta: { variant: "good", label: "Contact", enabled: false },
};

const roleDraft: RoleValidationResult["roleDraft"] = {
  title: {
    originalValue: "Secret title marker",
    sourceRef: { sourceId: "test", kind: "user-text" },
    confidence: "high",
    confirmed: true,
  },
  responsibilities: [],
  requirements: [],
  preferredQualifications: [],
};

describe("Role Fit report session persistence", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { sessionStorage: new MemoryStorage() },
    });
    restoreRoleFitLiveSession().expiresAt = 0;
  });

  test("persists the structured report and coherent v2 workflow state", () => {
    const session = updateRoleFitLiveSession({
      state: "report-ready",
      reportPayload: report,
      completedReportCount: 1,
      pendingReportId: "R9K2Q",
      pendingReportConfirmation: true,
      activeRoleDraft: roleDraft,
      draftInput: "DRAFT_MARKER",
      messages: [{ id: "message_1", role: "user", content: "MESSAGE_MARKER" }],
      expandedEvidenceItemIds: ["requirement_2", "requirement_4"],
      reportAttemptState: { reportId: "R9K2Q", attempts: 1 },
    });

    const serialized = JSON.stringify(serializeRoleFitSession(session));
    const parsed = JSON.parse(serialized);

    assert.match(serialized, /report_1/);
    assert.equal(parsed.version, 2);
    assert.equal(parsed.completedReportCount, 1);
    assert.equal(parsed.pendingReportId, "R9K2Q");
    assert.equal(parsed.pendingReportConfirmation, true);
    assert.equal(parsed.state, "report-ready");
    assert.deepEqual(parsed.expandedEvidenceItemIds, ["requirement_2", "requirement_4"]);
    assert.deepEqual(parsed.reportAttemptState, { reportId: "R9K2Q", attempts: 1 });
    assert.match(serialized, /MESSAGE_MARKER|Secret title marker/);
    assert.doesNotMatch(serialized, /DRAFT_MARKER/);
  });

  test("clears the active report while preserving the completed report count", () => {
    updateRoleFitLiveSession({ reportPayload: report, completedReportCount: 2, reportAttemptState: { reportId: "R2TRY", attempts: 1 } });
    const reset = resetRoleFitAnalysis();

    assert.equal(reset.state, "awaiting-role-completion");
    assert.equal(reset.reportPayload, null);
    assert.equal(reset.completedReportCount, 2);
    assert.equal(reset.activeRoleDraft, null);
    assert.deepEqual(reset.messages, []);
    assert.equal(reset.reportAttemptState, null);
  });

  test("uses a fixed 24-hour lifetime that normal activity does not extend", () => {
    const createdAt = Date.now() - 60_000;
    const session = updateRoleFitLiveSession({ createdAt });
    const updated = updateRoleFitLiveSession({ state: "general-qa" });

    assert.equal(session.expiresAt, createdAt + sessionLifetimeMs);
    assert.equal(updated.expiresAt, session.expiresAt);
    assert.ok(updated.lastActivityAt >= session.lastActivityAt);
  });

  test("keeps the in-memory conversation during normal page navigation", () => {
    updateRoleFitLiveSession({
      state: "awaiting-role-completion",
      activeRoleDraft: roleDraft,
      pendingRoleField: "responsibilities",
      messages: [{ id: "message_navigation", role: "user", content: "Continue this conversation" }],
      expandedEvidenceItemIds: ["requirement_navigation"],
    });

    const restored = restoreRoleFitLiveSession();

    assert.equal(restored.activeRoleDraft?.title?.originalValue, "Secret title marker");
    assert.equal(restored.pendingRoleField, "responsibilities");
    assert.equal(restored.messages.at(-1)?.content, "Continue this conversation");
    assert.deepEqual(restored.expandedEvidenceItemIds, ["requirement_navigation"]);
  });

  test("normalizes abandoned generating state without resetting retry attempts", () => {
    const session = updateRoleFitLiveSession({
      state: "generating-report",
      activeRoleDraft: roleDraft,
      pendingReportId: "RTRY1",
      pendingReportConfirmation: false,
      reportAttemptState: { reportId: "RTRY1", attempts: 1 },
    });
    session.expiresAt = 0;

    const restored = restoreRoleFitLiveSession();

    assert.equal(restored.state, "recoverable-error");
    assert.equal(restored.pendingReportId, "RTRY1");
    assert.equal(restored.pendingReportConfirmation, false);
    assert.deepEqual(restored.reportAttemptState, { reportId: "RTRY1", attempts: 1 });
  });

  test("migrates a valid v1 session without trusting sliding expiry", () => {
    const createdAt = Date.now() - 60_000;
    window.sessionStorage.setItem("role-fit-report-session-v1", JSON.stringify({
      version: 1,
      sessionId: "session_v1",
      conversationId: "conv_v1",
      createdAt,
      lastActivityAt: Date.now(),
      expiresAt: Date.now() + sessionLifetimeMs * 2,
      state: "general-qa",
      activeLanguage: "en",
      reportPayload: report,
      reportProvider: "provider",
      reportModel: "model",
      completedReportCount: 1,
      pendingReportId: "RLEG1",
      expandedEvidenceItemIds: ["requirement_1"],
    }));
    restoreRoleFitLiveSession().expiresAt = 0;

    const restored = restoreRoleFitLiveSession();

    assert.equal(restored.sessionId, "session_v1");
    assert.equal(restored.conversationId, "conv_v1");
    assert.equal(restored.expiresAt, createdAt + sessionLifetimeMs);
    assert.equal(restored.state, "report-ready");
    assert.equal(restored.completedReportCount, 1);
    assert.equal(restored.reportPayload && (restored.reportPayload as ReportUIPayload).reportId, "report_1");
    assert.equal(window.sessionStorage.getItem("role-fit-report-session-v1"), null);
    assert.match(window.sessionStorage.getItem("role-fit-report-session-v2") ?? "", /"version":2/);
  });

  test("discards an expired v1 session and starts a fresh 24-hour lifecycle", () => {
    const createdAt = Date.now() - sessionLifetimeMs - 60_000;
    window.sessionStorage.setItem("role-fit-report-session-v1", JSON.stringify({
      version: 1,
      sessionId: "expired_session",
      conversationId: "expired_conv",
      createdAt,
      lastActivityAt: Date.now(),
      expiresAt: Date.now() + sessionLifetimeMs,
      state: "report-ready",
      activeLanguage: "en",
      reportPayload: report,
      reportProvider: "provider",
      reportModel: "model",
      completedReportCount: 2,
      pendingReportId: null,
      expandedEvidenceItemIds: null,
    }));
    restoreRoleFitLiveSession().expiresAt = 0;

    const restored = restoreRoleFitLiveSession();

    assert.notEqual(restored.sessionId, "expired_session");
    assert.equal(restored.completedReportCount, 0);
    assert.equal(restored.reportPayload, null);
    assert.equal(window.sessionStorage.getItem("role-fit-report-session-v1"), null);
  });
});
