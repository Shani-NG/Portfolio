import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ApprovedProjectId } from "./evidence-destinations.ts";

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

export type ApprovedEvidenceBundle = {
  promptContext: string;
  sources: ApprovedEvidenceSource[];
};

type ScoredEvidenceSource = ApprovedEvidenceSource & { score: number };

const sources = [
  { id: "cv", label: "CV knowledge", file: "CV_Knowledge.md", sourceType: "cv" },
  { id: "profile", label: "General profile knowledge", file: "General_Profile_Knowledge.md", sourceType: "profile" },
  { id: "big-red-button", label: "The Big Red Button case study", file: "Case_Study_Knowledge_The_Big_Red_Button.md", sourceType: "case-study", project: { id: "big-red-button", slug: "the-big-red-button", title: "The Big RED BUTTON" } },
  { id: "c4i", label: "C4I case study", file: "Case_Study_Knowledge_C4I.md", sourceType: "case-study", project: { id: "c4i", slug: "c4i-beyond-clarity", title: "C4I - Beyond Clarity" } },
  { id: "epd", label: "EPD case study", file: "Case_Study_Knowledge_EPD.md", sourceType: "case-study", project: { id: "epd", slug: "ux-from-the-heart", title: "UX from the Heart" } },
  { id: "howtool", label: "HOWTOOL case study", file: "Case_Study_Knowledge_HOWTOOL.md", sourceType: "case-study", project: { id: "howtool", slug: "nobody-reads-the-manual", title: "Nobody Reads the Manual" } },
  { id: "monitoring", label: "Monitoring and Product Intelligence case study", file: "Case_Study_Knowledge_Monitoring_and_Product_Intelligence.md", sourceType: "case-study", project: { id: "monitoring", slug: "monitoring-product-intelligence", title: "Monitoring and Product Intelligence" } },
] as const;

const roleFitAgentEvidence: ApprovedEvidenceSource[] = [
  {
    id: "role-fit-agent:e-role-fit-01",
    label: "Role Fit Agent - evidence-based AI product",
    content: "I designed, built and operationalized an evidence-based AI portfolio experience that turns static work into a transparent professional conversation.",
    sourceType: "case-study",
    approvedPublicVisibility: true,
    claim: "I designed, built and operationalized an evidence-based AI portfolio experience that turns static work into a transparent professional conversation.",
    capabilities: ["AI product architecture", "human-centered AI UX", "conversation design", "evidence-based AI reasoning"],
    limitations: ["Does not prove ML engineering, model research, enterprise AI governance ownership, or production-scale AI deployment."],
    evidenceSpecificity: "high",
    ownershipLevel: "Product, UX, conversation, and system-architecture leadership documented by the public case study.",
    project: { id: "role-fit-agent", slug: "role-fit-agent", title: "Role Fit Agent", anchorId: "overview" },
  },
  {
    id: "role-fit-agent:e-role-fit-02",
    label: "Role Fit Agent - deterministic orchestration",
    content: "A single conversational experience is supported by governed task modes, structured evidence retrieval, runtime controls and persistent system services. The model interprets and synthesizes; the application remains authoritative.",
    sourceType: "case-study",
    approvedPublicVisibility: true,
    claim: "A single conversational experience is supported by governed task modes, structured evidence retrieval, runtime controls and persistent system services.",
    capabilities: ["agentic workflows", "agent orchestration", "RAG planning", "validation and eligibility logic", "report data model"],
    limitations: ["Documents product and application architecture, not foundation-model development or ML research."],
    evidenceSpecificity: "high",
    ownershipLevel: "AI product and deterministic application architecture.",
    project: { id: "role-fit-agent", slug: "role-fit-agent", title: "Role Fit Agent", anchorId: "technical-architecture" },
  },
  {
    id: "role-fit-agent:e-role-fit-03",
    label: "Role Fit Agent - validated report flow",
    content: "The system validates the input, presents a concise role snapshot for confirmation, analyzes the role against verified portfolio evidence, and generates a qualitative report that distinguishes strengths, transferable capabilities, unknowns and genuine gaps.",
    sourceType: "case-study",
    approvedPublicVisibility: true,
    claim: "The system validates the input, presents a concise role snapshot for confirmation, analyzes the role against verified portfolio evidence, and generates a qualitative report that distinguishes strengths, transferable capabilities, unknowns and genuine gaps.",
    capabilities: ["role validation", "role-fit report generation", "evidence-based AI reasoning", "conversation design"],
    limitations: ["Does not prove automated hiring decisions or a quantitative prediction of job performance."],
    evidenceSpecificity: "high",
    ownershipLevel: "End-to-end product flow and report-logic design.",
    project: { id: "role-fit-agent", slug: "role-fit-agent", title: "Role Fit Agent", anchorId: "product-story" },
  },
  {
    id: "role-fit-agent:e-role-fit-04",
    label: "Role Fit Agent - QA and privacy-aware persistence",
    content: "Designed QA scenarios for invalid inputs, injection, timeouts, weak evidence and session limits. Defined logging, privacy-aware persistence and a human-reviewed learning loop. Do not store raw job-description text; retain only approved derived analysis and structured report data.",
    sourceType: "case-study",
    approvedPublicVisibility: true,
    claim: "Designed QA scenarios for invalid inputs, injection, timeouts, weak evidence and session limits. Defined logging, privacy-aware persistence and a human-reviewed learning loop. Do not store raw job-description text; retain only approved derived analysis and structured report data.",
    capabilities: ["QA and edge-case handling", "logging and monitoring", "privacy-aware persistence", "human-reviewed AI workflows"],
    limitations: ["Documents the product architecture and MVP decisions; it does not claim enterprise-scale governance or deployment."],
    evidenceSpecificity: "high",
    ownershipLevel: "Product safeguards, QA scenarios, and persistence decisions.",
    project: { id: "role-fit-agent", slug: "role-fit-agent", title: "Role Fit Agent", anchorId: "decision-evolution" },
  },
];

