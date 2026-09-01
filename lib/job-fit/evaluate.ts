import { createHash } from "node:crypto";
import { loadApprovedEvidence } from "../role-fit/knowledge/load-approved-evidence.ts";
import { getRoleFitModelProvider } from "../role-fit/model/index.ts";
import type { QualitativeReportAnalysis } from "../role-fit/model/provider.ts";
import { getRoleAnalysisItems, resolveStableFitLevel } from "../role-fit/report/compose-report.ts";
import { createRoleValidationResult } from "../role-fit/server/eligibility.ts";
import { getJobFitModel } from "./model.ts";
import type { CanonicalNormalizedJobCandidate, JobFitEvaluatorResponse, JobFitRequirementAssessment, NormalizedJobCandidate } from "./contracts";

function canonicalCandidate(candidate: NormalizedJobCandidate): CanonicalNormalizedJobCandidate {
  return {
    ...candidate,
    contentHash: createHash("sha256").update(candidate.cleanedJobContent, "utf8").digest("hex"),
  };
}

function roleField(value: string, candidate: CanonicalNormalizedJobCandidate) {
  return {
    originalValue: value,
    sourceRef: {
      sourceId: `normalized-job:${candidate.sourceDedupeKey}`,
      kind: "user-text" as const,
      label: "NormalizedJobCandidate",
      contentHash: candidate.contentHash,
    },
    confidence: "high" as const,
    confirmed: true,
  };
}

export function roleDraftFromNormalizedCandidate(candidate: NormalizedJobCandidate) {
  const canonical = canonicalCandidate(candidate);
  return {
    company: roleField(canonical.company, canonical),
    title: roleField(canonical.role, canonical),
    description: roleField(canonical.cleanedJobContent, canonical),
    responsibilities: canonical.responsibilities.map((value) => roleField(value, canonical)),
    requirements: canonical.requirements.map((value) => roleField(value, canonical)),
    preferredQualifications: canonical.preferredQualifications.map((value) => roleField(value, canonical)),
    ...(canonical.location ? { location: roleField(canonical.location, canonical) } : {}),
    ...(canonical.workModel ? { workModel: roleField(canonical.workModel, canonical) } : {}),
  };
}

export function evaluationKeyForCandidate(candidate: NormalizedJobCandidate) {
  const canonical = canonicalCandidate(candidate);
  return createHash("sha256").update(`${canonical.sourceDedupeKey}\n${canonical.contentHash}`, "utf8").digest("hex");
}

function actionForFit(level: "strong" | "good" | "partial") {
  if (level === "strong") return "APPLY" as const;
  if (level === "good") return "APPLY WITH POSITIONING" as const;
  return "CONSIDER" as const;
}

function labelForFit(level: "strong" | "good" | "partial") {
  return `${level[0].toUpperCase()}${level.slice(1)}` as "Strong" | "Good" | "Partial";
}

function assessmentsFromAnalysis(analysis: QualitativeReportAnalysis, roleItems: ReturnType<typeof getRoleAnalysisItems>): JobFitRequirementAssessment[] {
  return analysis.items.map((item) => {
    const roleItem = roleItems[item.roleItemIndex];
    return {
      requirement: roleItem?.originalText ?? item.displayLabel,
      source: roleItem?.source ?? "requirement",
      importance: item.importance,
      matchType: item.matchType,
      impact: item.impact,
      evidenceConfidence: item.evidenceConfidence,
      rationale: item.shortRationale,
      evidenceSourceIds: item.evidenceSourceIds,
    };
  });
}

function uniqueRationales(items: JobFitRequirementAssessment[], limit: number) {
  return [...new Set(items.map((item) => item.rationale.trim()).filter(Boolean))].slice(0, limit);
}

