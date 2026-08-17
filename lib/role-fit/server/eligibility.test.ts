import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { ReportUIPayload } from "../contracts/index.ts";
import { createRoleValidationResult, canProceedToReportEligibility, evidenceStateFromComposedReport, evaluateReportEligibility, getMissingRequiredRoleFields } from "./eligibility.ts";

function field<T>(originalValue: T, confirmed = true) {
  return {
    originalValue,
    sourceRef: {
      sourceId: "src_1",
      kind: "user-text" as const,
    },
    confidence: "high" as const,
    confirmed,
  };
}

const completeRoleDraft = {
  company: field("Acme"),
  title: field("Senior UX Strategist"),
  description: field("Lead UX strategy for complex operational products."),
  responsibilities: [field("Align product, engineering, and leadership.")],
  requirements: [field("Experience with complex systems and research.")],
  preferredQualifications: [],
};

const readyReport = {
  schemaVersion: "1.0",
  reportId: "rpt_1",
  createdAt: "2026-07-27T00:00:00.000Z",
  language: "en",
  state: "ready",
  roleSnapshot: {
    company: "Acme",
    title: "Senior UX Strategist",
  },
  overallFitVisual: {
    mode: "fit",
    level: "good",
    fitVisualValue: 65,
    illustrationKey: "fit-good",
    colorToken: "fit.good",
    label: "Good fit",
    rationale: "Supported by approved evidence.",
  },
  evidenceConfidence: {
    level: "medium",
    rationale: "Evidence is sufficient for a bounded qualitative conclusion.",
  },
  skillsMatch: {
    items: [],
    visualCoverage: {
      mode: "qualitative",
      label: "Meaningful overlap",
    },
  },
  requirementMapping: {
    items: [],
  },
  evidencePanel: {
    clusters: [],
  },
  topStrengths: {
    items: [],
  },
  keyGaps: {
    items: [],
  },
  disclaimer: {
    copyKey: "report.disclaimer.v1",
    text: "This qualitative report is based on the submitted role description and approved portfolio evidence. It is not an ATS decision, does not replace human judgment, and the visual fit indicator is not a literal numeric score.",
  },
  contactCta: {
    variant: "good",
    label: "Contact",
    enabled: true,
  },
};

describe("Role Fit validation foundation", () => {
  test("requires the canonical mandatory role fields", () => {
    assert.deepEqual(
      getMissingRequiredRoleFields({
        ...completeRoleDraft,
        title: field(" "),
        responsibilities: [],
      }),
      ["title", "responsibilities"],
    );
  });

  test("creates a complete role validation result without storing raw job text", () => {
    const result = createRoleValidationResult({
      conversationId: "conv_1",
      traceId: "trace_1",
      roleDraft: completeRoleDraft,
      detectedLanguage: "en",
    });

    assert.equal(result.parseStatus, "valid-complete");
    assert.equal(result.recommendedNextAction, "role-ready");
    assert.equal(canProceedToReportEligibility(result), true);
    assert.equal("rawContent" in result, false);
  });

  test("keeps incomplete roles out of report eligibility", () => {
    const result = createRoleValidationResult({
      conversationId: "conv_1",
      traceId: "trace_1",
      roleDraft: {
        ...completeRoleDraft,
        requirements: [],
      },
      detectedLanguage: "en",
    });

    assert.equal(result.parseStatus, "valid-incomplete");
    assert.deepEqual(result.missingFields, ["requirements"]);
    assert.equal(canProceedToReportEligibility(result), false);
  });
});

describe("Role Fit eligibility foundation", () => {
  test("maps composed insufficient and out-of-scope reports to the existing no-report eligibility inputs", () => {
    const insufficient = {
      overallFitVisual: {
        mode: "insufficient",
        label: "Insufficient evidence",
        rationale: "Approved evidence is insufficient.",
      },
    } satisfies Pick<ReportUIPayload, "overallFitVisual">;
    const outOfScope = {
      overallFitVisual: {
        mode: "out-of-scope",
        label: "Outside the supported role scope",
        rationale: "The role is outside the supported scope.",
      },
    } satisfies Pick<ReportUIPayload, "overallFitVisual">;
    const completedFits = [
      { level: "strong" as const, fitVisualValue: 82, illustrationKey: "fit-strong" as const, colorToken: "fit.strong" as const },
      { level: "good" as const, fitVisualValue: 65, illustrationKey: "fit-good" as const, colorToken: "fit.good" as const },
      { level: "partial" as const, fitVisualValue: 45, illustrationKey: "fit-partial" as const, colorToken: "fit.partial" as const },
    ].map((fit) => ({
      overallFitVisual: {
        mode: "fit" as const,
        ...fit,
        label: "Completed fit",
        rationale: "Approved evidence supports the report.",
      },
    } satisfies Pick<ReportUIPayload, "overallFitVisual">));

    assert.equal(evidenceStateFromComposedReport(insufficient), "insufficient-evidence");
    assert.equal(evidenceStateFromComposedReport(outOfScope), "no-meaningful-fit");
    for (const completedFit of completedFits) {
      assert.equal(evidenceStateFromComposedReport(completedFit), "ready");
    }
  });

  test("blocks a third completed-report request before generation", () => {
    const result = evaluateReportEligibility({
      session: {
        status: "active",
        completedReportCount: 2,
      },
      approval: {
        approved: true,
      },
      evidenceState: "ready",
      report: readyReport,
    });

    assert.deepEqual(result, {
      state: "blocked",
      reason: "report-limit-reached",
      safeMessageKey: "report.limit_reached",
    });
  });

  test("blocks report generation before explicit approval", () => {
    const result = evaluateReportEligibility({
      session: {
        status: "active",
        completedReportCount: 0,
      },
      approval: {
        approved: false,
      },
      evidenceState: "ready",
      report: readyReport,
    });

    assert.equal(result.state, "blocked");
    assert.equal(result.reason, "approval-missing");
  });

  test("returns no-report outcomes without creating completed report eligibility", () => {
    const result = evaluateReportEligibility({
      session: {
        status: "active",
        completedReportCount: 1,
      },
      approval: {
        approved: true,
      },
      evidenceState: "insufficient-evidence",
    });

    assert.deepEqual(result, {
      state: "no-report",
      reason: "insufficient-evidence",
      safeMessageKey: "report.insufficient_evidence",
    });
  });

  test("returns a ready report only after session, approval, and evidence gates pass", () => {
    const result = evaluateReportEligibility({
      session: {
        status: "active",
        completedReportCount: 1,
      },
      approval: {
        approved: true,
      },
      evidenceState: "ready",
      report: readyReport,
    });

    assert.equal(result.state, "ready");
    assert.equal(result.report.reportId, "rpt_1");
  });
});
