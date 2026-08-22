import { reportUIPayloadSchema, type ReportUIPayload, type RoleValidationResult } from "../contracts/index.ts";
import { resolveApprovedEvidenceDestination } from "../knowledge/evidence-destinations.ts";
import type { ApprovedEvidenceBundle } from "../knowledge/load-approved-evidence.ts";
import type { QualitativeReportAnalysis } from "../model/provider.ts";
import { createReportId } from "../identifiers.ts";

type RoleDraft = RoleValidationResult["roleDraft"];
type AnalysisItem = QualitativeReportAnalysis["items"][number];
type ReportItem = ReportUIPayload["requirementMapping"]["items"][number];

export type RoleAnalysisItem = {
  originalText: string;
  source: "requirement" | "responsibility";
};

export function getRoleAnalysisItems(roleDraft: RoleDraft): RoleAnalysisItem[] {
  const seen = new Set<string>();
  const items: RoleAnalysisItem[] = [];

  for (const [source, fields] of [
    ["requirement", roleDraft.requirements],
    ["responsibility", roleDraft.responsibilities],
  ] as const) {
    for (const field of fields) {
      const originalText = field.originalValue.trim();
      const key = originalText.toLowerCase();
      if (!originalText || seen.has(key)) continue;
      seen.add(key);
      items.push({ originalText, source });
    }
  }

  return items;
}

type CompositionResult =
  | { ok: true; report: ReportUIPayload }
  | { ok: false; diagnostic: string };

const fitPresentation = {
  strong: { value: 82, illustrationKey: "fit-strong", colorToken: "fit.strong", label: "Strong fit" },
  good: { value: 68, illustrationKey: "fit-good", colorToken: "fit.good", label: "Good fit" },
  partial: { value: 45, illustrationKey: "fit-partial", colorToken: "fit.partial", label: "Partial fit" },
} as const;

const positiveMatchTypes = new Set<AnalysisItem["matchType"]>(["direct", "semantic", "transferable"]);
const gapMatchTypes = new Set<AnalysisItem["matchType"]>(["partial", "insufficient-evidence", "real-gap"]);

export function resolveStableFitLevel(analysis: QualitativeReportAnalysis): QualitativeReportAnalysis["fitLevel"] {
  if (analysis.fitLevel === "out-of-scope") return "out-of-scope";

  const supportedStrengths = analysis.items.filter((item) =>
    positiveMatchTypes.has(item.matchType) && item.impact === "strength" && item.evidenceSourceIds.length > 0,
  );
  const limitations = analysis.items.filter((item) => gapMatchTypes.has(item.matchType));
  const evidencedLimitation = limitations.some((item) =>
    item.matchType === "real-gap" || (item.matchType === "partial" && item.evidenceSourceIds.length > 0),
  );
  if (evidencedLimitation) return "partial";
  if (supportedStrengths.length === 0) return "insufficient";
  if (limitations.length > 0) return "partial";

  const centralItems = analysis.items.filter((item) => item.importance !== "supporting");
  const hasStrongCentralCoverage = centralItems.length > 0 && centralItems.every((item) =>
    (item.matchType === "direct" || item.matchType === "semantic")
    && item.impact === "strength"
    && (item.evidenceConfidence === "high" || item.evidenceConfidence === "medium")
    && item.evidenceSourceIds.length > 0,
  );

  return analysis.evidenceConfidence === "high" && hasStrongCentralCoverage ? "strong" : "good";
}

function splitSentences(value: string): string[] {
  return value.replace(/\s+/g, " ").trim().match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((item) => item.trim()).filter(Boolean) ?? [];
}

function conciseSentences(value: string, maxSentences: number, maxChars: number) {
  const sentences = splitSentences(value).slice(0, maxSentences);
  const text = (sentences.length ? sentences.join(" ") : value.replace(/\s+/g, " ").trim()).slice(0, maxChars).trim();
  return text.replace(/[,:;-]\s*$/, ".");
}

function normalizeItemText(value: string, fallback: string, maxChars: number) {
  const normalized = conciseSentences(value, 1, maxChars);
  return normalized || fallback;
}

