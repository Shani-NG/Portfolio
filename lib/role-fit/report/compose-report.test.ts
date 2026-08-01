import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ApprovedEvidenceBundle } from "../knowledge/load-approved-evidence.ts";
import type { QualitativeReportAnalysis } from "../model/provider.ts";
import { validateRoleText } from "../server/role-understanding.ts";
import { composeReportUIPayload } from "./compose-report.ts";

const evidence: ApprovedEvidenceBundle = {
  promptContext: "### APPROVED_SOURCE_ID: c4i",
  sources: [
    {
      id: "c4i",
      label: "C4I case study",
      content: "Approved evidence about complex-system UX strategy.",
      project: {
        slug: "c4i-beyond-clarity",
        title: "C4I - Beyond Clarity",
        anchorId: "before-ux-organizational-alignment",
      },
    },
  ],
};

function roleDraft() {
  return validateRoleText({
    conversationId: "conv_test",
    traceId: "trace_test",
    roleText: [
      "Title: Senior UX Strategist",
      "Responsibilities: Lead UX strategy for complex products",
      "Requirements: Experience aligning product and engineering",
    ].join("\n"),
    detectedLanguage: "en",
  }).roleDraft;
}

function analysis(sourceId = "c4i"): QualitativeReportAnalysis {
  return {
    fitLevel: "strong",
    fitRationale: "The role is strongly aligned with documented complex-system strategy work.",
    evidenceConfidence: "high",
    evidenceConfidenceRationale: "The assessment uses approved project evidence.",
    skillsCoverageLabel: "Strong evidence-backed coverage",
    items: [
      {
        roleItemIndex: 0,
        displayLabel: "Cross-functional product alignment",
        importance: "must-have",
        matchType: "direct",
        impact: "strength",
        evidenceConfidence: "high",
        shortRationale: "The C4I case documents product and engineering alignment.",
        evidenceSourceIds: [sourceId],
      },
    ],
  };
}

describe("deterministic Role Fit report composition", () => {
  it("constructs IDs, destinations, clusters, and the final UI payload in application code", () => {
    const result = composeReportUIPayload({ analysis: analysis(), roleDraft: roleDraft(), evidence, language: "en" });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.report.requirementMapping.items[0]?.originalText, "Experience aligning product and engineering");
    assert.equal(result.report.requirementMapping.items[0]?.clusterIds[0], "evidence-c4i");
    assert.equal(result.report.evidencePanel.clusters[0]?.destination.mode, "anchor");
    assert.equal(result.report.topStrengths.items[0]?.itemId, result.report.requirementMapping.items[0]?.itemId);
  });

  it("rejects evidence source IDs that were not retrieved and approved", () => {
    const result = composeReportUIPayload({ analysis: analysis("invented-source"), roleDraft: roleDraft(), evidence, language: "en" });

    assert.deepEqual(result, { ok: false, diagnostic: "evidence:unapproved-source-id" });
  });
});
