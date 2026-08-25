import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadApprovedEvidence } from "../knowledge/load-approved-evidence.ts";
import type { QualitativeReportAnalysis } from "../model/provider.ts";
import { evaluateReportEligibility, evidenceStateFromComposedReport } from "../server/eligibility.ts";
import { createRoleDraftFromText, resolveEnglishReportTitle } from "../server/role-understanding.ts";
import { composeReportUIPayload, getRoleAnalysisItems } from "./compose-report.ts";

const relatedRoleFixtures = [
  {
    name: "digital strategy, product, and AI consulting leadership",
    text: [
      "נסה עבור זאת",
      "Digital Strategy and AI Consulting Director",
      "Responsibilities",
      "Lead digital product strategy and AI transformation programs across client organizations",
      "Requirements",
      "Product strategy, roadmap prioritization, cross-functional leadership, and human-centered AI experience",
      "Own audited foundation-model training infrastructure and ML research",
    ].join("\n"),
  },
  {
    name: "AI implementation and initiatives",
    text: [
      "Title: AI Initiatives Lead",
      "Responsibilities: Lead AI workflow implementation and organizational adoption across product teams",
      "Requirements",
      "Experience with human-centered AI products, agentic workflows, governance, and change adoption",
      "Own production-scale model training and ML platform engineering",
    ].join("\n"),
  },
  {
    name: "UX/UI leadership for complex technical systems",
    text: [
      "Title: Director UX/UI for Complex Technical Systems",
      "Responsibilities: Lead UX strategy, research, and design for mission-critical technical systems",
      "Requirements",
      "Complex-system UX, cross-functional leadership, operational clarity, and product design experience",
      "Hold a regulated clinical engineering credential",
    ].join("\n"),
  },
] as const;

function balancedAnalysis(sourceId: string): QualitativeReportAnalysis {
  return {
    fitLevel: "partial",
    fitRationale: "The role shares documented product, UX, innovation, or human-centered AI capabilities with the approved evidence.",
    evidenceConfidence: "medium",
    evidenceConfidenceRationale: "Approved evidence supports the central capability while one hard requirement remains unsupported.",
    skillsCoverageLabel: "Balanced evidence-backed coverage",
    items: [
      {
        roleItemIndex: 0,
        displayLabel: "Core professional capability",
        importance: "must-have",
        matchType: "direct",
        impact: "strength",
        evidenceConfidence: "high",
        shortRationale: "Approved canonical evidence supports the central professional capability.",
        evidenceSourceIds: [sourceId],
      },
      {
        roleItemIndex: 1,
        displayLabel: "Unverified hard requirement",
        importance: "must-have",
        matchType: "insufficient-evidence",
        impact: "gap",
        evidenceConfidence: "insufficient",
        shortRationale: "The approved catalog does not establish this requirement.",
        evidenceSourceIds: [],
      },
    ],
  };
}

describe("Role Fit corrective release deterministic eval", () => {
  for (const fixture of relatedRoleFixtures) {
    it(`produces a balanced report for ${fixture.name}`, async () => {
      const roleDraft = createRoleDraftFromText(fixture.text);
      const roleItems = getRoleAnalysisItems(roleDraft);
      const evidence = await loadApprovedEvidence(fixture.text, roleItems);
      const sourceId = evidence.candidatesByRoleItem?.[0]?.candidates.find((candidate) =>
        evidence.sources.find((source) => source.id === candidate.sourceId)?.sourceType === "case-study",
      )?.sourceId;

      assert.ok(sourceId, "a related central requirement must retrieve canonical case-study evidence");
      const composition = composeReportUIPayload({
        analysis: balancedAnalysis(sourceId),
        roleDraft,
        evidence,
        language: "en",
        reportDisplayTitle: resolveEnglishReportTitle(roleDraft.title?.originalValue ?? ""),
      });

      assert.equal(composition.ok, true);
      if (!composition.ok) return;
      assert.equal(composition.report.overallFitVisual.mode, "fit");
      assert.equal(composition.report.overallFitVisual.mode === "fit" && composition.report.overallFitVisual.level, "good");
      assert.equal(composition.report.requirementMapping.items[0]?.clusterIds.length, 1);
      assert.equal(composition.report.requirementMapping.items[1]?.matchType, "insufficient-evidence");
      assert.notEqual(composition.report.requirementMapping.items[1]?.matchType, "real-gap");
      assert.equal(composition.report.evidencePanel.clusters.every((cluster) =>
        cluster.evidenceIds.every((id) => evidence.sources.some((source) => source.id === id))), true);
    });
  }

  it("keeps a genuinely unrelated role eligible for no-report", async () => {
    const roleDraft = createRoleDraftFromText([
      "Title: Senior Tax Attorney",
      "Responsibilities: Represent clients in tax litigation and draft legal opinions",
      "Requirements: Licensed attorney with tax court litigation experience",
    ].join("\n"));
    const roleItems = getRoleAnalysisItems(roleDraft);
    const evidence = await loadApprovedEvidence("tax litigation legal opinions", roleItems);
    const composition = composeReportUIPayload({
      analysis: {
        fitLevel: "out-of-scope",
        fitRationale: "The legal profession is outside the approved portfolio fit scope.",
        evidenceConfidence: "insufficient",
        evidenceConfidenceRationale: "No approved professional evidence supports legal practice.",
        skillsCoverageLabel: "Outside supported scope",
        items: [{
          roleItemIndex: 0,
          displayLabel: "Tax litigation practice",
          importance: "must-have",
          matchType: "insufficient-evidence",
          impact: "gap",
          evidenceConfidence: "insufficient",
          shortRationale: "No canonical evidence supports legal practice.",
          evidenceSourceIds: [],
        }],
      },
      roleDraft,
      evidence,
      language: "en",
    });

    assert.equal(composition.ok, true);
    if (!composition.ok) return;
    const eligibility = evaluateReportEligibility({
      session: { status: "active", completedReportCount: 0 },
      approval: { approved: true },
      evidenceState: evidenceStateFromComposedReport(composition.report),
      report: composition.report,
    });
    assert.deepEqual(eligibility, {
      state: "no-report",
      reason: "no-meaningful-fit",
      safeMessageKey: "report.no_meaningful_fit",
    });
  });
});
