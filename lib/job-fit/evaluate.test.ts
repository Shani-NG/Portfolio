import assert from "node:assert/strict";
import test from "node:test";
import { evaluationKeyForCandidate, prepareCanonicalJobFit, roleDraftFromNormalizedCandidate } from "./evaluate.ts";

const candidate = {
  sourceDedupeKey: "company-example-product-lead-2026-08-19",
  contentHash: "6d8792c279ced1271a5fc8af5eb4f6e8c7e1cc272bd463ac416f4b9f5e6e239b",
  role: "Senior Product Lead",
  company: "Example Co",
  location: "Tel Aviv",
  workModel: "hybrid" as const,
  cleanedJobContent: "Example Co is hiring a Senior Product Lead. Responsibilities: Lead cross-functional product delivery across complex systems and partner with design, research, engineering and commercial teams. Define product strategy and prioritise roadmaps based on customer evidence. Requirements: Five years of product leadership experience with complex digital products and strong stakeholder communication. Experience with practical AI implementation and measurable product outcomes.",
  conciseRoleSummary: "Product leadership role across complex systems with practical AI implementation responsibility.",
  responsibilities: [
    "Lead cross-functional product delivery across complex systems and partner with design, research, engineering and commercial teams.",
    "Define product strategy and prioritise roadmaps based on customer evidence.",
  ],
  requirements: [
    "Five years of product leadership experience with complex digital products and strong stakeholder communication.",
    "Experience with practical AI implementation and measurable product outcomes.",
  ],
  preferredQualifications: [],
  language: "en" as const,
};

test("Central Job-Fit builds a RoleDraft from the normalized candidate without a source fetch or second extraction", () => {
  const draft = roleDraftFromNormalizedCandidate(candidate);
  assert.equal(draft.title?.originalValue, "Senior Product Lead");
  assert.equal(draft.company?.originalValue, "Example Co");
  assert.deepEqual(draft.responsibilities.map((item) => item.originalValue), candidate.responsibilities);
  assert.deepEqual(draft.requirements.map((item) => item.originalValue), candidate.requirements);
  assert.equal(draft.description?.originalValue, candidate.cleanedJobContent);
  assert.equal(draft.title?.sourceRef.label, "NormalizedJobCandidate");
});

test("Central Job-Fit validates sufficient normalized candidate data before model evaluation", () => {
  const prepared = prepareCanonicalJobFit(candidate);
  assert.equal(prepared.ok, true);
  if (prepared.ok) assert.equal(prepared.validation.parseStatus, "valid-complete");
});

test("Central Job-Fit derives a stable retry key from source identity and normalized content", () => {
  assert.equal(evaluationKeyForCandidate(candidate), evaluationKeyForCandidate({ ...candidate }));
  assert.notEqual(evaluationKeyForCandidate(candidate), evaluationKeyForCandidate({ ...candidate, contentHash: "1".repeat(64) }));
});
