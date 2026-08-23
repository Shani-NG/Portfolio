import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, it } from "node:test";
import type { ReportUIPayload } from "../contracts/index.ts";
import { approvedProjectDestinations, resolveApprovedEvidenceDestination } from "../knowledge/evidence-destinations.ts";
import { loadApprovedEvidence, type ApprovedEvidenceBundle } from "../knowledge/load-approved-evidence.ts";
import type { QualitativeReportAnalysis } from "../model/provider.ts";
import { validateRoleText } from "../server/role-understanding.ts";
import { composeReportUIPayload, deriveKeyGaps, deriveTopStrengths, resolveStableFitLevel } from "./compose-report.ts";

const evidence: ApprovedEvidenceBundle = {
  promptContext: "### APPROVED_SOURCE_ID: c4i",
  sources: [
    {
      id: "c4i",
      label: "C4I case study",
      content: "Approved evidence about complex-system UX strategy.",
      sourceType: "case-study",
      approvedPublicVisibility: true,
      claim: "The project required aligning product, design, development, and stakeholders before solving individual screens.",
      project: {
        id: "c4i",
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
      "Responsibilities: Lead product discovery and align stakeholders",
      "Requirements: Complex-system UX strategy; Cross-functional product alignment; Evidence-based decisions; Conversation design; Privacy-aware product architecture",
    ].join("\n"),
    detectedLanguage: "en",
  }).roleDraft;
}

function item(
  roleItemIndex: number,
  matchType: QualitativeReportAnalysis["items"][number]["matchType"] = "direct",
  impact: QualitativeReportAnalysis["items"][number]["impact"] = "strength",
  evidenceSourceIds: string[] = ["c4i"],
): QualitativeReportAnalysis["items"][number] {
  return {
    roleItemIndex,
    displayLabel: `Capability ${roleItemIndex + 1}`,
    importance: "must-have",
    matchType,
    impact,
    evidenceConfidence: matchType === "insufficient-evidence" ? "insufficient" : "high",
    shortRationale: `Approved evidence supports capability ${roleItemIndex + 1}.`,
    ...(matchType === "semantic" || matchType === "transferable"
      ? {
          sharedCapability: `Shared capability ${roleItemIndex + 1}`,
          contextDifference: "The documented work uses a different domain and terminology.",
          bridgeability: "The same decision method can be applied with domain onboarding.",
          unproven: "The exact target-domain scale is not documented.",
        }
      : {}),
    evidenceSourceIds,
  };
}

function analysis(overrides: Partial<QualitativeReportAnalysis> = {}): QualitativeReportAnalysis {
  return {
    fitLevel: "strong",
    fitRationale: "The role is strongly aligned with documented complex-system strategy work.",
    evidenceConfidence: "high",
    evidenceConfidenceRationale: "The assessment uses approved project evidence.",
    skillsCoverageLabel: "Strong evidence-backed coverage",
    items: [item(0)],
    ...overrides,
  };
}

describe("stable qualitative fit", () => {
  it("returns the same band for the same evidence mapping even when the model band varies", () => {
    const strongClaim = analysis({ fitLevel: "strong" });
    const goodClaim = analysis({ fitLevel: "good" });

    assert.equal(resolveStableFitLevel(strongClaim), "strong");
    assert.equal(resolveStableFitLevel(goodClaim), "strong");
  });

  it("uses a qualitative limitation to resolve partial fit without a numeric score", () => {
    const limited = analysis({ fitLevel: "partial", items: [item(0, "partial", "gap")] });
    assert.equal(resolveStableFitLevel(limited), "partial");
  });
});

function reportItem(
  index: number,
  matchType: ReportUIPayload["requirementMapping"]["items"][number]["matchType"],
  impact: ReportUIPayload["requirementMapping"]["items"][number]["impact"],
  clusterIds: string[] = [],
): ReportUIPayload["requirementMapping"]["items"][number] {
  const capabilityNames = [
    "Research leadership",
    "Conversation architecture",
    "Evidence governance",
    "Clinical workflow design",
    "Operational analytics",
    "Privacy controls",
    "System integration",
  ];
  const capability = capabilityNames[index - 1] ?? `Capability ${index}`;
  return {
    itemId: `item-${index}`,
    originalText: `Requirement ${index}`,
    displayLabel: capability,
    normalizedConcept: capability,
    source: "requirement",
    importance: "core",
    matchType,
    impact,
    evidenceConfidence: "high",
    shortRationale: `Rationale ${index}`,
    clusterIds,
  };
}

