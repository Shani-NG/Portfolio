import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { ReportUIPayload, RoleValidationResult } from "../contracts/index.ts";
import { resetRoleFitAnalysis, restoreRoleFitLiveSession, serializeRoleFitSession, updateRoleFitLiveSession } from "./session.ts";

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
  test("persists the structured report and direct count without raw role or conversation content", () => {
    const session = updateRoleFitLiveSession({
      state: "report-ready",
      reportPayload: report,
      completedReportCount: 1,
      pendingReportId: "R9K2Q",
      activeRoleDraft: roleDraft,
      draftInput: "DRAFT_MARKER",
      messages: [{ id: "message_1", role: "user", content: "MESSAGE_MARKER" }],
      expandedEvidenceItemIds: ["requirement_2", "requirement_4"],
    });

    const serialized = JSON.stringify(serializeRoleFitSession(session));

    assert.match(serialized, /report_1/);
    assert.equal(JSON.parse(serialized).completedReportCount, 1);
    assert.equal(JSON.parse(serialized).pendingReportId, "R9K2Q");
    assert.equal(JSON.parse(serialized).state, "report-ready");
    assert.deepEqual(JSON.parse(serialized).expandedEvidenceItemIds, ["requirement_2", "requirement_4"]);
    assert.doesNotMatch(serialized, /DRAFT_MARKER|MESSAGE_MARKER|Secret title marker/);
  });

  test("clears the active report while preserving the completed report count", () => {
    updateRoleFitLiveSession({ reportPayload: report, completedReportCount: 2 });
    const reset = resetRoleFitAnalysis();

    assert.equal(reset.state, "awaiting-role-completion");
    assert.equal(reset.reportPayload, null);
    assert.equal(reset.completedReportCount, 2);
    assert.equal(reset.activeRoleDraft, null);
    assert.deepEqual(reset.messages, []);
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
});
