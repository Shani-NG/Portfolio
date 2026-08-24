import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createEvidenceSelectionState, selectRequirementEvidence } from "./evidence-selection.ts";
import type { ApprovedEvidenceBundle, ApprovedEvidenceSource } from "./load-approved-evidence.ts";

type ProjectId = "big-red-button" | "c4i" | "epd";

function caseSource(input: {
  id: string;
  projectId?: ProjectId;
  claim?: string;
  anchorId?: string;
  approvedPublicVisibility?: boolean;
}): ApprovedEvidenceSource {
  const projectId = input.projectId ?? "big-red-button";
  const project = {
    "big-red-button": { slug: "the-big-red-button", title: "The Big RED BUTTON" },
    c4i: { slug: "c4i-beyond-clarity", title: "C4I" },
    epd: { slug: "ux-from-the-heart", title: "EPD" },
  }[projectId];
  const claim = input.claim ?? "Recovery governance";
  return {
    id: input.id,
    label: input.id,
    content: claim,
    claim,
    capabilities: [claim],
    sourceType: "case-study",
    approvedPublicVisibility: input.approvedPublicVisibility ?? true,
    project: { id: projectId, ...project, ...(input.anchorId ? { anchorId: input.anchorId } : {}) },
  };
}

function cvSource(content = "Recovery governance"): ApprovedEvidenceSource {
  return { id: "cv", label: "CV", content, sourceType: "cv", approvedPublicVisibility: false };
}

function bundle(
  sources: ApprovedEvidenceSource[],
  suggestedSourceIds: string[] = sources.slice(0, 6).map((source) => source.id),
): ApprovedEvidenceBundle {
  return {
    promptContext: "",
    sources,
    candidatesByRoleItem: [{
      roleItemIndex: 0,
      roleItemText: "Recovery governance leadership",
      candidates: suggestedSourceIds.map((sourceId, index) => ({ sourceId, relevanceScore: 20 - index })),
    }],
  };
}

function select(input: {
  sources: ApprovedEvidenceSource[];
  requestedSourceIds: string[];
  state?: ReturnType<typeof createEvidenceSelectionState>;
  requirementText?: string;
  requiresEvidence?: boolean;
  suggestedSourceIds?: string[];
}) {
  return selectRequirementEvidence({
    roleItemIndex: 0,
    requirementText: input.requirementText ?? "Recovery governance leadership",
    requestedSourceIds: input.requestedSourceIds,
    evidence: bundle(input.sources, input.suggestedSourceIds),
    requiresEvidence: input.requiresEvidence ?? true,
    state: input.state ?? createEvidenceSelectionState(),
  });
}

describe("deterministic requirement evidence selection", () => {
  it("accepts sufficiently relevant canonical evidence outside the six suggested candidates", () => {
    const sources = Array.from({ length: 7 }, (_, index) => caseSource({
      id: `big-red-button:e-${index + 1}`,
      claim: `Recovery governance leadership evidence ${index + 1}`,
    }));
    const result = select({
      sources,
      requestedSourceIds: [sources[6]!.id],
      suggestedSourceIds: sources.slice(0, 6).map((source) => source.id),
    });
    assert.deepEqual(result, { ok: true, sourceIds: [sources[6]!.id] });
  });

  it("keeps a valid lower-ranked canonical selection instead of replacing or failing it", () => {
    const stronger = caseSource({ id: "c4i:stronger", projectId: "c4i", claim: "Recovery governance leadership evidence" });
    const lowerRanked = caseSource({ id: "big-red-button:lower-ranked", claim: "Recovery governance leadership" });
    const result = select({ sources: [stronger, lowerRanked], requestedSourceIds: [lowerRanked.id] });
    assert.deepEqual(result, { ok: true, sourceIds: [lowerRanked.id] });
  });

  it("prefers an unused project only when deterministic recovery is needed", () => {
    const state = createEvidenceSelectionState();
    state.projectUsage.set("big-red-button", 1);
    const reused = caseSource({ id: "big-red-button:reused", claim: "Recovery governance leadership" });
    const unused = caseSource({ id: "c4i:unused", projectId: "c4i", claim: "Recovery governance leadership" });
    const result = select({ sources: [reused, unused], requestedSourceIds: ["invented"], state });
    assert.deepEqual(result, { ok: true, sourceIds: [unused.id] });
  });

  it("reuses a project with a different evidence ID and Claim", () => {
    const first = caseSource({ id: "big-red-button:first", claim: "Recovery governance leadership" });
    const second = caseSource({ id: "big-red-button:second", claim: "Recovery governance leadership safeguards" });
    const state = createEvidenceSelectionState();
    assert.deepEqual(select({ sources: [first, second], requestedSourceIds: [first.id], state }), { ok: true, sourceIds: [first.id] });
    assert.deepEqual(select({ sources: [first, second], requestedSourceIds: [first.id], state }), { ok: true, sourceIds: [second.id] });
  });

  it("does not treat a different ID with the same Claim and section as distinct evidence", () => {
    const first = caseSource({ id: "c4i:first", projectId: "c4i", claim: "Recovery governance leadership", anchorId: "same-section" });
    const alias = caseSource({ id: "c4i:alias", projectId: "c4i", claim: "Recovery governance leadership", anchorId: "same-section" });
    const distinct = caseSource({ id: "c4i:distinct", projectId: "c4i", claim: "Recovery governance leadership safeguards", anchorId: "same-section" });
    const state = createEvidenceSelectionState();
    assert.deepEqual(select({ sources: [first, alias, distinct], requestedSourceIds: [first.id], state }), { ok: true, sourceIds: [first.id] });
    assert.deepEqual(select({ sources: [first, alias, distinct], requestedSourceIds: [alias.id], state }), { ok: true, sourceIds: [distinct.id] });
  });

  it("keeps CV as the last fallback even when the model requests it", () => {
    const caseStudy = caseSource({ id: "c4i:case-study", projectId: "c4i", claim: "Recovery governance leadership" });
    const cv = cvSource("Recovery governance leadership");
    assert.deepEqual(select({ sources: [cv, caseStudy], requestedSourceIds: [cv.id] }), { ok: true, sourceIds: [caseStudy.id] });
    assert.deepEqual(select({ sources: [cv], requestedSourceIds: [cv.id] }), { ok: true, sourceIds: [cv.id] });
  });

  it("replaces an invented model-selected ID deterministically", () => {
    const canonical = caseSource({ id: "epd:canonical", projectId: "epd", claim: "Recovery governance leadership" });
    const result = select({ sources: [canonical], requestedSourceIds: ["jd:invented-evidence"] });
    assert.deepEqual(result, { ok: true, sourceIds: [canonical.id] });
  });

  it("replaces a non-public Case Study target deterministically", () => {
    const invalid = caseSource({ id: "c4i:private", projectId: "c4i", claim: "Recovery governance leadership", approvedPublicVisibility: false });
    const canonical = caseSource({ id: "epd:public", projectId: "epd", claim: "Recovery governance leadership" });
    const result = select({ sources: [invalid, canonical], requestedSourceIds: [invalid.id] });
    assert.deepEqual(result, { ok: true, sourceIds: [canonical.id] });
  });

  it("fails when no canonical source reaches the sufficient relevance threshold", () => {
    const result = select({
      sources: [cvSource("governance")],
      requestedSourceIds: ["invented"],
      requirementText: "Recovery governance",
    });
    assert.deepEqual(result, { ok: false, diagnostic: "evidence:no-sufficiently-relevant-canonical-source" });
  });
});
