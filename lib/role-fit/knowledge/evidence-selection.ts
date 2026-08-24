import { findRelatedLexiconConceptIds, normalizeLexiconText } from "../lexicon.ts";
import { resolveApprovedEvidenceDestination } from "./evidence-destinations.ts";
import { evidenceRelevance, type ApprovedEvidenceBundle } from "./load-approved-evidence.ts";

const MIN_SUFFICIENT_RELEVANCE_SCORE = 3;
const SIMILAR_RELEVANCE_DELTA = 2;

export type EvidenceSelectionState = {
  projectUsage: Map<string, number>;
  selectedSourceIds: Set<string>;
  selectedEvidenceIdentities: Set<string>;
};

export type EvidenceSelectionResult =
  | { ok: true; sourceIds: string[] }
  | { ok: false; diagnostic: "evidence:no-sufficiently-relevant-canonical-source" };

export type EvidenceSelectionReasoning = {
  matchType?: "direct" | "semantic" | "transferable" | "partial" | "insufficient-evidence" | "real-gap";
  sharedCapability?: string;
  contextDifference?: string;
  bridgeability?: string;
  unproven?: string;
};

export function createEvidenceSelectionState(): EvidenceSelectionState {
  return { projectUsage: new Map(), selectedSourceIds: new Set(), selectedEvidenceIdentities: new Set() };
}

function hasValidDestination(source: ApprovedEvidenceBundle["sources"][number]) {
  if (source.sourceType !== "case-study") return source.sourceType === "cv";
  if (!source.approvedPublicVisibility) return false;
  return resolveApprovedEvidenceDestination({
    sourceId: source.id,
    projectId: source.project?.id,
    exactAnchorId: source.project?.anchorId,
    sectionAnchorId: source.project?.sectionAnchorId,
  }).destination.mode !== "no-link";
}

