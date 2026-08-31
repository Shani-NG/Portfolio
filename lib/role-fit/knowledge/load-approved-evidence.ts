import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { findLexiconMatches, findRelatedLexiconConceptIds } from "../lexicon.ts";
import {
  approvedProjectDestinations,
  resolveApprovedEvidenceDestination,
  type ApprovedProjectId,
} from "./evidence-destinations.ts";

const canonicalRoot = join(process.cwd(), "PORTFOLIO_IMPLEMENTATION", "role-fit-agent", "docs", "canonical");

export type ApprovedEvidenceSource = {
  id: string;
  label: string;
  content: string;
  sourceType: "case-study" | "cv" | "profile";
  approvedPublicVisibility: boolean;
  claim?: string;
  capabilities?: string[];
  limitations?: string[];
  evidenceSpecificity?: "high" | "medium" | "low";
  ownershipLevel?: string;
  project?: {
    id: ApprovedProjectId;
    slug: string;
    title: string;
    anchorId?: string;
    sectionAnchorId?: string;
  };
};

export type EvidenceCatalogIssueCode =
  | "source-read-failed"
  | "evidence-missing-claim"
  | "duplicate-evidence-id"
  | "invalid-public-destination";

export type EvidenceCatalogIssue = {
  code: EvidenceCatalogIssueCode;
  projectId?: ApprovedProjectId;
  evidenceId?: string;
  sourceFile: string;
};

export type EvidenceCatalogProjectAudit = {
  projectId: ApprovedProjectId;
  sourceFile: string;
  discoveredCount: number;
  acceptedCount: number;
  excludedCount: number;
};

export type RequirementEvidenceCandidates = {
  roleItemIndex: number;
  roleItemText: string;
  candidates: Array<{ sourceId: string; relevanceScore: number }>;
};

export type ApprovedEvidenceBundle = {
  promptContext: string;
  sources: ApprovedEvidenceSource[];
  candidatesByRoleItem?: RequirementEvidenceCandidates[];
  catalogAudit?: {
    projects: EvidenceCatalogProjectAudit[];
    issues: EvidenceCatalogIssue[];
  };
};

export type EvidenceRoleItem = {
  originalText: string;
  source: "requirement" | "responsibility";
};

export type CanonicalEvidenceSourceDefinition = {
  id: string;
  label: string;
  file: string;
  sourceType: "case-study" | "cv" | "profile";
  project?: { id: ApprovedProjectId; slug: string; title: string };
};

type ScoredEvidenceSource = ApprovedEvidenceSource & { score: number };

// Keep the complete compact index available to the model, but bound the prose-rich
// context sent on every report request. This reduces latency without changing the
// canonical evidence universe or application-owned evidence authorization.
const maxRichContextSources = 13;

const sourceDefinitions: readonly CanonicalEvidenceSourceDefinition[] = [
  { id: "cv", label: "CV knowledge", file: "CV_Knowledge.md", sourceType: "cv" },
  { id: "profile", label: "General profile knowledge", file: "General_Profile_Knowledge.md", sourceType: "profile" },
  { id: "big-red-button", label: "The Big Red Button case study", file: "Case_Study_Knowledge_The_Big_Red_Button.md", sourceType: "case-study", project: { id: "big-red-button", slug: "the-big-red-button", title: "The Big RED BUTTON" } },
  { id: "c4i", label: "C4I case study", file: "Case_Study_Knowledge_C4I.md", sourceType: "case-study", project: { id: "c4i", slug: "c4i-beyond-clarity", title: "C4I - Beyond Clarity" } },
  { id: "epd", label: "EPD case study", file: "Case_Study_Knowledge_EPD.md", sourceType: "case-study", project: { id: "epd", slug: "ux-from-the-heart", title: "UX from the Heart" } },
  { id: "howtool", label: "HOWTOOL case study", file: "Case_Study_Knowledge_HOWTOOL.md", sourceType: "case-study", project: { id: "howtool", slug: "nobody-reads-the-manual", title: "Nobody Reads the Manual" } },
  { id: "monitoring", label: "Monitoring and Product Intelligence case study", file: "Case_Study_Knowledge_Monitoring_and_Product_Intelligence.md", sourceType: "case-study", project: { id: "monitoring", slug: "monitoring-product-intelligence", title: "Monitoring and Product Intelligence" } },
  { id: "role-fit-agent", label: "Role Fit Agent case study", file: "Case_Study_Knowledge_Role_Fit_Agent.md", sourceType: "case-study", project: { id: "role-fit-agent", slug: "role-fit-agent", title: "Role Fit Agent" } },
];

