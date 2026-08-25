import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { QualitativeReportAnalysis } from "../model/provider.ts";
import { createRoleDraftFromText } from "../server/role-understanding.ts";
import { getRoleAnalysisItems, resolveStableFitLevel } from "./compose-report.ts";

type AnalysisItem = QualitativeReportAnalysis["items"][number];

function item({
  roleItemIndex,
  importance = "core",
  matchType = "direct",
  impact,
  evidenceConfidence,
}: {
  roleItemIndex: number;
  importance?: AnalysisItem["importance"];
  matchType?: AnalysisItem["matchType"];
  impact?: AnalysisItem["impact"];
  evidenceConfidence?: AnalysisItem["evidenceConfidence"];
}): AnalysisItem {
  const supported = matchType === "direct" || matchType === "semantic" || matchType === "transferable";
  const semanticFields = matchType === "semantic" || matchType === "transferable"
    ? {
        sharedCapability: "The same documented professional capability is required.",
        contextDifference: "The target role applies it in a different context.",
        bridgeability: "The capability transfers through bounded domain onboarding.",
        unproven: "The exact target-domain context is not documented.",
      }
    : {};

  return {
    roleItemIndex,
    displayLabel: `Requirement ${roleItemIndex + 1}`,
    importance,
    matchType,
    impact: impact ?? (supported ? "strength" : "gap"),
    evidenceConfidence: evidenceConfidence ?? (supported ? "high" : "insufficient"),
    shortRationale: "Deterministic fit-calibration fixture.",
    evidenceSourceIds: supported || matchType === "partial" ? [`evidence-${roleItemIndex}`] : [],
    ...semanticFields,
  };
}

function analysis(
  items: AnalysisItem[],
  evidenceConfidence: QualitativeReportAnalysis["evidenceConfidence"] = "high",
): QualitativeReportAnalysis {
  return {
    fitLevel: "partial",
    fitRationale: "The model-proposed band is intentionally ignored by deterministic aggregation.",
    evidenceConfidence,
    evidenceConfidenceRationale: "The fixture uses approved evidence references.",
    skillsCoverageLabel: "Evidence-grounded coverage",
    items,
  };
}

const strongCore = () => [
  item({ roleItemIndex: 0, importance: "must-have" }),
  item({ roleItemIndex: 1, importance: "core", matchType: "semantic" }),
  item({ roleItemIndex: 2, importance: "core" }),
];

