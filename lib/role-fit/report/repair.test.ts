import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { QualitativeReportAnalysis } from "../model/provider.ts";
import { createCompositionFailureMetadata } from "./composition-observability.ts";
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

describe("composition failure observability", () => {
  const common = {
    traceId: "trace_safe",
    provider: "gemini",
    model: "gemini-test",
    originalDiagnostic: "semantic:partial-fit-without-gap",
  };

  it("records a composition failure that does not use model repair", () => {
    assert.deepEqual(createCompositionFailureMetadata({
      ...common,
      originalDiagnostic: "evidence:no-sufficiently-relevant-canonical-source",
      repairOutcome: "not-attempted",
      finalDiagnostic: "evidence:no-sufficiently-relevant-canonical-source",
    }), {
      traceId: "trace_safe",
      provider: "gemini",
      model: "gemini-test",
      originalDiagnostic: "evidence:no-sufficiently-relevant-canonical-source",
      repairAttempted: false,
      repairOutcome: "not-attempted",
      finalDiagnostic: "evidence:no-sufficiently-relevant-canonical-source",
    });
  });

  it("distinguishes a failed repair call with a safe category", () => {
    assert.deepEqual(createCompositionFailureMetadata({
      ...common,
      repairOutcome: "repair-call-failed",
      repairFailureCategory: "provider-error",
      finalDiagnostic: "semantic:partial-fit-without-gap",
    }), {
      traceId: "trace_safe",
      provider: "gemini",
      model: "gemini-test",
      originalDiagnostic: "semantic:partial-fit-without-gap",
      repairAttempted: true,
      repairOutcome: "repair-call-failed",
      repairFailureCategory: "provider-error",
      finalDiagnostic: "semantic:partial-fit-without-gap",
    });
  });

  it("distinguishes repaired output that still fails composition", () => {
    assert.deepEqual(createCompositionFailureMetadata({
      ...common,
      repairOutcome: "repaired-output-still-invalid",
      finalDiagnostic: "semantic:low-confidence-without-gap",
    }), {
      traceId: "trace_safe",
      provider: "gemini",
      model: "gemini-test",
      originalDiagnostic: "semantic:partial-fit-without-gap",
      repairAttempted: true,
      repairOutcome: "repaired-output-still-invalid",
      finalDiagnostic: "semantic:low-confidence-without-gap",
    });
  });

  it("emits only allowlisted metadata without raw request or model content", () => {
    const metadata = createCompositionFailureMetadata({
      ...common,
      repairOutcome: "repair-call-failed",
      repairFailureCategory: "invalid-output",
      finalDiagnostic: "semantic:partial-fit-without-gap",
    });
    const serialized = JSON.stringify(metadata);

    assert.deepEqual(Object.keys(metadata), [
      "traceId",
      "provider",
      "model",
      "originalDiagnostic",
      "repairAttempted",
      "repairOutcome",
      "repairFailureCategory",
      "finalDiagnostic",
    ]);
    assert.doesNotMatch(serialized, /roleText|prompt|payload|authorization|secret/i);
  });
});
