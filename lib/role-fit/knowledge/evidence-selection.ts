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

export function createEvidenceSelectionState(): EvidenceSelectionState {
  return { projectUsage: new Map(), selectedSourceIds: new Set(), selectedEvidenceIdentities: new Set() };
}

function hasValidDestination(source: ApprovedEvidenceBundle["sources"][number]) {
  if (source.sourceType !== "case-study") return true;
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

type RankedSource = {
  source: ApprovedEvidenceBundle["sources"][number];
  relevanceScore: number;
  identity: string;
};

function rankedSufficientSources(input: {
  requirementText: string;
  evidence: ApprovedEvidenceBundle;
  state: EvidenceSelectionState;
  sourceType: "case-study" | "cv";
}) {
  const ranked = input.evidence.sources
    .filter((source) => source.sourceType === input.sourceType)
    .filter((source) => hasValidDestination(source))
    .map((source): RankedSource => ({
      source,
      relevanceScore: evidenceRelevance(input.requirementText, source),
      identity: evidenceIdentity(source),
    }))
    .filter((candidate) => !input.state.selectedSourceIds.has(candidate.source.id))
    .filter((candidate) => !input.state.selectedEvidenceIdentities.has(candidate.identity))
    .filter((candidate) => candidate.relevanceScore >= MIN_SUFFICIENT_RELEVANCE_SCORE)
    .sort((left, right) => right.relevanceScore - left.relevanceScore || left.source.id.localeCompare(right.source.id));

  const bestScore = ranked[0]?.relevanceScore;
  if (bestScore === undefined) return [];
  return ranked.filter((candidate) => candidate.relevanceScore >= bestScore - SIMILAR_RELEVANCE_DELTA);
}

function projectKey(candidate: RankedSource) {
  return candidate.source.project?.id ?? candidate.source.id;
}

function orderByDiversityPreference(candidates: RankedSource[], state: EvidenceSelectionState) {
  return [...candidates].sort((left, right) => {
    const leftUsage = state.projectUsage.get(projectKey(left)) ?? 0;
    const rightUsage = state.projectUsage.get(projectKey(right)) ?? 0;
    const leftUnused = leftUsage === 0;
    const rightUnused = rightUsage === 0;
    if (leftUnused !== rightUnused) return leftUnused ? -1 : 1;
    return leftUsage - rightUsage
      || right.relevanceScore - left.relevanceScore
      || left.source.id.localeCompare(right.source.id);
  });
}

function recordSelection(selected: RankedSource, state: EvidenceSelectionState): EvidenceSelectionResult {
  const key = projectKey(selected);
  state.projectUsage.set(key, (state.projectUsage.get(key) ?? 0) + 1);
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
}): EvidenceSelectionResult {
  const sourceById = new Map(input.evidence.sources.map((source) => [source.id, source]));
  const requestedSourceIds = [...new Set(input.requestedSourceIds)];
  if (!input.requiresEvidence && requestedSourceIds.length === 0) return { ok: true, sourceIds: [] };

  const caseStudyUniverse = rankedSufficientSources({
    requirementText: input.requirementText,
    evidence: input.evidence,
    state: input.state,
    sourceType: "case-study",
  });
  const caseStudyById = new Map(caseStudyUniverse.map((candidate) => [candidate.source.id, candidate]));
  const requestedCaseStudies = requestedSourceIds.flatMap((sourceId) => {
    const source = sourceById.get(sourceId);
    if (source?.sourceType !== "case-study") return [];
    const candidate = caseStudyById.get(sourceId);
    return candidate ? [candidate] : [];
  });

  if (requestedCaseStudies.length > 0) {
    return recordSelection(orderByDiversityPreference(requestedCaseStudies, input.state)[0]!, input.state);
  }
  if (caseStudyUniverse.length > 0) {
    return recordSelection(orderByDiversityPreference(caseStudyUniverse, input.state)[0]!, input.state);
  }

  const cvUniverse = rankedSufficientSources({
    requirementText: input.requirementText,
    evidence: input.evidence,
    state: input.state,
    sourceType: "cv",
  });
  const cvById = new Map(cvUniverse.map((candidate) => [candidate.source.id, candidate]));
  const requestedCv = requestedSourceIds.flatMap((sourceId) => {
    const candidate = cvById.get(sourceId);
    return candidate ? [candidate] : [];
  });
  const selectedCv = requestedCv[0] ?? cvUniverse[0];
  if (selectedCv) return recordSelection(selectedCv, input.state);

  if (!input.requiresEvidence) return { ok: true, sourceIds: [] };
  return { ok: false, diagnostic: "evidence:no-sufficiently-relevant-canonical-source" };
}