describe("deterministic three-level Overall Fit calibration", () => {
  it("keeps Strong reachable with one supporting insufficient-evidence item", () => {
    assert.equal(resolveStableFitLevel(analysis([
      ...strongCore(),
      item({ roleItemIndex: 3, importance: "supporting", matchType: "insufficient-evidence" }),
    ])), "strong");
  });

  it("keeps Strong reachable with a small bridgeable supporting domain difference", () => {
    assert.equal(resolveStableFitLevel(analysis([
      ...strongCore(),
      item({ roleItemIndex: 3, importance: "supporting", matchType: "transferable" }),
    ])), "strong");
  });

  it("uses Good for several meaningful transferable core requirements", () => {
    assert.equal(resolveStableFitLevel(analysis([
      item({ roleItemIndex: 0, importance: "must-have" }),
      item({ roleItemIndex: 1, importance: "core", matchType: "transferable" }),
      item({ roleItemIndex: 2, importance: "core", matchType: "transferable" }),
    ])), "good");
  });

  it("does not let a missing supporting nice-to-have mechanically force Partial", () => {
    assert.equal(resolveStableFitLevel(analysis([
      ...strongCore(),
      item({ roleItemIndex: 3, importance: "supporting", matchType: "real-gap" }),
    ])), "strong");
  });

  it("uses Partial for one genuine core real gap", () => {
    assert.equal(resolveStableFitLevel(analysis([
      ...strongCore(),
      item({ roleItemIndex: 3, importance: "core", matchType: "real-gap" }),
    ])), "partial");
  });

  it("uses Partial for multiple important insufficient-evidence requirements", () => {
    assert.equal(resolveStableFitLevel(analysis([
      ...strongCore(),
      item({ roleItemIndex: 3, importance: "core", matchType: "insufficient-evidence" }),
      item({ roleItemIndex: 4, importance: "must-have", matchType: "insufficient-evidence" }),
    ])), "partial");
  });

  it("preserves Partial for a material must-have hard constraint represented as a real gap", () => {
    assert.equal(resolveStableFitLevel(analysis([
      ...strongCore(),
      item({ roleItemIndex: 3, importance: "must-have", matchType: "real-gap" }),
    ])), "partial");
  });

  it("treats insufficient evidence differently from a real gap", () => {
    const oneCentralInsufficiency = analysis([
      ...strongCore(),
      item({ roleItemIndex: 3, importance: "core", matchType: "insufficient-evidence" }),
    ]);
    const oneCentralRealGap = analysis([
      ...strongCore(),
      item({ roleItemIndex: 3, importance: "core", matchType: "real-gap" }),
    ]);

    assert.equal(resolveStableFitLevel(oneCentralInsufficiency), "good");
    assert.equal(resolveStableFitLevel(oneCentralRealGap), "partial");
  });

  it("uses Strong when all important capabilities are strongly supported with normal imperfections", () => {
    assert.equal(resolveStableFitLevel(analysis([
      ...strongCore(),
      item({ roleItemIndex: 3, importance: "supporting", matchType: "insufficient-evidence" }),
      item({ roleItemIndex: 4, importance: "supporting", matchType: "transferable" }),
    ])), "strong");
  });

  it("uses Good for clear positive fit with one important but manageable evidence limitation", () => {
    assert.equal(resolveStableFitLevel(analysis([
      ...strongCore(),
      item({ roleItemIndex: 3, importance: "core", matchType: "insufficient-evidence" }),
    ])), "good");
  });

  it("keeps Partial reachable when fit is materially incomplete", () => {
    assert.equal(resolveStableFitLevel(analysis([
      item({ roleItemIndex: 0, importance: "core", matchType: "transferable" }),
      item({ roleItemIndex: 1, importance: "core", matchType: "partial" }),
      item({ roleItemIndex: 2, importance: "must-have", matchType: "insufficient-evidence" }),
    ], "medium")), "partial");
  });

  it("covers the general PTC shape without company or title exceptions", () => {
    assert.equal(resolveStableFitLevel(analysis([
      item({ roleItemIndex: 0, importance: "must-have" }),
      item({ roleItemIndex: 1, importance: "core", matchType: "semantic" }),
      item({ roleItemIndex: 2, importance: "core" }),
      item({ roleItemIndex: 3, importance: "core", matchType: "semantic" }),
      item({ roleItemIndex: 4, importance: "core", matchType: "insufficient-evidence" }),
    ])), "good");
  });

  it("does not broadly inflate a report with no supported important capability", () => {
    assert.equal(resolveStableFitLevel(analysis([
      item({ roleItemIndex: 0, importance: "core", matchType: "insufficient-evidence" }),
      item({ roleItemIndex: 1, importance: "supporting" }),
    ])), "partial");
  });

  it("returns Insufficient when no truthful supported strength exists", () => {
    assert.equal(resolveStableFitLevel(analysis([
      item({ roleItemIndex: 0, importance: "core", matchType: "insufficient-evidence" }),
    ], "insufficient")), "insufficient");
  });
});

describe("OR requirement representation audit", () => {
  it("preserves an OR requirement as one intact role-analysis item", () => {
    const roleDraft = createRoleDraftFromText([
      "Title: Director UX/UI",
      "Responsibilities: Lead UX strategy for complex technical systems",
      "Requirements: Degree in industrial engineering OR knowledge in CAD software",
    ].join("\n"));

    assert.deepEqual(roleDraft.requirements.map((field) => field.originalValue), [
      "Degree in industrial engineering OR knowledge in CAD software",
    ]);
    assert.equal(
      getRoleAnalysisItems(roleDraft).some((roleItem) =>
        roleItem.originalText === "Degree in industrial engineering OR knowledge in CAD software"),
      true,
    );
  });
});
