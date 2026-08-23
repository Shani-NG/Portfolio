import { resolveApprovedEvidenceDestination } from "./evidence-destinations.ts";
import type { ApprovedEvidenceBundle } from "./load-approved-evidence.ts";

export type EvidenceSelectionState = {
  projectUsage: Map<string, number>;
  selectedSourceIds: Set<string>;
};

export type EvidenceSelectionResult =
  | { ok: true; sourceIds: string[] }
  | { ok: false; diagnostic: "evidence:unapproved-source-id" | "evidence:source-not-in-requirement-candidates" | "evidence:invalid-destination" | "evidence:positive-item-without-source" };

export function createEvidenceSelectionState(): EvidenceSelectionState {
  return { projectUsage: new Map(), selectedSourceIds: new Set() };
}

function hasValidDestination(source: ApprovedEvidenceBundle["sources"][number]) {
  if (source.sourceType !== "case-study") return true;
  return resolveApprovedEvidenceDestination({
    sourceId: source.id,
    projectId: source.project?.id,
    exactAnchorId: source.project?.anchorId,
    sectionAnchorId: source.project?.sectionAnchorId,
  }).destination.mode !== "no-link";
}

export function selectRequirementEvidence(input: {
  roleItemIndex: number;
  requestedSourceIds: string[];
  evidence: ApprovedEvidenceBundle;
  requiresEvidence: boolean;
  state: EvidenceSelectionState;
}): EvidenceSelectionResult {
  const sourceById = new Map(input.evidence.sources.map((source) => [source.id, source]));
  const requestedSourceIds = [...new Set(input.requestedSourceIds)];

  if (requestedSourceIds.some((sourceId) => !sourceById.has(sourceId))) {
    return { ok: false, diagnostic: "evidence:unapproved-source-id" };
  }

  const candidateSet = input.evidence.candidatesByRoleItem?.find((candidate) => candidate.roleItemIndex === input.roleItemIndex);
  if (!candidateSet) {
    if (input.requiresEvidence && requestedSourceIds.length === 0) {
      return { ok: false, diagnostic: "evidence:positive-item-without-source" };
    }
    return { ok: true, sourceIds: requestedSourceIds };
  }

  const candidateById = new Map(candidateSet.candidates.map((candidate) => [candidate.sourceId, candidate]));
  if (requestedSourceIds.some((sourceId) => !candidateById.has(sourceId))) {
    return { ok: false, diagnostic: "evidence:source-not-in-requirement-candidates" };
  }
  if (input.requiresEvidence && requestedSourceIds.length === 0) {
    return { ok: false, diagnostic: "evidence:positive-item-without-source" };
  }
  if (requestedSourceIds.length === 0) return { ok: true, sourceIds: [] };

  const requestedCandidates = requestedSourceIds
    .map((sourceId) => candidateById.get(sourceId)!)
    .sort((left, right) => right.relevanceScore - left.relevanceScore || left.sourceId.localeCompare(right.sourceId));
  const requestedTypes = new Set(requestedCandidates.map((candidate) => sourceById.get(candidate.sourceId)?.sourceType));
  const preferredType = requestedTypes.has("case-study") ? "case-study" : "cv";
  const bestRequestedScore = requestedCandidates
    .filter((candidate) => sourceById.get(candidate.sourceId)?.sourceType === preferredType)
    .at(0)?.relevanceScore ?? 0;

  const eligible = requestedCandidates
    .filter((candidate) => sourceById.get(candidate.sourceId)?.sourceType === preferredType)
    .filter((candidate) => candidate.relevanceScore >= bestRequestedScore - 2)
    .filter((candidate) => hasValidDestination(sourceById.get(candidate.sourceId)!))
    .sort((left, right) => {
      const leftProject = sourceById.get(left.sourceId)?.project?.id ?? left.sourceId;
      const rightProject = sourceById.get(right.sourceId)?.project?.id ?? right.sourceId;
      const leftUsage = input.state.projectUsage.get(leftProject) ?? 0;
      const rightUsage = input.state.projectUsage.get(rightProject) ?? 0;
      const leftWithinSoftCap = leftUsage < 2;
      const rightWithinSoftCap = rightUsage < 2;
      if (leftWithinSoftCap !== rightWithinSoftCap) return leftWithinSoftCap ? -1 : 1;
      return leftUsage - rightUsage || right.relevanceScore - left.relevanceScore || left.sourceId.localeCompare(right.sourceId);
    });

  const selected = eligible[0];
  if (!selected) return { ok: false, diagnostic: "evidence:invalid-destination" };
  const selectedSource = sourceById.get(selected.sourceId)!;
  const projectKey = selectedSource.project?.id ?? selectedSource.id;
  input.state.projectUsage.set(projectKey, (input.state.projectUsage.get(projectKey) ?? 0) + 1);
  input.state.selectedSourceIds.add(selected.sourceId);
  return { ok: true, sourceIds: [selected.sourceId] };
}
