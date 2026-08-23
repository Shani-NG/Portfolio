import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createEvidenceSelectionState, selectRequirementEvidence } from "./evidence-selection.ts";
import type { ApprovedEvidenceBundle, ApprovedEvidenceSource } from "./load-approved-evidence.ts";

function caseSource(id: string, projectId: "big-red-button" | "c4i" | "epd"): ApprovedEvidenceSource {
  const project = {
    "big-red-button": { slug: "the-big-red-button", title: "The Big RED BUTTON" },
    c4i: { slug: "c4i-beyond-clarity", title: "C4I" },
    epd: { slug: "ux-from-the-heart", title: "EPD" },
  }[projectId];
  return { id, label: id, content: id, sourceType: "case-study", approvedPublicVisibility: true, project: { id: projectId, ...project } };
}

const sources: ApprovedEvidenceSource[] = [
  caseSource("big-red-button:one", "big-red-button"),
  caseSource("big-red-button:two", "big-red-button"),
  caseSource("big-red-button:three", "big-red-button"),
  caseSource("c4i:one", "c4i"),
  caseSource("epd:irrelevant", "epd"),
  { id: "cv", label: "CV", content: "CV", sourceType: "cv", approvedPublicVisibility: false },
];

function bundle(candidates: Array<{ sourceId: string; relevanceScore: number }>): ApprovedEvidenceBundle {
  return { promptContext: "", sources, candidatesByRoleItem: [{ roleItemIndex: 0, roleItemText: "requirement", candidates }] };
}

describe("deterministic requirement evidence selection", () => {
  it("accepts approved relevant evidence and selects Big Red Button when requested", () => {
    const result = selectRequirementEvidence({
      roleItemIndex: 0,
      requestedSourceIds: ["big-red-button:one"],
      evidence: bundle([{ sourceId: "big-red-button:one", relevanceScore: 10 }]),
      requiresEvidence: true,
      state: createEvidenceSelectionState(),
    });
    assert.deepEqual(result, { ok: true, sourceIds: ["big-red-button:one"] });
  });

  it("rejects evidence that is globally approved but outside the requirement candidate set", () => {
    const result = selectRequirementEvidence({
      roleItemIndex: 0,
      requestedSourceIds: ["epd:irrelevant"],
      evidence: bundle([{ sourceId: "big-red-button:one", relevanceScore: 10 }]),
      requiresEvidence: true,
      state: createEvidenceSelectionState(),
    });
    assert.deepEqual(result, { ok: false, diagnostic: "evidence:source-not-in-requirement-candidates" });
  });

  it("rejects invented IDs", () => {
    const result = selectRequirementEvidence({
      roleItemIndex: 0,
      requestedSourceIds: ["invented"],
      evidence: bundle([{ sourceId: "big-red-button:one", relevanceScore: 10 }]),
      requiresEvidence: true,
      state: createEvidenceSelectionState(),
    });
    assert.deepEqual(result, { ok: false, diagnostic: "evidence:unapproved-source-id" });
  });

  it("enforces case-study-first by rejecting CV when a case-study candidate exists", () => {
    const result = selectRequirementEvidence({
      roleItemIndex: 0,
      requestedSourceIds: ["cv"],
      evidence: bundle([{ sourceId: "big-red-button:one", relevanceScore: 10 }]),
      requiresEvidence: true,
      state: createEvidenceSelectionState(),
    });
    assert.deepEqual(result, { ok: false, diagnostic: "evidence:source-not-in-requirement-candidates" });
  });

  it("uses CV as fallback when it is the only qualifying candidate", () => {
    const result = selectRequirementEvidence({
      roleItemIndex: 0,
      requestedSourceIds: ["cv"],
      evidence: bundle([{ sourceId: "cv", relevanceScore: 4 }]),
      requiresEvidence: true,
      state: createEvidenceSelectionState(),
    });
    assert.deepEqual(result, { ok: true, sourceIds: ["cv"] });
  });

  it("prefers a similarly relevant alternate project after the soft cap", () => {
    const state = createEvidenceSelectionState();
    state.projectUsage.set("big-red-button", 2);
    const result = selectRequirementEvidence({
      roleItemIndex: 0,
      requestedSourceIds: ["big-red-button:three", "c4i:one"],
      evidence: bundle([
        { sourceId: "big-red-button:three", relevanceScore: 10 },
        { sourceId: "c4i:one", relevanceScore: 9 },
      ]),
      requiresEvidence: true,
      state,
    });
    assert.deepEqual(result, { ok: true, sourceIds: ["c4i:one"] });
  });

  it("allows a third item from one project when no valid alternative was requested", () => {
    const state = createEvidenceSelectionState();
    state.projectUsage.set("big-red-button", 2);
    const result = selectRequirementEvidence({
      roleItemIndex: 0,
      requestedSourceIds: ["big-red-button:three"],
      evidence: bundle([{ sourceId: "big-red-button:three", relevanceScore: 10 }]),
      requiresEvidence: true,
      state,
    });
    assert.deepEqual(result, { ok: true, sourceIds: ["big-red-button:three"] });
  });
});