export function guidanceFromAnalysis(analysis: QualitativeReportAnalysis, assessments: JobFitRequirementAssessment[]) {
  const supportedStrengths = uniqueRationales(
    assessments.filter((item) => item.impact === "strength" && item.evidenceSourceIds.length > 0 && item.matchType !== "insufficient-evidence"),
    3,
  );
  const supportedGaps = uniqueRationales(
    assessments.filter((item) => item.impact === "gap" && item.matchType !== "insufficient-evidence"),
    3,
  );
  const unprovenRequirements = uniqueRationales(
    assessments.filter((item) => item.matchType === "insufficient-evidence" || item.evidenceConfidence === "insufficient"),
    3,
  );

  const sections = [
    analysis.fitRationale.trim(),
    supportedStrengths.length > 0
      ? `Emphasize verified experience: ${supportedStrengths.join(" ")}`
      : "Do not position the CV as a proven fit where the available evidence does not support one.",
    supportedGaps.length > 0
      ? `Address these gaps directly and without overstating experience: ${supportedGaps.join(" ")}`
      : "",
    unprovenRequirements.length > 0
      ? `Do not claim these requirements as proven; add them only if the candidate can supply verified evidence: ${unprovenRequirements.join(" ")}`
      : "",
  ];

  return sections.filter(Boolean).join("\n\n");
}

export function prepareCanonicalJobFit(candidate: NormalizedJobCandidate) {
  const roleDraft = roleDraftFromNormalizedCandidate(candidate);
  const validation = createRoleValidationResult({
    conversationId: `job-fit:${candidate.sourceDedupeKey}`,
    traceId: crypto.randomUUID(),
    roleDraft,
    detectedLanguage: candidate.language,
  });
  if (validation.parseStatus !== "valid-complete") {
    return { ok: false as const, response: { state: "validation-failed" as const, reason: "normalized-candidate-insufficient" } };
  }
  return { ok: true as const, roleDraft: validation.roleDraft, roleItems: getRoleAnalysisItems(validation.roleDraft), validation };
}

export async function evaluateCanonicalJobFit(candidate: NormalizedJobCandidate): Promise<JobFitEvaluatorResponse> {
  const prepared = prepareCanonicalJobFit(candidate);
  if (!prepared.ok) return prepared.response;

  const approvedEvidence = await loadApprovedEvidence(candidate.cleanedJobContent, prepared.roleItems);
  const modelResult = await getRoleFitModelProvider().generateReport({
    roleText: candidate.cleanedJobContent,
    language: candidate.language,
    task: "analysis",
    modelOverride: getJobFitModel(),
    maxOutputTokens: 2_500,
    runtimeState: JSON.stringify({
      validation: prepared.validation,
      roleItems: prepared.roleItems,
      conciseRoleSummary: candidate.conciseRoleSummary,
    }),
    approvedEvidence: approvedEvidence.promptContext,
  });
  if (!modelResult.ok) return { state: "model-unavailable", reason: modelResult.safeMessageKey };

  const assessments = assessmentsFromAnalysis(modelResult.analysis, prepared.roleItems);
  const stableFit = resolveStableFitLevel(modelResult.analysis);
  const strengths = assessments.filter((item) => item.impact === "strength").map((item) => item.rationale).slice(0, 5);
  const gaps = assessments.filter((item) => item.impact === "gap").map((item) => item.rationale).slice(0, 5);
  if (stableFit === "insufficient") {
    return {
      state: "insufficient-evidence",
      reason: "insufficient-evidence",
      fitLabel: "Insufficient Evidence",
      recommendedAction: null,
      cvPositioningGuidance: guidanceFromAnalysis(modelResult.analysis, assessments),
      rationale: modelResult.analysis.fitRationale,
      evidenceConfidence: { level: modelResult.analysis.evidenceConfidence, rationale: modelResult.analysis.evidenceConfidenceRationale },
      requirementAssessments: assessments,
      strengths,
      gaps,
    };
  }
  if (stableFit === "out-of-scope") {
    return { state: "rejected", reason: "out-of-scope", rationale: modelResult.analysis.fitRationale, requirementAssessments: assessments };
  }
  return {
    state: "ready",
    fitLabel: labelForFit(stableFit),
    recommendedAction: actionForFit(stableFit),
    cvPositioningGuidance: guidanceFromAnalysis(modelResult.analysis, assessments),
    rationale: modelResult.analysis.fitRationale,
    evidenceConfidence: { level: modelResult.analysis.evidenceConfidence, rationale: modelResult.analysis.evidenceConfidenceRationale },
    requirementAssessments: assessments,
    strengths,
    gaps,
  };
}