const genericTerms = new Set([
  "and", "the", "for", "with", "from", "that", "this", "into", "role", "work", "user", "users",
  "product", "products", "design", "system", "systems", "experience", "project", "projects", "management",
  "של", "עם", "את", "על", "או", "גם", "מערכת", "מערכות", "מוצר", "מוצרים", "עיצוב", "תפקיד", "משתמשים",
]);

function terms(value: string) {
  return new Set(
    (value.toLowerCase().match(/[a-z0-9]{3,}|[\u0590-\u05ff]{2,}/g) ?? [])
      .filter((term) => !genericTerms.has(term)),
  );
}

function lexicalRelevance(query: string, content: string) {
  const queryTerms = terms(query);
  const contentTerms = terms(content);
  let score = 0;
  for (const term of queryTerms) if (contentTerms.has(term)) score += 1;
  return score;
}

function conceptIds(value: string) {
  return new Set([
    ...findLexiconMatches({ text: value, language: "mixed" }).map((match) => match.entry.concept_id),
    ...findRelatedLexiconConceptIds(value),
  ]);
}

export function evidenceRelevance(requirementText: string, source: ApprovedEvidenceSource) {
  const evidenceText = [source.capabilities?.join(" "), source.claim].filter(Boolean).join(" ") || source.content;
  const requirementConcepts = conceptIds(requirementText);
  const evidenceConcepts = conceptIds(evidenceText);
  const conceptOverlap = [...requirementConcepts].filter((conceptId) => evidenceConcepts.has(conceptId)).length;

  return (
    conceptOverlap * 3
    + lexicalRelevance(requirementText, source.capabilities?.join(" ") ?? "") * 4
    + lexicalRelevance(requirementText, source.claim ?? "") * 4
    + (source.sourceType === "case-study" ? 0 : lexicalRelevance(requirementText, source.content))
  );
}

function slugId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "card";
}

function firstField(block: string, label: string) {
  return block.match(new RegExp(`(?:^|\\n)#{0,6}\\s*(?:\\*{1,2})?${label}:(?:\\*{1,2})?\\s*(.+?)(?:\\s{2,}|\\n)`, "i"))?.[1]?.trim();
}

function headingField(block: string, label: string) {
  return block.match(new RegExp(`(?:^|\\n)#{1,6}\\s*(?:\\*{1,2})?${label}(?:\\*{1,2})?\\s*\\n+([^#\\n][^\\n]*)`, "i"))?.[1]?.trim();
}