function terms(value: string) {
  return new Set(value.toLowerCase().match(/[a-z0-9]{3,}|[\u0590-\u05ff]{2,}/g) ?? []);
}

function relevance(roleText: string, content: string) {
  const roleTerms = terms(roleText);
  const contentTerms = terms(content);
  let score = 0;
  for (const term of roleTerms) if (contentTerms.has(term)) score += 1;
  return score;
}

function evidenceRelevance(roleText: string, source: ApprovedEvidenceSource) {
  return (
    relevance(roleText, source.capabilities?.join(" ") ?? "") * 4
    + relevance(roleText, source.claim ?? "") * 2
    + relevance(roleText, source.content)
  );
}

function selectDiverseCaseStudyEvidence(sources: ScoredEvidenceSource[], limit: number) {
  const projectCounts = new Map<string, number>();
  const selected: ScoredEvidenceSource[] = [];

  for (const source of sources) {
    const projectId = source.project?.id ?? source.id;
    const count = projectCounts.get(projectId) ?? 0;
    if (count >= 3) continue;
    selected.push(source);
    projectCounts.set(projectId, count + 1);
    if (selected.length === limit) break;
  }

  return selected;
}

function slugId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "card";
}

function parseCaseStudyCards(source: (typeof sources)[number], content: string): ScoredEvidenceSource[] {
  if (source.sourceType !== "case-study" || !("project" in source)) return [];

  const cardBlocks = content
    .split(/\n(?=(?:#\s*)?(?:E|EV)-[A-Z0-9-]+)/i)
    .filter((block) => /^(?:#\s*)?(?:E|EV)-[A-Z0-9-]+/i.test(block.trim()));

  return cardBlocks.flatMap((block, index) => {
    const claim = block.match(/(?:^|\n)#?\s*Claim:\s*(.+?)(?:\s{2,}|\n)/i)?.[1]?.trim();
    if (!claim) return [];

    const anchorText = block.match(/Best public anchor:\s*(.+?)(?:\s{2,}|\n)/i)?.[1]?.trim();
    const anchorId = anchorText?.match(/^([a-z0-9-]+)\.?$/i)?.[1];
    const capabilities = block.match(/Capabilities:\s*(.+?)(?:\s{2,}|\n)/i)?.[1]
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? [];
    const evidenceId = block.match(/(?:^|\n)#?\s*((?:E|EV)-[A-Z0-9-]+)/i)?.[1]?.toLowerCase() ?? `${source.id}-${index + 1}`;

    return [{
      id: `${source.id}:${slugId(evidenceId)}`,
      label: `${source.project.title} evidence`,
      content: [claim, capabilities.length ? `Capabilities: ${capabilities.join(", ")}` : "", block.slice(0, 1200)].filter(Boolean).join("\n"),
      sourceType: "case-study" as const,
      approvedPublicVisibility: true,
      claim,
      capabilities,
      project: {
        ...source.project,
        ...(anchorId ? { anchorId } : {}),
      },
      score: 0,
    }];
  });
}

function internalEvidenceSource(source: (typeof sources)[number], content: string): ScoredEvidenceSource {
  return {
    id: source.id,
    label: source.label,
    content: content.slice(0, 3000),
    sourceType: source.sourceType,
    approvedPublicVisibility: false,
    score: 0,
  };
}

export async function loadApprovedEvidence(roleText: string) {
  const loaded = await Promise.all(
    sources.map(async (source) => {
      const content = await readFile(join(canonicalRoot, source.file), "utf8");
      return { ...source, content };
    }),
  );

  const parsedCaseStudyCards: ScoredEvidenceSource[] = [
    ...loaded.flatMap((source) => parseCaseStudyCards(source, source.content)),
    ...roleFitAgentEvidence.map((source) => ({ ...source, score: 0 })),
  ];

  const rankedCaseStudyCards = parsedCaseStudyCards
    .map((source) => ({ ...source, score: evidenceRelevance(roleText, source) }))
    .filter((source) => source.score > 0)
    .sort((a, b) => b.score - a.score);
  const caseStudyCards = selectDiverseCaseStudyEvidence(rankedCaseStudyCards, 10);

  const selectedProjectSlugs = new Set(caseStudyCards.map((source) => source.project?.slug).filter(Boolean));
  const supportingInternal: ScoredEvidenceSource[] = loaded
    .filter((source) => source.sourceType !== "case-study")
    .map((source) => ({ ...internalEvidenceSource(source, source.content), score: relevance(roleText, source.content) }))
    .filter((source) => source.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, 4 - selectedProjectSlugs.size));

  const selected: ScoredEvidenceSource[] = [...caseStudyCards, ...supportingInternal].slice(0, 12);

  return {
    promptContext: selected
      .map((source) => {
        const project = source.project;
        const claim = source.claim;
        const capabilities = source.capabilities;
        const limitations = source.limitations;

        return [
          `### APPROVED_SOURCE_ID: ${source.id}`,
          `Source label: ${source.label}`,
          `Source type: ${source.sourceType}`,
          `Approved public visibility: ${source.approvedPublicVisibility ? "public" : "approved internal knowledge"}`,
          project ? `Public project: ${project.title} (${project.slug})` : "Public project: none",
          project?.anchorId ? `Best public anchor: ${project.anchorId}` : "Best public anchor: none",
          claim ? `Evidence claim: ${claim}` : undefined,
          capabilities?.length ? `Capabilities: ${capabilities.join(", ")}` : undefined,
          limitations?.length ? `Limitations: ${limitations.join(" ")}` : undefined,
          source.ownershipLevel ? `Ownership boundary: ${source.ownershipLevel}` : undefined,
          source.content.slice(0, 1800),
        ].filter(Boolean).join("\n");
      })
      .join("\n\n---\n\n"),
    sources: selected.map((source) => {
      const claim = source.claim;
      const capabilities = source.capabilities;
      const limitations = source.limitations;

      return {
        id: source.id,
        label: source.label,
        content: source.content,
        sourceType: source.sourceType,
        approvedPublicVisibility: source.approvedPublicVisibility,
        ...(claim ? { claim } : {}),
        ...(capabilities?.length ? { capabilities } : {}),
        ...(limitations?.length ? { limitations } : {}),
        ...(source.evidenceSpecificity ? { evidenceSpecificity: source.evidenceSpecificity } : {}),
        ...(source.ownershipLevel ? { ownershipLevel: source.ownershipLevel } : {}),
        ...(source.project ? { project: source.project } : {}),
      };
    }),
  } satisfies ApprovedEvidenceBundle;
}
