import assert from "node:assert/strict";
import test from "node:test";
import type { QualitativeReportAnalysis } from "../role-fit/model/provider.ts";
import type { JobFitRequirementAssessment } from "./contracts.ts";
import { evaluationKeyForCandidate, guidanceFromAnalysis, prepareCanonicalJobFit, roleDraftFromNormalizedCandidate } from "./evaluate.ts";

const candidate = {
  sourceDedupeKey: "company-example-product-lead-2026-08-19",
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
  assert.equal(evaluationKeyForCandidate(candidate), evaluationKeyForCandidate({ ...candidate, contentHash: "1".repeat(64) }));
  assert.notEqual(evaluationKeyForCandidate(candidate), evaluationKeyForCandidate({ ...candidate, cleanedJobContent: `${candidate.cleanedJobContent} Additional verified responsibility.` }));
});

test("CV positioning reuses multiple strengths and gaps from the shared analysis without truncating the result", () => {
  const analysis = {
    fitLevel: "good",
    fitRationale: "The role aligns with documented complex-system product and UX strategy work.",
    evidenceConfidence: "medium",
    evidenceConfidenceRationale: "Several central requirements are supported.",
    skillsCoverageLabel: "Good coverage",
    items: [],
  } satisfies QualitativeReportAnalysis;
  const assessments: JobFitRequirementAssessment[] = [
    { requirement: "Product strategy", source: "requirement", importance: "must-have", matchType: "direct", impact: "strength", evidenceConfidence: "high", rationale: "Lead with the documented product-strategy decisions in complex operational systems.", evidenceSourceIds: ["project-a"] },
    { requirement: "Cross-functional leadership", source: "responsibility", importance: "core", matchType: "semantic", impact: "strength", evidenceConfidence: "high", rationale: "Show the documented bridge between users, product, design, and engineering.", evidenceSourceIds: ["project-b"] },
    { requirement: "Commercial ownership", source: "requirement", importance: "core", matchType: "partial", impact: "gap", evidenceConfidence: "medium", rationale: "Keep commercial ownership framed as adjacent rather than end-to-end revenue accountability.", evidenceSourceIds: ["project-c"] },
    { requirement: "Enterprise sales", source: "requirement", importance: "supporting", matchType: "insufficient-evidence", impact: "gap", evidenceConfidence: "insufficient", rationale: "Enterprise sales ownership is not proven by the approved evidence.", evidenceSourceIds: [] },
  ];

  const guidance = guidanceFromAnalysis(analysis, assessments);
  assert.match(guidance, /product-strategy decisions/);
  assert.match(guidance, /bridge between users/);
  assert.match(guidance, /commercial ownership/);
  assert.match(guidance, /must not claim|Do not claim/i);
  assert.match(guidance, /Enterprise sales ownership/);
  assert.ok(guidance.length > 300);
});

test("insufficient-evidence positioning names what is unproven without inventing a strength", () => {
  const analysis = {
    fitLevel: "insufficient",
    fitRationale: "The available portfolio evidence does not establish the role's central regulated-finance requirements.",
    evidenceConfidence: "insufficient",
    evidenceConfidenceRationale: "No approved evidence supports the central requirement.",
    skillsCoverageLabel: "Insufficient evidence",
    items: [],
  } satisfies QualitativeReportAnalysis;
  const assessments: JobFitRequirementAssessment[] = [
    { requirement: "Regulated finance", source: "requirement", importance: "must-have", matchType: "insufficient-evidence", impact: "gap", evidenceConfidence: "insufficient", rationale: "Regulated-finance ownership is not proven by the approved evidence.", evidenceSourceIds: [] },
  ];

  const guidance = guidanceFromAnalysis(analysis, assessments);
  assert.match(guidance, /Do not position the CV as a proven fit/);
  assert.match(guidance, /Regulated-finance ownership is not proven/);
  assert.doesNotMatch(guidance, /verified experience:/i);
});