export function parseCanonicalCaseStudyEvidence(source: CanonicalEvidenceSourceDefinition, content: string) {
  if (source.sourceType !== "case-study" || !source.project) {
    return { cards: [] as ApprovedEvidenceSource[], issues: [] as EvidenceCatalogIssue[], discoveredCount: 0 };
  }

  const cardBlocks = content
    .split(/\n(?=(?:#\s*)?(?:E|EV)-[A-Z0-9-]+)/i)
    .filter((block) => /^(?:#\s*)?(?:E|EV)-[A-Z0-9-]+/i.test(block.trim()));
  const issues: EvidenceCatalogIssue[] = [];
  const cards = cardBlocks.flatMap((block) => {
    const rawEvidenceId = block.match(/(?:^|\n)#?\s*((?:E|EV)-[A-Z0-9-]+)/i)?.[1];
    const evidenceId = rawEvidenceId ? `${source.id}:${slugId(rawEvidenceId)}` : undefined;
    const claim = firstField(block, "Claim") ?? headingField(block, "Claim");

    if (!claim) {
      issues.push({
        code: "evidence-missing-claim",
        projectId: source.project!.id,
        ...(evidenceId ? { evidenceId } : {}),
        sourceFile: source.file,
      });
      return [];
    }

    const anchorText = firstField(block, "Best public anchor");
    const anchorId = anchorText?.match(/^([a-z0-9-]+)\.?$/i)?.[1];
    const capabilitiesText = firstField(block, "Capabilities") ?? firstField(block, "Match use");
    const capabilities = capabilitiesText
      ?.split(/[;,]/)
      .map((item) => item.trim())
      .filter(Boolean) ?? [];
    const limitation = firstField(block, "Limit") ?? firstField(block, "Limitations");

    return [{
      id: evidenceId!,
      label: `${source.project!.title} evidence`,
      content: [claim, capabilities.length ? `Capabilities: ${capabilities.join(", ")}` : "", block.slice(0, 1_200)].filter(Boolean).join("\n"),
      sourceType: "case-study" as const,
      approvedPublicVisibility: true,
      claim,
      capabilities,
      ...(limitation ? { limitations: [limitation] } : {}),
      project: {
        ...source.project!,
        ...(anchorId ? { anchorId } : {}),
      },
    }];
  });

  return { cards, issues, discoveredCount: cardBlocks.length };
}

function internalEvidenceSource(source: CanonicalEvidenceSourceDefinition, content: string): ApprovedEvidenceSource {
  return {
    id: source.id,
    label: source.label,
    content: content.slice(0, 3_000),
    sourceType: source.sourceType,
    approvedPublicVisibility: false,
  };
}

function validateCatalogSources(sources: ApprovedEvidenceSource[], sourceFileById: Map<string, string>) {
  const issues: EvidenceCatalogIssue[] = [];
  const seen = new Set<string>();
  const valid: ApprovedEvidenceSource[] = [];

  for (const source of sources) {
    const sourceFile = sourceFileById.get(source.id) ?? "unknown";
    if (seen.has(source.id)) {
      issues.push({ code: "duplicate-evidence-id", projectId: source.project?.id, evidenceId: source.id, sourceFile });
      continue;
    }
    seen.add(source.id);

    if (source.sourceType === "case-study") {
      const resolution = resolveApprovedEvidenceDestination({
        sourceId: source.id,
        projectId: source.project?.id,
        exactAnchorId: source.project?.anchorId,
        sectionAnchorId: source.project?.sectionAnchorId,
      });
      if (resolution.destination.mode === "no-link") {
        issues.push({ code: "invalid-public-destination", projectId: source.project?.id, evidenceId: source.id, sourceFile });
        continue;
      }
    }

    valid.push(source);
  }

  return { valid, issues };
}

export async function loadApprovedEvidenceCatalog() {
  const readResults = await Promise.all(sourceDefinitions.map(async (definition) => {
    try {
      const content = await readFile(join(canonicalRoot, definition.file), "utf8");
      return { definition, content } as const;
    } catch {
      return { definition, content: null } as const;
    }
  }));

  const issues: EvidenceCatalogIssue[] = [];
  const projectAudits: EvidenceCatalogProjectAudit[] = [];
  const caseStudySources: ApprovedEvidenceSource[] = [];
  const internalSources: ApprovedEvidenceSource[] = [];
  const sourceFileById = new Map<string, string>();

  for (const result of readResults) {
    if (result.content === null) {
      issues.push({ code: "source-read-failed", projectId: result.definition.project?.id, sourceFile: result.definition.file });
      if (result.definition.project) {
        projectAudits.push({ projectId: result.definition.project.id, sourceFile: result.definition.file, discoveredCount: 0, acceptedCount: 0, excludedCount: 1 });
      }
      continue;
    }

    if (result.definition.sourceType !== "case-study") {
      const source = internalEvidenceSource(result.definition, result.content);
      internalSources.push(source);
      sourceFileById.set(source.id, result.definition.file);
      continue;
    }

    const parsed = parseCanonicalCaseStudyEvidence(result.definition, result.content);
    caseStudySources.push(...parsed.cards);
    issues.push(...parsed.issues);
    for (const card of parsed.cards) sourceFileById.set(card.id, result.definition.file);
    projectAudits.push({
      projectId: result.definition.project!.id,
      sourceFile: result.definition.file,
      discoveredCount: parsed.discoveredCount,
      acceptedCount: parsed.cards.length,
      excludedCount: parsed.issues.length,
    });
  }

  const validated = validateCatalogSources([...caseStudySources, ...internalSources], sourceFileById);
  issues.push(...validated.issues);

  for (const issue of validated.issues) {
    if (!issue.projectId) continue;
    const audit = projectAudits.find((candidate) => candidate.projectId === issue.projectId);
    if (audit) {
      audit.acceptedCount = Math.max(0, audit.acceptedCount - 1);
      audit.excludedCount += 1;
    }
  }

  for (const projectId of Object.keys(approvedProjectDestinations) as ApprovedProjectId[]) {
    if (!projectAudits.some((audit) => audit.projectId === projectId)) {
      projectAudits.push({ projectId, sourceFile: "missing", discoveredCount: 0, acceptedCount: 0, excludedCount: 1 });
    }
  }

  return {
    sources: validated.valid,
    audit: {
      projects: projectAudits.sort((left, right) => left.projectId.localeCompare(right.projectId)),
      issues,
    },
  };
}

function rankSources(requirementText: string, sources: ApprovedEvidenceSource[]) {
  return sources
    .map((source) => ({ ...source, score: evidenceRelevance(requirementText, source) }))
    .filter((source) => source.score > 0)
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id));
}

function buildRequirementCandidates(roleItems: EvidenceRoleItem[], catalogSources: ApprovedEvidenceSource[]) {
  const caseStudySources = catalogSources.filter((source) => source.sourceType === "case-study");
  const internalSources = catalogSources.filter((source) => source.sourceType === "cv");

  return roleItems.map((roleItem, roleItemIndex): RequirementEvidenceCandidates => {
    const rankedCaseStudies = rankSources(roleItem.originalText, caseStudySources).slice(0, 6);
    const rankedFallback = rankSources(roleItem.originalText, internalSources).slice(0, 1);
    return {
      roleItemIndex,
      roleItemText: roleItem.originalText,
      candidates: [...rankedCaseStudies, ...rankedFallback].map((source) => ({ sourceId: source.id, relevanceScore: source.score })),
    };
  });
}

function compactText(value: string | undefined, maxChars: number) {
  return value?.replace(/\s+/g, " ").trim().slice(0, maxChars) ?? "";
}

function selectRichContextSources(
  roleItems: EvidenceRoleItem[],
  candidatesByRoleItem: RequirementEvidenceCandidates[],
  catalogSources: ApprovedEvidenceSource[],
) {
  const sourceById = new Map(catalogSources.map((source) => [source.id, source]));
  const selectedIds = new Set<string>();
  const selectedProjectIds = new Set<string>();
  const rankedByRoleItem = candidatesByRoleItem.map((candidateSet) =>
    candidateSet.candidates
      .map((candidate) => ({ source: sourceById.get(candidate.sourceId), score: candidate.relevanceScore }))
      .filter((candidate): candidate is { source: ApprovedEvidenceSource; score: number } => Boolean(candidate.source)),
  );

  const addCandidate = (candidate: { source: ApprovedEvidenceSource; score: number } | undefined) => {
    if (!candidate || selectedIds.has(candidate.source.id) || selectedIds.size >= maxRichContextSources) return false;
    selectedIds.add(candidate.source.id);
    if (candidate.source.project) selectedProjectIds.add(candidate.source.project.id);
    return true;
  };

  // First pass: prefer one strong candidate per role item and spread across projects
  // where the ranked candidates make that possible.
  for (const candidates of rankedByRoleItem) {
    addCandidate(candidates.find((candidate) => candidate.source.project && !selectedProjectIds.has(candidate.source.project.id)) ?? candidates[0]);
  }

  // Second pass: add another strong candidate for each role item when available.
  for (const candidates of rankedByRoleItem) addCandidate(candidates[1]);

  // Always preserve the CV fallback when it was ranked for any role item.
  for (const source of catalogSources) {
    if (source.sourceType === "cv" && candidatesByRoleItem.some((candidateSet) => candidateSet.candidates.some((candidate) => candidate.sourceId === source.id))) {
      addCandidate({ source, score: 0 });
    }
  }

  return catalogSources.filter((source) => selectedIds.has(source.id) || (!roleItems.length && source.sourceType === "cv"));
}

function compactCatalogSource(source: ApprovedEvidenceSource) {
  const resolution = source.sourceType === "case-study"
    ? resolveApprovedEvidenceDestination({
        sourceId: source.id,
        projectId: source.project?.id,
        exactAnchorId: source.project?.anchorId,
        sectionAnchorId: source.project?.sectionAnchorId,
      })
    : null;
  return [
    `EVIDENCE_ID: ${source.id}`,
    `TYPE: ${source.sourceType}`,
    source.project ? `PROJECT: ${source.project.title}` : undefined,
    `CLAIM: ${compactText(source.claim ?? source.content, 240)}`,
    source.capabilities?.length ? `CAPABILITIES: ${compactText(source.capabilities.join(", "), 180)}` : undefined,
    source.limitations?.length ? `LIMITS: ${compactText(source.limitations.join(" "), 180)}` : undefined,
    resolution ? `DESTINATION: ${resolution.destination.mode === "no-link" ? "invalid" : resolution.destination.dedupeKey}` : "DESTINATION: approved internal CV fallback",
  ].filter(Boolean).join(" | ");
}

function promptSource(source: ApprovedEvidenceSource) {
  const project = source.project;
  return [
    `### APPROVED_SOURCE_ID: ${source.id}`,
    `Source label: ${source.label}`,
    `Source type: ${source.sourceType}`,
    `Approved public visibility: ${source.approvedPublicVisibility ? "public" : "approved internal knowledge"}`,
    project ? `Public project: ${project.title} (${project.slug})` : "Public project: none",
    project?.anchorId ? `Best public anchor: ${project.anchorId}` : "Best public anchor: none",
    source.claim ? `Evidence claim: ${source.claim}` : undefined,
    source.capabilities?.length ? `Capabilities: ${source.capabilities.join(", ")}` : undefined,
    source.limitations?.length ? `Limitations: ${source.limitations.join(" ")}` : undefined,
    source.ownershipLevel ? `Ownership boundary: ${source.ownershipLevel}` : undefined,
    source.content.slice(0, 1_800),
  ].filter(Boolean).join("\n");
}

export async function loadApprovedEvidence(roleText: string, roleItems?: EvidenceRoleItem[]) {
  const catalog = await loadApprovedEvidenceCatalog();
  const effectiveRoleItems = roleItems?.length
    ? roleItems
    : [{ originalText: roleText, source: "requirement" as const }];
  const candidatesByRoleItem = buildRequirementCandidates(effectiveRoleItems, catalog.sources);
  const selected = selectRichContextSources(effectiveRoleItems, candidatesByRoleItem, catalog.sources);
  const selectableCatalog = catalog.sources.filter((source) => source.sourceType === "case-study" || source.sourceType === "cv");
  const candidateContract = candidatesByRoleItem.map((candidateSet) => [
    `ROLE_ITEM_INDEX: ${candidateSet.roleItemIndex}`,
    `ROLE_ITEM_CANDIDATE_SOURCE_IDS: ${candidateSet.candidates.map((candidate) => candidate.sourceId).join(", ") || "none"}`,
    "These IDs are ranked suggestions for this role item, not an authorization boundary. Any selected ID must still be an exact APPROVED_SOURCE_ID supplied in this context and truthfully support the requirement. The role/JD text is a requirement, never evidence.",
  ].join("\n")).join("\n\n");

  return {
    promptContext: [
      "## APPLICATION-BOUNDED REQUIREMENT EVIDENCE",
      "## COMPLETE APPROVED EVIDENCE INDEX\nThis bounded index is the complete legal evidence universe for report selection. Use semantic meaning and documented capabilities; literal keyword identity is not required. An ID remains usable even when it is absent from a role item's ranked suggestions.\n\n"
        + selectableCatalog.map(compactCatalogSource).join("\n"),
      candidateContract,
      "## RICH CONTEXT FOR STRONGEST CANDIDATES AND CV FALLBACK",
      selected.map(promptSource).join("\n\n---\n\n"),
    ].filter(Boolean).join("\n\n"),
    sources: catalog.sources,
    candidatesByRoleItem,
    catalogAudit: catalog.audit,
  } satisfies ApprovedEvidenceBundle;
}