describe("Task C evidence and report integrity", () => {
  it("C01 resolves a valid approved exact anchor", async () => {
    const bundle = await loadApprovedEvidence("organizational alignment stakeholders product development C4I");
    const source = bundle.sources.find((candidate) => candidate.id === "c4i:e-c4i-01");
    assert.ok(source);
    const resolved = resolveApprovedEvidenceDestination({
      sourceId: source.id,
      projectId: source.project?.id,
      exactAnchorId: source.project?.anchorId,
    });
    assert.equal(resolved.destination.mode, "anchor");
    assert.equal(resolved.destination.href, "/experience/c4i-beyond-clarity#before-ux-organizational-alignment");
  });

  it("C02 falls back to the approved project route when no anchor is available", () => {
    const resolved = resolveApprovedEvidenceDestination({ sourceId: "c4i:e-02", projectId: "c4i" });
    assert.deepEqual(resolved.destination, {
      mode: "project-top",
      href: "/experience/c4i-beyond-clarity",
      dedupeKey: "/experience/c4i-beyond-clarity",
    });
  });

  it("C03 rejects an invalid evidence ID", () => {
    const result = composeReportUIPayload({ analysis: analysis({ items: [item(0, "direct", "strength", ["invented-source"])] }), roleDraft: roleDraft(), evidence, language: "en" });
    assert.deepEqual(result, { ok: false, diagnostic: "evidence:unapproved-source-id" });
  });

  it("C04 ignores an invented anchor and uses the approved fallback", () => {
    const inventedAnchorEvidence: ApprovedEvidenceBundle = {
      ...evidence,
      sources: [{ ...evidence.sources[0]!, project: { ...evidence.sources[0]!.project!, anchorId: "model-invented-anchor" } }],
    };
    const result = composeReportUIPayload({ analysis: analysis(), roleDraft: roleDraft(), evidence: inventedAnchorEvidence, language: "en" });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.report.evidencePanel.clusters[0]?.destination.mode, "project-top");
  });

  it("C05 makes Role Fit Agent evidence available for a relevant requirement", async () => {
    const bundle = await loadApprovedEvidence("agentic workflows conversation design evidence-based AI report");
    assert.ok(bundle.sources.some((source) => source.id.startsWith("role-fit-agent:")));
  });

  it("C06 does not select Role Fit Agent for an unrelated requirement", async () => {
    const bundle = await loadApprovedEvidence("clinical electrophysiology catheter visualization");
    assert.equal(bundle.sources.some((source) => source.id.startsWith("role-fit-agent:")), false);
  });

  it("C07 limits Top Strengths to supported direct, semantic, and transferable strengths", () => {
    const items = [
      reportItem(1, "direct", "strength", ["evidence-1"]),
      reportItem(2, "semantic", "strength", ["evidence-2"]),
      reportItem(3, "transferable", "strength", ["evidence-3"]),
      reportItem(4, "partial", "strength", ["evidence-4"]),
      reportItem(5, "insufficient-evidence", "strength"),
      reportItem(6, "real-gap", "strength"),
      reportItem(7, "direct", "strength"),
    ];
    assert.deepEqual(deriveTopStrengths(items).map((entry) => entry.matchType), ["direct", "semantic", "transferable"]);
  });

  it("C08 does not add filler when only two strengths are valid", () => {
    assert.equal(deriveTopStrengths([
      reportItem(1, "direct", "strength", ["evidence-1"]),
      reportItem(2, "semantic", "strength", ["evidence-2"]),
    ]).length, 2);
  });

  it("C09 limits Key Gaps to eligible partial, insufficient-evidence, and real-gap items", () => {
    const gaps = deriveKeyGaps([
      reportItem(1, "partial", "gap"),
      reportItem(2, "insufficient-evidence", "gap"),
      reportItem(3, "real-gap", "gap"),
      reportItem(4, "direct", "gap", ["evidence-4"]),
    ]);
    assert.deepEqual(gaps.map((entry) => entry.matchType), ["partial", "insufficient-evidence", "real-gap"]);
  });

  it("C10 preserves insufficient evidence instead of converting it to a real gap", () => {
    const result = composeReportUIPayload({
      analysis: analysis({ fitLevel: "partial", items: [item(0, "insufficient-evidence", "gap", [])] }),
      roleDraft: roleDraft(),
      evidence,
      language: "en",
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.report.keyGaps.items[0]?.matchType, "insufficient-evidence");
  });

  it("C11 blocks Partial Fit when no gap-eligible item exists", () => {
    const result = composeReportUIPayload({ analysis: analysis({ fitLevel: "partial" }), roleDraft: roleDraft(), evidence, language: "en" });
    assert.deepEqual(result, { ok: false, diagnostic: "semantic:partial-fit-without-gap" });
  });

  it("C12 allows Good Fit with no gaps when evidence confidence is sufficient", () => {
    const result = composeReportUIPayload({ analysis: analysis({ fitLevel: "good", evidenceConfidence: "medium" }), roleDraft: roleDraft(), evidence, language: "en" });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.report.keyGaps.items.length, 0);
  });

  it("C13 blocks low evidence confidence with no gaps", () => {
    const result = composeReportUIPayload({ analysis: analysis({ fitLevel: "good", evidenceConfidence: "low" }), roleDraft: roleDraft(), evidence, language: "en" });
    assert.deepEqual(result, { ok: false, diagnostic: "semantic:low-confidence-without-gap" });
  });

  it("C14 deduplicates one evidence card used by two requirements", () => {
    const result = composeReportUIPayload({ analysis: analysis({ items: [item(0), item(1)] }), roleDraft: roleDraft(), evidence, language: "en" });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.report.requirementMapping.items.length, 2);
    assert.equal(result.report.evidencePanel.clusters.length, 1);
    assert.equal(result.report.evidencePanel.clusters[0]?.supportedItemIds.length, 2);
  });

  it("prefers supporting case studies over CV evidence", () => {
    const evidenceWithCv: ApprovedEvidenceBundle = {
      promptContext: "Approved case-study and CV evidence",
      sources: [
        ...evidence.sources,
        {
          id: "cv",
          label: "CV knowledge",
          content: "Approved CV evidence.",
          sourceType: "cv",
          approvedPublicVisibility: true,
        },
      ],
    };
    const result = composeReportUIPayload({
      analysis: analysis({ items: [item(0, "direct", "strength", ["cv", "c4i"])] }),
      roleDraft: roleDraft(),
      evidence: evidenceWithCv,
      language: "en",
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(result.report.evidencePanel.clusters.flatMap((cluster) => cluster.evidenceIds), ["c4i"]);
  });

  it("uses CV evidence when no case study supports the requirement", () => {
    const cvOnlyEvidence: ApprovedEvidenceBundle = {
      promptContext: "Approved CV evidence",
      sources: [{
        id: "cv",
        label: "CV knowledge",
        content: "Approved CV evidence.",
        sourceType: "cv",
        approvedPublicVisibility: true,
      }],
    };
    const result = composeReportUIPayload({
      analysis: analysis({ items: [item(0, "direct", "strength", ["cv"])] }),
      roleDraft: roleDraft(),
      evidence: cvOnlyEvidence,
      language: "en",
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(result.report.evidencePanel.clusters.flatMap((cluster) => cluster.evidenceIds), ["cv"]);
  });

  it("never displays CV evidence when supporting case studies exist", () => {
    const caseStudySources: ApprovedEvidenceBundle["sources"] = [
      { id: "c4i", label: "C4I", content: "C4I evidence", sourceType: "case-study", approvedPublicVisibility: true, project: { id: "c4i", slug: "c4i-beyond-clarity", title: "C4I" } },
      { id: "epd", label: "EPD", content: "EPD evidence", sourceType: "case-study", approvedPublicVisibility: true, project: { id: "epd", slug: "ux-from-the-heart", title: "EPD" } },
      { id: "howtool", label: "HOWTOOL", content: "HOWTOOL evidence", sourceType: "case-study", approvedPublicVisibility: true, project: { id: "howtool", slug: "nobody-reads-the-manual", title: "HOWTOOL" } },
      { id: "monitoring", label: "Monitoring", content: "Monitoring evidence", sourceType: "case-study", approvedPublicVisibility: true, project: { id: "monitoring", slug: "monitoring-product-intelligence", title: "Monitoring" } },
    ];
    const fiveCardEvidence: ApprovedEvidenceBundle = {
      promptContext: "Approved evidence",
      sources: [
        { id: "cv", label: "CV", content: "CV evidence", sourceType: "cv", approvedPublicVisibility: true },
        ...caseStudySources,
      ],
    };
    const result = composeReportUIPayload({
      analysis: analysis({ items: [item(0, "direct", "strength", ["cv", "c4i", "epd", "howtool", "monitoring"])] }),
      roleDraft: roleDraft(),
      evidence: fiveCardEvidence,
      language: "en",
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(result.report.evidencePanel.clusters.flatMap((cluster) => cluster.evidenceIds), ["c4i", "epd", "howtool", "monitoring"]);
  });

  it("C15 never turns raw JD text into an approved evidence source", async () => {
    const jdOnlyClaim = "JD-only secret capability zxqv";
    const bundle = await loadApprovedEvidence(jdOnlyClaim);
    assert.equal(bundle.sources.some((source) => source.content.includes(jdOnlyClaim)), false);
  });

  it("C16 keeps fit output qualitative while exposing traceable coverage counts", () => {
    const result = composeReportUIPayload({ analysis: analysis({ fitLevel: "good" }), roleDraft: roleDraft(), evidence, language: "en" });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    const visibleFitCopy = result.report.overallFitVisual.mode === "fit"
      ? `${result.report.overallFitVisual.label} ${result.report.overallFitVisual.rationale}`
      : result.report.overallFitVisual.label;
    assert.doesNotMatch(visibleFitCopy, /%|\bscore\b/i);
    assert.deepEqual(result.report.skillsMatch.visualCoverage, {
      mode: "traceable-count",
      matchedCount: 1,
      totalCount: 1,
    });
  });

  it("C17 blocks hiring recommendation language", () => {
    const result = composeReportUIPayload({ analysis: analysis({ fitRationale: "Hire Shani for this role." }), roleDraft: roleDraft(), evidence, language: "en" });
    assert.deepEqual(result, { ok: false, diagnostic: "semantic:hiring-recommendation" });
  });

  it("C18 blocks schema-valid output with a semantic contradiction", () => {
    const incompleteSemanticItem = item(0, "semantic");
    delete incompleteSemanticItem.contextDifference;
    const result = composeReportUIPayload({ analysis: analysis({ items: [incompleteSemanticItem] }), roleDraft: roleDraft(), evidence, language: "en" });
    assert.deepEqual(result, { ok: false, diagnostic: "semantic:incomplete-semantic-rationale" });
  });

  it("keeps every approved destination anchor aligned with a published page ID", async () => {
    const publishedSource = (
      await Promise.all([
        readFile(join(process.cwd(), "app", "experience", "[slug]", "page.tsx"), "utf8"),
        readFile(join(process.cwd(), "app", "experience", "role-fit-agent", "page.tsx"), "utf8"),
        readFile(join(process.cwd(), "lib", "portfolio-content.ts"), "utf8"),
      ])
    ).join("\n");

    for (const project of Object.values(approvedProjectDestinations)) {
      for (const anchor of project.anchors) {
        assert.ok(publishedSource.includes(`"${anchor}"`), `${project.projectId} anchor is not published: ${anchor}`);
      }
    }
  });
});
