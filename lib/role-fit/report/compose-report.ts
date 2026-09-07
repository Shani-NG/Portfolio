import { reportUIPayloadSchema, type ReportUIPayload, type RoleValidationResult } from "../contracts/index.ts";
import { resolveApprovedEvidenceDestination } from "../knowledge/evidence-destinations.ts";
import { createEvidenceSelectionState, isNarrowCapabilityFactRequirement, selectRequirementEvidence } from "../knowledge/evidence-selection.ts";
import { evidenceRelevance, type ApprovedEvidenceBundle } from "../knowledge/load-approved-evidence.ts";
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
const limitationMatchTypes = new Set<AnalysisItem["matchType"]>(["partial", "real-gap"]);

function normalizePositiveMatchImpact(item: AnalysisItem): AnalysisItem {
  // `matchType` is the model's semantic classification. A positive classification cannot
  // truthfully be rendered as a gap; preserve all evidence and rationale, and repair only
  // this structurally contradictory presentation field.
  return positiveMatchTypes.has(item.matchType) && item.impact === "gap"
    ? { ...item, impact: "strength" }
    : item;
}

export function resolveStableFitLevel(analysis: QualitativeReportAnalysis): QualitativeReportAnalysis["fitLevel"] {
  if (analysis.fitLevel === "out-of-scope") return "out-of-scope";

  const supportedStrengths = analysis.items.filter((item) =>
    positiveMatchTypes.has(item.matchType) && item.impact === "strength" && item.evidenceSourceIds.length > 0,
  );
  if (supportedStrengths.length === 0) return "insufficient";

  const centralItems = analysis.items.filter((item) => item.importance !== "supporting");
  const centralSupportedStrengths = centralItems.filter((item) =>
    positiveMatchTypes.has(item.matchType) && item.impact === "strength" && item.evidenceSourceIds.length > 0,
  );
  const materialCentralRealGaps = centralItems.filter((item) => item.matchType === "real-gap");
  const centralPartialLimitations = centralItems.filter((item) => item.matchType === "partial" && item.impact === "gap");
  const limitations = analysis.items.filter((item) => limitationMatchTypes.has(item.matchType) && item.impact === "gap");

  if (centralItems.length > 0 && centralSupportedStrengths.length === 0) return "partial";
  if (materialCentralRealGaps.length > 0) return "partial";
  if (centralPartialLimitations.length > 1) return "partial";
  if (
    limitations.length > 0
    && (analysis.evidenceConfidence === "low" || analysis.evidenceConfidence === "insufficient")
  ) return "partial";

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

function semanticDiagnostic(
  analysis: QualitativeReportAnalysis,
  representedLimitationRoleItemIndexes: ReadonlySet<number>,
  nonPunitiveRescueRoleItemIndexes: ReadonlySet<number>,
): string | null {
  const stableFitLevel = resolveStableFitLevel(analysis);
  const gapEligibleItems = analysis.items.filter((item) => limitationMatchTypes.has(item.matchType) && item.impact === "gap");
  const limitationItems = analysis.items.filter((item) =>
    limitationMatchTypes.has(item.matchType) && !nonPunitiveRescueRoleItemIndexes.has(item.roleItemIndex),
  );
  const unrepresentedLimitationItems = limitationItems.filter((item) =>
    item.impact !== "gap" && !representedLimitationRoleItemIndexes.has(item.roleItemIndex),
  );

  for (const item of analysis.items) {
    if (positiveMatchTypes.has(item.matchType) && item.impact === "gap") return "semantic:positive-match-marked-gap";
    if (limitationMatchTypes.has(item.matchType) && item.impact === "strength") return "semantic:limitation-marked-strength";
    if (
      (item.matchType === "semantic" || item.matchType === "transferable")
      && (!item.sharedCapability || !item.contextDifference || !item.bridgeability || !item.unproven)
    ) {
      return "semantic:incomplete-semantic-rationale";
    }
  }

  if (stableFitLevel === "partial" && gapEligibleItems.length === 0 && limitationItems.length > 0) {
    return "semantic:partial-fit-without-gap";
  }

  if (
    (stableFitLevel === "strong" || stableFitLevel === "good")
    && gapEligibleItems.length === 0
    && unrepresentedLimitationItems.length > 0
  ) {
    return "semantic:unrepresented-limitation";
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
  const selectedSourceIds = new Set(sourceIds);
  const orderedSourceIds = [...sourceById.keys()].filter((sourceId) => selectedSourceIds.has(sourceId));
  const caseStudyIds = orderedSourceIds.filter((sourceId) => sourceById.get(sourceId)?.sourceType === "case-study");
  const cvIds = orderedSourceIds.filter((sourceId) => sourceById.get(sourceId)?.sourceType === "cv");

  // CV knowledge is a fallback only: public case-study evidence remains authoritative whenever it exists.
  if (caseStudyIds.length === 0) return cvIds.slice(0, 1);
  return caseStudyIds.slice(0, 5);
}

export function deriveCoreMatchingSkills(items: ReportItem[]) {
  return dedupeReportItems(
    items.filter((item) => positiveMatchTypes.has(item.matchType) && item.impact === "strength" && item.clusterIds.length > 0),
    5,
  );
}

export function deriveTopStrengths(items: ReportItem[]) {
  return dedupeReportItems(
    items.filter((item) => positiveMatchTypes.has(item.matchType) && item.impact === "strength" && item.clusterIds.length > 0),
    3,
  );
}

export function deriveKeyGaps(items: ReportItem[], representedLimitationItemIds: ReadonlySet<string> = new Set()) {
  return dedupeReportItems(
    items.filter((item) =>
      item.matchType !== "insufficient-evidence"
      && limitationMatchTypes.has(item.matchType)
      && (item.impact === "gap" || representedLimitationItemIds.has(item.itemId)),
    ),
    3,
  );
}

const topStrengthGenericTerms = new Set([
  "strong", "strength", "strengths", "capability", "capabilities", "experience", "experienced", "skill", "skills",
  "relevant", "supported", "evidence", "proven", "ability",
]);

function topStrengthTerms(value: string) {
  return new Set((value.toLowerCase().match(/[a-z0-9]{3,}|[\u0590-\u05ff]{3,}/g) ?? [])
    .filter((term) => !topStrengthGenericTerms.has(term)));
}

function isObviousTopStrengthDuplicate(value: string, existing: string) {
  const left = topStrengthTerms(value);
  const right = topStrengthTerms(existing);
  if (left.size === 0 || right.size === 0) return false;
  const overlap = [...left].filter((term) => right.has(term)).length;
  return overlap / Math.min(left.size, right.size) > 0.72;
}

function hasForbiddenTopStrengthClaim(value: string) {
  return /\b(hire|do not hire|don't hire|hiring recommendation|chance of (?:being hired|success))\b|להעסיק|לא להעסיק|המלצת גיוס|סיכויי קבלה|\b(?:fit|compatibility|match)\s+(?:score|percentage)\b|\d+\s*%\s*(?:fit|match)/i.test(value);
}

function createTopStrengthItems(input: {
  candidates: QualitativeReportAnalysis["topStrengths"];
  coreSkills: ReportItem[];
  sourceById: Map<string, ApprovedEvidenceBundle["sources"][number]>;
}) {
  const strengths: ReportItem[] = [];
  for (const candidate of input.candidates ?? []) {
    const sourceIds = [...new Set(candidate.evidenceSourceIds)];
    const sources = sourceIds.map((sourceId) => input.sourceById.get(sourceId));
    if (sourceIds.length === 0 || sources.some((source) => !source || (source.sourceType !== "case-study" && source.sourceType !== "cv"))) continue;
    const approvedSources = sources.filter((source): source is NonNullable<typeof source> => Boolean(source));
    if (approvedSources.every((source) => source.cvEvidenceLevel === "capability-fact") && approvedSources.length < 2) continue;

    const displayLabel = normalizeItemText(candidate.displayLabel, "", 64);
    const shortRationale = normalizeItemText(candidate.shortRationale, "", 320);
    const generatedText = `${displayLabel} ${shortRationale}`;
    if (!displayLabel || !shortRationale || hasForbiddenTopStrengthClaim(generatedText)) continue;
    if (!approvedSources.some((source) => evidenceRelevance(generatedText, source) >= 3)) continue;
    if (input.coreSkills.some((item) =>
      isObviousTopStrengthDuplicate(displayLabel, item.displayLabel ?? item.originalText)
      || isNearDuplicate(shortRationale, item.shortRationale)
    )) continue;
    if (strengths.some((item) =>
      isObviousTopStrengthDuplicate(displayLabel, item.displayLabel ?? item.originalText)
      || isNearDuplicate(shortRationale, item.shortRationale)
    )) continue;

    strengths.push({
      itemId: `top-strength-${strengths.length + 1}`,
      originalText: displayLabel,
      displayLabel,
      normalizedConcept: displayLabel,
      source: "professional-context",
      importance: "supporting",
      matchType: "semantic",
      impact: "strength",
      evidenceConfidence: "medium",
      shortRationale,
      clusterIds: sourceIds.map((sourceId) => `evidence-${sourceId}`),
    });
    if (strengths.length === 3) break;
  }
  return strengths;
}

function rescueInsufficientEvidence(input: {
  item: AnalysisItem;
  requirementText: string;
  source: ApprovedEvidenceBundle["sources"][number];
  sourceIds: string[];
  language: "he" | "en" | "mixed";
}) {
  const isNarrowFact = isNarrowCapabilityFactRequirement(input.requirementText, input.source);
  const isDirectlySupported = isNarrowFact;
  const capability = input.source.capabilities?.[0] ?? input.source.claim ?? input.source.label;
  const shortRationale = input.language === "he"
    ? isDirectlySupported
      ? `הראיות המאושרות מתעדות במפורש את היכולת: ${capability}.`
      : `הראיות המאושרות תומכות בחלק מהדרישה, אך אינן מוכיחות את מלוא העומק או ההיקף שלה.`
    : isDirectlySupported
      ? `The approved evidence explicitly documents ${capability}.`
      : "Approved evidence supports part of this requirement, but does not establish its full depth or scope.";
  return {
    ...input.item,
    matchType: isDirectlySupported ? "direct" as const : "partial" as const,
    impact: isDirectlySupported ? "strength" as const : "neutral" as const,
    evidenceConfidence: isDirectlySupported && input.source.evidenceSpecificity === "high" ? "high" as const : "medium" as const,
    shortRationale,
    evidenceSourceIds: input.sourceIds,
  };
}

export function composeReportUIPayload(input: {
  analysis: QualitativeReportAnalysis;
  roleDraft: RoleDraft;
  evidence: ApprovedEvidenceBundle;
  language: "he" | "en" | "mixed";
  reportId?: string;
  reportDisplayTitle?: string;
  representedLimitationRoleItemIndexes?: readonly number[];
}): CompositionResult {
  const roleItems = getRoleAnalysisItems(input.roleDraft);
  const sourceById = new Map(input.evidence.sources.map((source) => [source.id, source]));
  const seenIndexes = new Set<number>();
  const evidenceSelectionState = createEvidenceSelectionState();

  if (input.analysis.items.length === 0 || input.analysis.items.length > 5) {
    return { ok: false, diagnostic: "composition:item-count" };
  }

  const recoverableLimitationRoleItemIndexes = new Set(input.analysis.items
    .filter((item) => limitationMatchTypes.has(item.matchType) && item.impact === "neutral")
    .map((item) => item.roleItemIndex));
  const representedLimitationRoleItemIndexes = new Set(
    (input.representedLimitationRoleItemIndexes ?? [])
      .filter((roleItemIndex) => recoverableLimitationRoleItemIndexes.has(roleItemIndex)),
  );
  const reportItems: ReportItem[] = [];
  const resolvedAnalysisItems: AnalysisItem[] = [];
  const representedLimitationItemIds = new Set<string>();
  const nonPunitiveRescueRoleItemIndexes = new Set<number>();

  for (const [position, analysisItem] of input.analysis.items.entries()) {
    const roleItem = roleItems[analysisItem.roleItemIndex];
    if (!roleItem || seenIndexes.has(analysisItem.roleItemIndex)) {
      return { ok: false, diagnostic: "composition:invalid-role-item-index" };
    }
    seenIndexes.add(analysisItem.roleItemIndex);

    const requiresEvidence = positiveMatchTypes.has(analysisItem.matchType)
      || analysisItem.matchType === "partial"
      || analysisItem.matchType === "insufficient-evidence";
    const selection = selectRequirementEvidence({
      roleItemIndex: analysisItem.roleItemIndex,
      requirementText: roleItem.originalText,
      requestedSourceIds: analysisItem.evidenceSourceIds,
      evidence: input.evidence,
      requiresEvidence,
      state: evidenceSelectionState,
      reasoning: {
        matchType: analysisItem.matchType,
        sharedCapability: analysisItem.sharedCapability,
        contextDifference: analysisItem.contextDifference,
        bridgeability: analysisItem.bridgeability,
        unproven: analysisItem.unproven,
      },
    });
    const selectedSource = selection.ok ? sourceById.get(selection.sourceIds[0] ?? "") : undefined;
    const selectedAnalysisItem: AnalysisItem = selection.ok
      ? analysisItem.matchType === "insufficient-evidence" && selectedSource
        ? rescueInsufficientEvidence({
            item: analysisItem,
            requirementText: roleItem.originalText,
            source: selectedSource,
            sourceIds: selection.sourceIds,
            language: input.language,
          })
        : { ...analysisItem, evidenceSourceIds: selection.sourceIds }
      : {
          ...analysisItem,
          matchType: "insufficient-evidence",
          impact: "neutral",
          evidenceConfidence: "insufficient",
          shortRationale: input.language === "he"
            ? "לא הצלחתי לאמת מספיק ראיות מהפורטפוליו לדרישה הספציפית הזו."
            : "I couldn't verify enough portfolio evidence for this specific requirement.",
          evidenceSourceIds: [],
        };
    if (analysisItem.matchType === "insufficient-evidence" && selection.ok && selectedAnalysisItem.matchType === "partial") {
      nonPunitiveRescueRoleItemIndexes.add(analysisItem.roleItemIndex);
    }
    const resolvedAnalysisItem = normalizePositiveMatchImpact(
      selectedAnalysisItem.matchType === "insufficient-evidence"
        ? { ...selectedAnalysisItem, evidenceSourceIds: [] }
        : selectedAnalysisItem,
    );
    resolvedAnalysisItems.push(resolvedAnalysisItem);
    const evidenceSourceIds = selectDisplayedEvidenceSourceIds(resolvedAnalysisItem.evidenceSourceIds, sourceById);

    const displayLabel = normalizeItemText(resolvedAnalysisItem.displayLabel, roleItem.originalText, 64);
    const rawRationale = semanticRationale(resolvedAnalysisItem, input.language);
    const shortRationale = (resolvedAnalysisItem.matchType !== "semantic" && resolvedAnalysisItem.matchType !== "transferable" && isNearDuplicate(displayLabel, rawRationale))
      ? normalizeItemText(
          input.language !== "he" && /[\u0590-\u05ff]/.test(roleItem.originalText) ? rawRationale : roleItem.originalText,
          rawRationale,
          620,
        )
      : rawRationale;

    const reportItem: ReportItem = {
      itemId: `role-item-${position + 1}`,
      originalText: input.language !== "he" && /[\u0590-\u05ff]/.test(roleItem.originalText)
        ? displayLabel
        : roleItem.originalText,
      displayLabel,
      normalizedConcept: normalizeItemText(resolvedAnalysisItem.sharedCapability ?? displayLabel, displayLabel, 96),
      source: roleItem.source,
      importance: resolvedAnalysisItem.importance,
      matchType: resolvedAnalysisItem.matchType,
      impact: resolvedAnalysisItem.impact,
      evidenceConfidence: resolvedAnalysisItem.evidenceConfidence,
      shortRationale,
      clusterIds: evidenceSourceIds.map((sourceId) => `evidence-${sourceId}`),
    };
    reportItems.push(reportItem);
    if (representedLimitationRoleItemIndexes.has(analysisItem.roleItemIndex)) {
      representedLimitationItemIds.add(reportItem.itemId);
    }
  }

  const resolvedAnalysis = { ...input.analysis, items: resolvedAnalysisItems };
  const semanticIssue = semanticDiagnostic(
    resolvedAnalysis,
    representedLimitationRoleItemIndexes,
    nonPunitiveRescueRoleItemIndexes,
  );
  if (semanticIssue) return { ok: false, diagnostic: semanticIssue };

  const coreSkills = deriveCoreMatchingSkills(reportItems);
  const topStrengths = createTopStrengthItems({
    candidates: input.analysis.topStrengths,
    coreSkills,
    sourceById,
  });
  const evidenceBackedItems = [...reportItems, ...topStrengths];

  const referencedSourceIds = [...new Set(evidenceBackedItems.flatMap((item) =>
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
    const supportedItems = evidenceBackedItems.filter((item) => item.clusterIds.includes(`evidence-${sourceId}`));

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
  for (const reportItem of evidenceBackedItems) {
    reportItem.clusterIds = [...new Set(reportItem.clusterIds.map((clusterId) => {
      const sourceId = clusterId.slice("evidence-".length);
      return sourceToClusterId.get(sourceId) ?? clusterId;
    }))];
  }

  const gaps = deriveKeyGaps(reportItems, representedLimitationItemIds);
  const matchedRequirements = reportItems.filter((item) =>
    positiveMatchTypes.has(item.matchType) && item.clusterIds.length > 0,
  ).length;
  const totalRequirements = reportItems.length;
  const language = input.language === "he" ? "he" : "en";
  const fitLevel = resolveStableFitLevel(resolvedAnalysis);
  const reportId = input.reportId ?? createReportId();
  const overallFitVisual = fitLevel === "insufficient" || fitLevel === "out-of-scope"
    ? {
        mode: fitLevel,
        label: fitLevel === "insufficient" ? "Insufficient evidence" : "Outside the supported role scope",
        rationale: conciseSentences(resolvedAnalysis.fitRationale, 1, 180),
      }
    : {
        mode: "fit" as const,
        level: fitLevel,
        fitVisualValue: fitPresentation[fitLevel].value,
        illustrationKey: fitPresentation[fitLevel].illustrationKey,
        colorToken: fitPresentation[fitLevel].colorToken,
        label: fitPresentation[fitLevel].label,
        rationale: conciseSentences(resolvedAnalysis.fitRationale, 1, 180),
        ...(resolvedAnalysis.evidenceConfidence === "low" || resolvedAnalysis.evidenceConfidence === "insufficient"
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
      title: input.reportDisplayTitle?.trim() || input.roleDraft.title?.originalValue.trim() || "",
      ...(input.roleDraft.seniority?.originalValue ? { seniority: input.roleDraft.seniority.originalValue.trim() } : {}),
      ...(input.roleDraft.yearsOfExperience?.originalValue !== undefined ? { yearsOfExperience: input.roleDraft.yearsOfExperience.originalValue } : {}),
      ...(input.roleDraft.location?.originalValue ? { location: input.roleDraft.location.originalValue.trim() } : {}),
      ...(input.roleDraft.workModel?.originalValue ? { workModel: input.roleDraft.workModel.originalValue.trim() } : {}),
      ...(input.roleDraft.employmentType?.originalValue ? { employmentType: input.roleDraft.employmentType.originalValue.trim() } : {}),
    },
    overallFitVisual,
    evidenceConfidence: {
      level: resolvedAnalysis.evidenceConfidence,
      rationale: conciseSentences(resolvedAnalysis.evidenceConfidenceRationale, 2, 220),
    },
    skillsMatch: {
      items: coreSkills,
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
    topStrengths: { items: deriveTopStrengths(topStrengths) },
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
