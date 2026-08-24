import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { QualitativeReportAnalysis } from "../model/provider.ts";
import { constrainRepairAnalysis, shouldUseModelRepair } from "./repair.ts";

function analysis(overrides: Partial<QualitativeReportAnalysis> = {}): QualitativeReportAnalysis {
  return {
    fitLevel: "strong",
    fitRationale: "Original rationale.",
    evidenceConfidence: "high",
    evidenceConfidenceRationale: "Original confidence.",
    skillsCoverageLabel: "Original coverage.",
    items: [{
      roleItemIndex: 0,
      displayLabel: "System strategy",
      importance: "core",
      matchType: "direct",
      impact: "strength",
      evidenceConfidence: "high",
      shortRationale: "Original item rationale.",
      evidenceSourceIds: ["invented"],
    }],
    ...overrides,
  };
}

describe("report repair boundary", () => {
  it("keeps evidence recovery deterministic and reserves Gemini repair for semantic or structural issues", () => {
    assert.equal(shouldUseModelRepair("evidence:no-sufficiently-relevant-canonical-source"), false);
    assert.equal(shouldUseModelRepair("semantic:incomplete-semantic-rationale"), true);
    assert.equal(shouldUseModelRepair("composition:invalid-role-item-index"), true);
  });

  it("allows an evidence repair to change only source IDs", () => {
    const original = analysis();
    const repaired = analysis({
      fitLevel: "partial",
      fitRationale: "Changed rationale.",
      items: [{
        ...original.items[0]!,
        matchType: "real-gap",
        impact: "gap",
        shortRationale: "Changed item rationale.",
        evidenceSourceIds: ["c4i:e-c4i-01"],
      }],
    });
    const constrained = constrainRepairAnalysis({ original, repaired, diagnostic: "evidence:unapproved-source-id" });

    assert.equal(constrained.fitLevel, "strong");
    assert.equal(constrained.fitRationale, "Original rationale.");
    assert.equal(constrained.items[0]?.matchType, "direct");
    assert.equal(constrained.items[0]?.shortRationale, "Original item rationale.");
    assert.deepEqual(constrained.items[0]?.evidenceSourceIds, ["c4i:e-c4i-01"]);
  });

  it("allows a semantic repair to correct the semantic structure", () => {
    const original = analysis();
    const repaired = analysis({ fitLevel: "partial", fitRationale: "Corrected semantic rationale." });
    assert.equal(
      constrainRepairAnalysis({ original, repaired, diagnostic: "semantic:incomplete-semantic-rationale" }),
      repaired,
    );
  });
});