function isNearDuplicate(a: string, b: string) {
  const normalize = (value: string) => new Set(value.toLowerCase().match(/[a-z0-9]{4,}|[\u0590-\u05ff]{3,}/g) ?? []);
  const left = normalize(a);
  const right = normalize(b);
  if (left.size === 0 || right.size === 0) return false;
  const overlap = [...left].filter((term) => right.has(term)).length;
  return overlap / Math.min(left.size, right.size) > 0.72;
}

function semanticRationale(item: AnalysisItem, language: "he" | "en" | "mixed") {
  const base = normalizeItemText(item.shortRationale, "", 220);
  if (item.matchType !== "semantic" && item.matchType !== "transferable") return base;

  const labels = language === "he"
    ? ["יכולת משותפת", "הבדל בהקשר", "למה ניתן לגישור", "טרם הוכח"]
    : ["Shared capability", "Context difference", "Why bridgeable", "Not yet proven"];
  const details = [item.sharedCapability, item.contextDifference, item.bridgeability, item.unproven]
    .map((value, index) => `${labels[index]}: ${normalizeItemText(value ?? "", "", 120)}`);

  return conciseSentences([base, ...details].filter(Boolean).join(". "), 5, 620);
}

function semanticDiagnostic(analysis: QualitativeReportAnalysis): string | null {
  const gapEligibleItems = analysis.items.filter((item) => gapMatchTypes.has(item.matchType) && item.impact === "gap");
  const limitationItems = analysis.items.filter((item) => gapMatchTypes.has(item.matchType));

  for (const item of analysis.items) {
    if (positiveMatchTypes.has(item.matchType) && item.impact === "gap") return "semantic:positive-match-marked-gap";
    if (gapMatchTypes.has(item.matchType) && item.impact === "strength") return "semantic:limitation-marked-strength";
    if (
      (item.matchType === "semantic" || item.matchType === "transferable")
      && (!item.sharedCapability || !item.contextDifference || !item.bridgeability || !item.unproven)
    ) {
      return "semantic:incomplete-semantic-rationale";
    }
  }

  if (analysis.fitLevel === "partial" && gapEligibleItems.length === 0) {
    return "semantic:partial-fit-without-gap";
  }

  if (
    (analysis.fitLevel === "strong" || analysis.fitLevel === "good")
    && gapEligibleItems.length === 0
    && limitationItems.length > 0
  ) {
    return "semantic:unrepresented-limitation";
  }

  if (
    (analysis.fitLevel === "strong" || analysis.fitLevel === "good")
    && gapEligibleItems.length === 0
    && (analysis.evidenceConfidence === "low" || analysis.evidenceConfidence === "insufficient")
  ) {
    return "semantic:low-confidence-without-gap";
  }

  const generatedText = [
    analysis.fitRationale,
    analysis.evidenceConfidenceRationale,
    analysis.skillsCoverageLabel,
    ...analysis.items.flatMap((item) => [item.displayLabel, item.shortRationale]),
  ].join(" ");
  if (/\b(hire|do not hire|don't hire|hiring recommendation|chance of (?:being hired|success))\b|להעסיק|לא להעסיק|המלצת גיוס|סיכויי קבלה/i.test(generatedText)) {
    return "semantic:hiring-recommendation";
  }
  if (/\b(?:fit|compatibility|match)\s+(?:score|percentage)\b|\b(?:score|fit)\s*(?:of|:)\s*\d|\d+\s*%\s*(?:fit|match)/i.test(generatedText)) {
    return "semantic:numeric-fit-score";
  }

  return null;
}

function dedupeReportItems(items: ReportItem[], maxItems: number) {
  const selected: ReportItem[] = [];
  for (const item of items) {
    const label = item.normalizedConcept ?? item.displayLabel ?? item.originalText;
    if (selected.some((candidate) => isNearDuplicate(label, candidate.normalizedConcept ?? candidate.displayLabel ?? candidate.originalText))) continue;
    selected.push(item);
    if (selected.length === maxItems) break;
  }
  return selected;
}

function selectDisplayedEvidenceSourceIds(
  sourceIds: string[],
  sourceById: Map<string, ApprovedEvidenceBundle["sources"][number]>,
) {
  const caseStudyIds = sourceIds.filter((sourceId) => sourceById.get(sourceId)?.sourceType === "case-study");
  const cvIds = sourceIds.filter((sourceId) => sourceById.get(sourceId)?.sourceType === "cv");

  if (caseStudyIds.length === 0) return cvIds.slice(0, 1);
  if (caseStudyIds.length === 4 && cvIds.length > 0) return [...caseStudyIds, cvIds[0]];
  return caseStudyIds.slice(0, 5);
}

function caseStudyKey(
  sourceId: string,
  sourceById: Map<string, ApprovedEvidenceBundle["sources"][number]>,
) {
  const source = sourceById.get(sourceId);
  if (source?.sourceType !== "case-study") return null;
  return source.project?.id ?? source.project?.slug ?? source.id;
}

function applyCaseStudyDiversityPreference(
  sourceIds: string[],
  sourceById: Map<string, ApprovedEvidenceBundle["sources"][number]>,
  recentCaseStudyKeys: string[],
) {
  const remaining = [...sourceIds];
  const ordered: string[] = [];

  while (remaining.length > 0) {
    const leadingKey = caseStudyKey(remaining[0]!, sourceById);
    const wouldCreateThirdConsecutiveCaseStudy = Boolean(
      leadingKey
      && recentCaseStudyKeys.length === 2
      && recentCaseStudyKeys[0] === leadingKey
      && recentCaseStudyKeys[1] === leadingKey,
    );
    const alternativeIndex = wouldCreateThirdConsecutiveCaseStudy
      ? remaining.findIndex((sourceId) => {
          const candidateKey = caseStudyKey(sourceId, sourceById);
          return candidateKey !== null && candidateKey !== leadingKey;
        })
      : -1;
    const [sourceId] = remaining.splice(alternativeIndex >= 0 ? alternativeIndex : 0, 1);

    if (!sourceId) continue;
    ordered.push(sourceId);

    const selectedKey = caseStudyKey(sourceId, sourceById);
    if (!selectedKey) {
      recentCaseStudyKeys.length = 0;
      continue;
    }

    recentCaseStudyKeys.push(selectedKey);
    if (recentCaseStudyKeys.length > 2) recentCaseStudyKeys.shift();
  }

  return ordered;
}

export function deriveTopStrengths(items: ReportItem[]) {
  return dedupeReportItems(
    items.filter((item) => positiveMatchTypes.has(item.matchType) && item.impact === "strength" && item.clusterIds.length > 0),
    5,
  );
}

export function deriveKeyGaps(items: ReportItem[]) {
  return dedupeReportItems(
    items.filter((item) => gapMatchTypes.has(item.matchType) && item.impact === "gap"),
    3,
  );
}

export function composeReportUIPayload(input: {
  analysis: QualitativeReportAnalysis;
  roleDraft: RoleDraft;
  evidence: ApprovedEvidenceBundle;
  language: "he" | "en" | "mixed";
  reportId?: string;
}): CompositionResult {
  const roleItems = getRoleAnalysisItems(input.roleDraft);
  const sourceById = new Map(input.evidence.sources.map((source) => [source.id, source]));
  const recentCaseStudyKeys: string[] = [];
  const seenIndexes = new Set<number>();

  if (input.analysis.items.length === 0 || input.analysis.items.length > 5) {
    return { ok: false, diagnostic: "composition:item-count" };
  }

  const semanticIssue = semanticDiagnostic(input.analysis);
  if (semanticIssue) return { ok: false, diagnostic: semanticIssue };
  const analysis = { ...input.analysis, fitLevel: resolveStableFitLevel(input.analysis) };

  const reportItems: ReportItem[] = [];

  for (const [position, analysisItem] of analysis.items.entries()) {
    const roleItem = roleItems[analysisItem.roleItemIndex];
    if (!roleItem || seenIndexes.has(analysisItem.roleItemIndex)) {
      return { ok: false, diagnostic: "composition:invalid-role-item-index" };
    }
    seenIndexes.add(analysisItem.roleItemIndex);

    const approvedEvidenceSourceIds = [...new Set(analysisItem.evidenceSourceIds)];
    if (approvedEvidenceSourceIds.some((sourceId) => !sourceById.has(sourceId))) {
      return { ok: false, diagnostic: "evidence:unapproved-source-id" };
    }

    const requiresEvidence = positiveMatchTypes.has(analysisItem.matchType) || analysisItem.matchType === "partial";
    if (requiresEvidence && approvedEvidenceSourceIds.length === 0) {
      return { ok: false, diagnostic: "evidence:positive-item-without-source" };
    }
    const evidenceSourceIds = applyCaseStudyDiversityPreference(
      selectDisplayedEvidenceSourceIds(approvedEvidenceSourceIds, sourceById),
      sourceById,
      recentCaseStudyKeys,
    );

    const displayLabel = normalizeItemText(analysisItem.displayLabel, roleItem.originalText, 64);
    const rawRationale = semanticRationale(analysisItem, input.language);
    const shortRationale = (analysisItem.matchType !== "semantic" && analysisItem.matchType !== "transferable" && isNearDuplicate(displayLabel, rawRationale))
      ? normalizeItemText(roleItem.originalText, rawRationale, 620)
      : rawRationale;

    reportItems.push({
      itemId: `role-item-${position + 1}`,
      originalText: roleItem.originalText,
      displayLabel,
      normalizedConcept: normalizeItemText(analysisItem.sharedCapability ?? displayLabel, displayLabel, 96),
      source: roleItem.source,
      importance: analysisItem.importance,
      matchType: analysisItem.matchType,
      impact: analysisItem.impact,
      evidenceConfidence: analysisItem.evidenceConfidence,
      shortRationale,
      clusterIds: evidenceSourceIds.map((sourceId) => `evidence-${sourceId}`),
    });
  }

  const referencedSourceIds = [...new Set(reportItems.flatMap((item) =>
    item.clusterIds.map((clusterId) => clusterId.slice("evidence-".length)),
  ))];
  const sourceToClusterId = new Map<string, string>();
  const clustersByDestination = new Map<string, ReportUIPayload["evidencePanel"]["clusters"][number]>();

  for (const sourceId of referencedSourceIds) {
    const source = sourceById.get(sourceId)!;
    const resolved = resolveApprovedEvidenceDestination({
      sourceId,
      projectId: source.project?.id,
      exactAnchorId: source.project?.anchorId,
      sectionAnchorId: source.project?.sectionAnchorId,
    });
    const dedupeKey = resolved.destination.dedupeKey;
    const existing = clustersByDestination.get(dedupeKey);
    const supportedItems = reportItems.filter((item) => item.clusterIds.includes(`evidence-${sourceId}`));

    if (existing) {
      existing.evidenceIds = [...new Set([...existing.evidenceIds, sourceId])];
      existing.supportedItemIds = [...new Set([...existing.supportedItemIds, ...supportedItems.map((item) => item.itemId)])];
      sourceToClusterId.set(sourceId, existing.clusterId);
      continue;
    }

    const clusterId = `evidence-${sourceId}`;
    const summary = source.claim ?? [...new Set(supportedItems.map((item) => item.shortRationale))].slice(0, 2).join(" ");
    clustersByDestination.set(dedupeKey, {
      clusterId,
      title: source.label,
      summary: conciseSentences(summary || `Approved evidence from ${source.label}.`, 2, 220),
      supportedItemIds: supportedItems.map((item) => item.itemId),
      evidenceIds: [sourceId],
      ...("project" in resolved ? { project: { slug: resolved.project.slug, title: resolved.project.title } } : {}),
      destination: resolved.destination,
      reliability: source.evidenceSpecificity ?? "high",
    });
    sourceToClusterId.set(sourceId, clusterId);
  }

  const clusters = [...clustersByDestination.values()];
  for (const reportItem of reportItems) {
    reportItem.clusterIds = [...new Set(reportItem.clusterIds.map((clusterId) => {
      const sourceId = clusterId.slice("evidence-".length);
      return sourceToClusterId.get(sourceId) ?? clusterId;
    }))];
  }

  const strengths = deriveTopStrengths(reportItems);
  const gaps = deriveKeyGaps(reportItems);
  const matchedRequirements = reportItems.filter((item) =>
    positiveMatchTypes.has(item.matchType) && item.clusterIds.length > 0,
  ).length;
  const totalRequirements = reportItems.length;
  const language = input.language === "he" ? "he" : "en";
  const fitLevel = analysis.fitLevel;
  const reportId = input.reportId ?? createReportId();
  const overallFitVisual = fitLevel === "insufficient" || fitLevel === "out-of-scope"
    ? {
        mode: fitLevel,
        label: fitLevel === "insufficient" ? "Insufficient evidence" : "Outside the supported role scope",
        rationale: conciseSentences(analysis.fitRationale, 1, 180),
      }
    : {
        mode: "fit" as const,
        level: fitLevel,
        fitVisualValue: fitPresentation[fitLevel].value,
        illustrationKey: fitPresentation[fitLevel].illustrationKey,
        colorToken: fitPresentation[fitLevel].colorToken,
        label: fitPresentation[fitLevel].label,
        rationale: conciseSentences(analysis.fitRationale, 1, 180),
        ...(analysis.evidenceConfidence === "low" || analysis.evidenceConfidence === "insufficient"
          ? { qualifiers: ["evidence-limited" as const] }
          : {}),
      };

  const parsed = reportUIPayloadSchema.safeParse({
    schemaVersion: "1.0",
    reportId,
    createdAt: new Date().toISOString(),
    language,
    state: "ready",
    roleSnapshot: {
      company: input.roleDraft.company?.originalValue.trim() ?? "",
      title: input.roleDraft.title?.originalValue.trim() ?? "",
      ...(input.roleDraft.seniority?.originalValue ? { seniority: input.roleDraft.seniority.originalValue.trim() } : {}),
      ...(input.roleDraft.yearsOfExperience?.originalValue !== undefined ? { yearsOfExperience: input.roleDraft.yearsOfExperience.originalValue } : {}),
      ...(input.roleDraft.location?.originalValue ? { location: input.roleDraft.location.originalValue.trim() } : {}),
      ...(input.roleDraft.workModel?.originalValue ? { workModel: input.roleDraft.workModel.originalValue.trim() } : {}),
      ...(input.roleDraft.employmentType?.originalValue ? { employmentType: input.roleDraft.employmentType.originalValue.trim() } : {}),
    },
    overallFitVisual,
    evidenceConfidence: {
      level: analysis.evidenceConfidence,
      rationale: conciseSentences(analysis.evidenceConfidenceRationale, 2, 220),
    },
    skillsMatch: {
      items: strengths,
      visualCoverage: { mode: "traceable-count", matchedCount: matchedRequirements, totalCount: totalRequirements },
    },
    requirementMapping: {
      items: reportItems,
      ...(reportItems[0] ? { defaultSelectedItemId: reportItems[0].itemId } : {}),
    },
    evidencePanel: {
      clusters,
      ...(clusters[0] ? { defaultClusterId: clusters[0].clusterId } : {}),
    },
    topStrengths: { items: strengths },
    keyGaps: { items: gaps },
    disclaimer: {
      copyKey: "report.disclaimer.v1",
      text: "This qualitative report is based on the submitted role description and approved portfolio evidence. It is not an ATS decision, does not replace human judgment, and the visual fit indicator is not a literal numeric score.",
    },
    contactCta: {
      variant: fitLevel,
      label: "Contact Shani",
      href: `/contact?source=role-fit-report-cta&report_id=${encodeURIComponent(reportId)}`,
      enabled: true,
    },
  });

  if (!parsed.success) {
    const paths = parsed.error.issues.slice(0, 5).map((issue) => issue.path.join(".") || "root").join(",");
    return { ok: false, diagnostic: `schema:${paths}` };
  }

  return { ok: true, report: parsed.data };
}
