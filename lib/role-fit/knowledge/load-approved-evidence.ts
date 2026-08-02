import { readFile } from "node:fs/promises";
import { join } from "node:path";

const canonicalRoot = join(process.cwd(), "PORTFOLIO_IMPLEMENTATION", "role-fit-agent", "docs", "canonical");

export type ApprovedEvidenceSource = {
  id: string;
  label: string;
  content: string;
  sourceType: "case-study" | "cv" | "profile";
  claim?: string;
  capabilities?: string[];
  project?: {
    slug: string;
    title: string;
    anchorId?: string;
  };
};

export type ApprovedEvidenceBundle = {
  promptContext: string;
  sources: ApprovedEvidenceSource[];
};

const sources = [
  { id: "cv", label: "CV knowledge", file: "CV_Knowledge.md", sourceType: "cv" },
  { id: "profile", label: "General profile knowledge", file: "General_Profile_Knowledge.md", sourceType: "profile" },
  { id: "big-red-button", label: "The Big Red Button case study", file: "Case_Study_Knowledge_The_Big_Red_Button.md", sourceType: "case-study", project: { slug: "the-big-red-button", title: "The Big RED BUTTON" } },
  { id: "c4i", label: "C4I case study", file: "Case_Study_Knowledge_C4I.md", sourceType: "case-study", project: { slug: "c4i-beyond-clarity", title: "C4I - Beyond Clarity" } },
  { id: "epd", label: "EPD case study", file: "Case_Study_Knowledge_EPD.md", sourceType: "case-study", project: { slug: "ux-from-the-heart", title: "UX from the Heart" } },
  { id: "howtool", label: "HOWTOOL case study", file: "Case_Study_Knowledge_HOWTOOL.md", sourceType: "case-study", project: { slug: "nobody-reads-the-manual", title: "Nobody Reads the Manual" } },
  { id: "monitoring", label: "Monitoring and Product Intelligence case study", file: "Case_Study_Knowledge_Monitoring_and_Product_Intelligence.md", sourceType: "case-study", project: { slug: "monitoring-product-intelligence", title: "Monitoring and Product Intelligence" } },
] as const;

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

function slugId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "card";
}

function parseCaseStudyCards(source: (typeof sources)[number], content: string) {
  if (source.sourceType !== "case-study" || !("project" in source)) return [];

  const cardBlocks = content.split(/\n(?=(?:#\s*)?(?:E-[A-Z0-9-]+|Evidence card|Claim:))/i);

  return cardBlocks.flatMap((block, index) => {
    const claim = block.match(/(?:^|\n)#?\s*Claim:\s*(.+?)(?:\s{2,}|\n)/i)?.[1]?.trim();
    if (!claim) return [];

    const anchorText = block.match(/Best public anchor:\s*(.+?)(?:\s{2,}|\n)/i)?.[1]?.trim();
    const anchorId = anchorText && /^[a-z0-9-]+$/i.test(anchorText) ? anchorText : undefined;
    const capabilities = block.match(/Capabilities:\s*(.+?)(?:\s{2,}|\n)/i)?.[1]
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? [];
    const evidenceId = block.match(/(?:^|\n)#?\s*(E-[A-Z0-9-]+)/i)?.[1]?.toLowerCase() ?? `${source.id}-${index + 1}`;

    return [{
      id: `${source.id}:${slugId(evidenceId)}`,
      label: `${source.project.title} evidence`,
      content: [claim, capabilities.length ? `Capabilities: ${capabilities.join(", ")}` : "", block.slice(0, 1200)].filter(Boolean).join("\n"),
      sourceType: "case-study" as const,
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

function internalEvidenceSource(source: (typeof sources)[number], content: string) {
  return {
    id: source.id,
    label: source.label,
    content: content.slice(0, 3000),
    sourceType: source.sourceType,
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

  const caseStudyCards = loaded
    .flatMap((source) => parseCaseStudyCards(source, source.content))
    .map((source) => ({ ...source, score: relevance(roleText, [source.claim, source.capabilities?.join(" "), source.content].filter(Boolean).join(" ")) }))
    .filter((source) => source.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const selectedProjectSlugs = new Set(caseStudyCards.map((source) => source.project?.slug).filter(Boolean));
  const supportingInternal = loaded
    .filter((source) => source.sourceType !== "case-study")
    .map((source) => ({ ...internalEvidenceSource(source, source.content), score: relevance(roleText, source.content) }))
    .filter((source) => source.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, 4 - selectedProjectSlugs.size));

  const selected = [...caseStudyCards, ...supportingInternal].slice(0, 12);

  return {
    promptContext: selected
      .map((source) => {
        const project = "project" in source ? source.project : undefined;
        const claim = "claim" in source ? source.claim : undefined;
        const capabilities = "capabilities" in source ? source.capabilities : undefined;

        return [
          `### APPROVED_SOURCE_ID: ${source.id}`,
          `Source label: ${source.label}`,
          `Source type: ${source.sourceType}`,
          project ? `Public project: ${project.title} (${project.slug})` : "Public project: none",
          project?.anchorId ? `Best public anchor: ${project.anchorId}` : "Best public anchor: none",
          claim ? `Evidence claim: ${claim}` : undefined,
          capabilities?.length ? `Capabilities: ${capabilities.join(", ")}` : undefined,
          source.content.slice(0, 1800),
        ].filter(Boolean).join("\n");
      })
      .join("\n\n---\n\n"),
    sources: selected.map((source) => {
      const claim = "claim" in source ? source.claim : undefined;
      const capabilities = "capabilities" in source ? source.capabilities : undefined;

      return {
        id: source.id,
        label: source.label,
        content: source.content,
        sourceType: source.sourceType,
        ...(claim ? { claim } : {}),
        ...(capabilities?.length ? { capabilities } : {}),
        ...("project" in source ? { project: source.project } : {}),
      };
    }),
  } satisfies ApprovedEvidenceBundle;
}
