import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { ReportUIPayload } from "../contracts/index.ts";
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

describe("Role Fit report session persistence", () => {
  test("persists the structured report and direct count without raw role or conversation content", () => {
    const session = updateRoleFitLiveSession({
      state: "report-ready",
      reportPayload: report,
      completedReportCount: 1,
      activeRoleText: "RAW_JOB_DESCRIPTION_MARKER",
      activeRoleTitle: "Secret title marker",
      activeRoleCompany: "Secret company marker",
      draftInput: "DRAFT_MARKER",
      messages: [{ id: "message_1", role: "user", content: "MESSAGE_MARKER" }],
      expandedEvidenceItemIds: ["requirement_2", "requirement_4"],
    });

    const serialized = JSON.stringify(serializeRoleFitSession(session));

    assert.match(serialized, /report_1/);
    assert.equal(JSON.parse(serialized).completedReportCount, 1);
    assert.equal(JSON.parse(serialized).state, "report-ready");
    assert.deepEqual(JSON.parse(serialized).expandedEvidenceItemIds, ["requirement_2", "requirement_4"]);
    assert.doesNotMatch(serialized, /RAW_JOB_DESCRIPTION_MARKER|DRAFT_MARKER|MESSAGE_MARKER|Secret title marker|Secret company marker/);
  });

  test("clears the active report while preserving the completed report count", () => {
    updateRoleFitLiveSession({ reportPayload: report, completedReportCount: 2 });
    const reset = resetRoleFitAnalysis();

    assert.equal(reset.state, "awaiting-role-completion");
    assert.equal(reset.reportPayload, null);
    assert.equal(reset.completedReportCount, 2);
    assert.equal(reset.activeRoleText, "");
    assert.deepEqual(reset.messages, []);
  });

  test("keeps the in-memory conversation during normal page navigation", () => {
    updateRoleFitLiveSession({
      state: "awaiting-role-completion",
      activeRoleText: "Title: UX Position",
      pendingRoleField: "responsibilities",
      messages: [{ id: "message_navigation", role: "user", content: "Continue this conversation" }],
      expandedEvidenceItemIds: ["requirement_navigation"],
    });

    const restored = restoreRoleFitLiveSession();

    assert.equal(restored.activeRoleText, "Title: UX Position");
    assert.equal(restored.pendingRoleField, "responsibilities");
    assert.equal(restored.messages.at(-1)?.content, "Continue this conversation");
    assert.deepEqual(restored.expandedEvidenceItemIds, ["requirement_navigation"]);
  });
});