function normalizeIdentity(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function evidenceIdentity(source: ApprovedEvidenceBundle["sources"][number]) {
  if (source.sourceType !== "case-study") return source.id;
  const destination = resolveApprovedEvidenceDestination({
    sourceId: source.id,
    projectId: source.project?.id,
    exactAnchorId: source.project?.anchorId,
    sectionAnchorId: source.project?.sectionAnchorId,
  }).destination;
  const claimIdentity = normalizeIdentity(source.claim ?? source.content);
  return `${source.project?.id ?? "unknown"}|${claimIdentity}|${destination.dedupeKey}`;
}

function lexicalTerms(value: string) {
  return new Set(normalizeLexiconText(value).split(" ").filter((term) => term.length >= 3));
}

export function semanticConnectionScore(requirementText: string, sharedCapability: string) {
  const requirementConcepts = new Set(findRelatedLexiconConceptIds(requirementText));
  const capabilityConcepts = new Set(findRelatedLexiconConceptIds(sharedCapability));
  const conceptOverlap = [...requirementConcepts].filter((concept) => capabilityConcepts.has(concept)).length;
  const requirementTerms = lexicalTerms(requirementText);
  const capabilityTerms = lexicalTerms(sharedCapability);
  const lexicalOverlap = [...requirementTerms].filter((term) => capabilityTerms.has(term)).length;
  return conceptOverlap * 3 + lexicalOverlap;
}

function hasCompleteSemanticReasoning(reasoning: EvidenceSelectionReasoning) {
  return Boolean(
    (reasoning.matchType === "semantic" || reasoning.matchType === "transferable")
    && reasoning.sharedCapability?.trim()
    && reasoning.contextDifference?.trim()
    && reasoning.bridgeability?.trim()
    && reasoning.unproven?.trim(),
  );
}

function relevanceScore(input: {
  requirementText: string;
  source: ApprovedEvidenceBundle["sources"][number];
  reasoning: EvidenceSelectionReasoning;
}) {
  const directScore = evidenceRelevance(input.requirementText, input.source);
  if (!hasCompleteSemanticReasoning(input.reasoning)) return directScore;

  const sharedCapability = input.reasoning.sharedCapability!;
  const requirementBridgeScore = semanticConnectionScore(input.requirementText, sharedCapability);
  const sourceSupportScore = evidenceRelevance(sharedCapability, input.source);
  if (requirementBridgeScore < MIN_SUFFICIENT_RELEVANCE_SCORE || sourceSupportScore < MIN_SUFFICIENT_RELEVANCE_SCORE) {
    return directScore;
  }
  return Math.max(directScore, Math.min(requirementBridgeScore, sourceSupportScore));
}

type RankedSource = {
  source: ApprovedEvidenceBundle["sources"][number];
  relevanceScore: number;
  identity: string;
};

function rankedSufficientSources(input: {
  requirementText: string;
  evidence: ApprovedEvidenceBundle;
  sourceType: "case-study" | "cv";
  reasoning: EvidenceSelectionReasoning;
}) {
  return input.evidence.sources
    .filter((source) => source.sourceType === input.sourceType)
    .filter((source) => hasValidDestination(source))
    .map((source): RankedSource => ({
      source,
      relevanceScore: relevanceScore({ requirementText: input.requirementText, source, reasoning: input.reasoning }),
      identity: evidenceIdentity(source),
    }))
    .filter((candidate) => candidate.relevanceScore >= MIN_SUFFICIENT_RELEVANCE_SCORE)
    .sort((left, right) => right.relevanceScore - left.relevanceScore || left.source.id.localeCompare(right.source.id));
}

function projectKey(candidate: RankedSource) {
  return candidate.source.project?.id ?? candidate.source.id;
}

function selectStrongestWithDiversityPreference(candidates: RankedSource[], state: EvidenceSelectionState) {
  const bestScore = candidates[0]?.relevanceScore;
  if (bestScore === undefined) return undefined;
  const similarlyRelevant = candidates.filter((candidate) => candidate.relevanceScore >= bestScore - SIMILAR_RELEVANCE_DELTA);
  return similarlyRelevant.sort((left, right) => {
    const leftUsage = state.projectUsage.get(projectKey(left)) ?? 0;
    const rightUsage = state.projectUsage.get(projectKey(right)) ?? 0;
    return leftUsage - rightUsage
      || right.relevanceScore - left.relevanceScore
      || left.source.id.localeCompare(right.source.id);
  })[0];
}

function recordSelection(selected: RankedSource, state: EvidenceSelectionState): EvidenceSelectionResult {
  const key = projectKey(selected);
  state.projectUsage.set(key, (state.projectUsage.get(key) ?? 0) + 1);
  // Audit/presentation state only: reuse is legal and the UI clusters one source across supported items.
  state.selectedSourceIds.add(selected.source.id);
  state.selectedEvidenceIdentities.add(selected.identity);
  return { ok: true, sourceIds: [selected.source.id] };
}

export function selectRequirementEvidence(input: {
  roleItemIndex: number;
  requirementText: string;
  requestedSourceIds: string[];
  evidence: ApprovedEvidenceBundle;
  requiresEvidence: boolean;
  state: EvidenceSelectionState;
  reasoning?: EvidenceSelectionReasoning;
}): EvidenceSelectionResult {
  const reasoning = input.reasoning ?? {};
  const requestedSourceIds = [...new Set(input.requestedSourceIds)];
  if (!input.requiresEvidence && requestedSourceIds.length === 0) return { ok: true, sourceIds: [] };

  const caseStudyUniverse = rankedSufficientSources({
    requirementText: input.requirementText,
    evidence: input.evidence,
    sourceType: "case-study",
    reasoning,
  });
  const caseStudyById = new Map(caseStudyUniverse.map((candidate) => [candidate.source.id, candidate]));
  const requestedCaseStudy = requestedSourceIds.map((sourceId) => caseStudyById.get(sourceId)).find(Boolean);
  if (requestedCaseStudy) return recordSelection(requestedCaseStudy, input.state);

  const selectedCaseStudy = selectStrongestWithDiversityPreference(caseStudyUniverse, input.state);
  if (selectedCaseStudy) return recordSelection(selectedCaseStudy, input.state);

  const cvUniverse = rankedSufficientSources({
    requirementText: input.requirementText,
    evidence: input.evidence,
    sourceType: "cv",
    reasoning,
  });
  const cvById = new Map(cvUniverse.map((candidate) => [candidate.source.id, candidate]));
  const requestedCv = requestedSourceIds.map((sourceId) => cvById.get(sourceId)).find(Boolean);
  const selectedCv = requestedCv ?? cvUniverse[0];
  if (selectedCv) return recordSelection(selectedCv, input.state);

  if (!input.requiresEvidence) return { ok: true, sourceIds: [] };
  return { ok: false, diagnostic: "evidence:no-sufficiently-relevant-canonical-source" };
}
