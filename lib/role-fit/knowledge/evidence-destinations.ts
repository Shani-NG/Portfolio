export type ApprovedProjectId =
  | "big-red-button"
  | "c4i"
  | "epd"
  | "howtool"
  | "monitoring"
  | "role-fit-agent";

type ApprovedProjectDestination = {
  projectId: ApprovedProjectId;
  title: string;
  slug: string;
  anchors: ReadonlySet<string>;
  anchorLabels: Readonly<Record<string, string>>;
};

function project(
  projectId: ApprovedProjectId,
  title: string,
  slug: string,
  anchors: readonly string[],
  anchorLabels: Readonly<Record<string, string>> = {},
): ApprovedProjectDestination {
  return { projectId, title, slug, anchors: new Set(anchors), anchorLabels };
}

export const approvedProjectDestinations: Record<ApprovedProjectId, ApprovedProjectDestination> = {
  "big-red-button": project("big-red-button", "The Big RED BUTTON", "the-big-red-button", [
    "the-big-red-button-hero",
    "project-snapshot",
    "the-reset-was-not-the-solution",
    "translating-infrastructure-into-operational-meaning",
    "prevention-before-recovery",
    "smart-recovery-fix-what-failed",
    "expert-tools-without-expert-complexity-for-everyone",
    "one-system-three-levels-of-control",
    "what-changed",
    "from-recovery-to-prevention",
    "the-product-shift",
  ]),
  c4i: project("c4i", "C4I - Beyond Clarity", "c4i-beyond-clarity", [
    "c4i-beyond-clarity",
    "before-ux-organizational-alignment",
    "four-pillars-one-shared-logic",
    "the-real-ux-was-invisible",
    "defaults-made-each-workspace-feel-purpose-built",
    "designed-for-threat-response",
    "ux-engineering-through-integration",
    "screens-as-proof",
    "operational-resilience",
  ], {
    "c4i-beyond-clarity": "C4I - Beyond Clarity",
    "before-ux-organizational-alignment": "Before UX: organizational alignment.",
    "four-pillars-one-shared-logic": "Four pillars. One shared logic.",
    "the-real-ux-was-invisible": "The real UX was invisible.",
    "defaults-made-each-workspace-feel-purpose-built": "Defaults made each workspace feel purpose-built.",
    "designed-for-threat-response": "Designed for threat response, not just information display.",
    "ux-engineering-through-integration": "UX engineering through integration.",
    "screens-as-proof": "Screens as proof.",
  }),
  epd: project("epd", "UX from the Heart", "ux-from-the-heart", [
    "ux-from-the-heart",
    "project-overview",
    "two-users-operating-one-system",
    "prepare-the-system-before-pressure",
    "flexible-procedure-model",
    "clinical-habits-could-not-be-redesigned-away",
    "critical-information-stayed-in-view",
    "from-alpha-to-clinical-mvp",
    "balancing-innovation-with-adoption",
  ]),
  howtool: project("howtool", "Nobody Reads the Manual", "nobody-reads-the-manual", [
    "kms-hero",
    "project-snapshot",
    "the-real-problem",
    "foundation-phase",
    "editor-to-mobile",
    "process-model",
    "validation-before-release",
    "contextual-guidance",
    "why-it-still-matters",
  ]),
  monitoring: project("monitoring", "Monitoring and Product Intelligence", "monitoring-product-intelligence", [
    "monitoring-and-product-intelligence",
    "from-field-noise-to-product-judgment",
    "a-learning-system",
    "scenario-mapping",
    "matomo-product-evaluation-layer",
    "evidence-backed-ux-decisions",
    "first-week-product-value",
    "insight-loop-prioritization",
    "product-judgment",
  ], {
    "monitoring-and-product-intelligence": "Monitoring and Product Intelligence",
    "from-field-noise-to-product-judgment": "From field noise to product judgment",
    "a-learning-system": "I did not want another feedback loop. I wanted a learning system.",
    "scenario-mapping": "Scenario mapping turned usage into measurable intent",
    "matomo-product-evaluation-layer": "Matomo became a product evaluation layer",
    "evidence-backed-ux-decisions": "From analytics to evidence-backed UX decisions",
    "first-week-product-value": "The first week surfaced hidden product value",
    "insight-loop-prioritization": "The insight loop changed prioritization",
    "product-judgment": "Not dashboards. Product judgment.",
  }),
  "role-fit-agent": project("role-fit-agent", "Role Fit Agent", "role-fit-agent", [
    "overview",
    "opportunity",
    "build-journey",
    "product-story",
    "technical-architecture",
    "decision-evolution",
    "mvp-scope",
    "behind-the-build",
    "live-experience",
  ], {
    overview: "Overview",
    opportunity: "Opportunity",
    "build-journey": "Build journey",
    "product-story": "Product story",
    "technical-architecture": "Technical system architecture",
    "decision-evolution": "Decision evolution",
    "mvp-scope": "MVP scope",
    "behind-the-build": "Behind the build",
    "live-experience": "Explore the experience",
  }),
};

export function evidenceDestinationDisplayLabel(input: {
  project?: { slug: string; title: string };
  destination: { mode: "anchor"; href: string; anchorId: string; dedupeKey: string } | { mode: "project-top"; href: string; dedupeKey: string } | { mode: "no-link"; dedupeKey: string };
}) {
  if (input.destination.mode !== "anchor" || !input.project) return undefined;
  const project = Object.values(approvedProjectDestinations).find((candidate) => candidate.slug === input.project?.slug);
  return project?.anchorLabels[input.destination.anchorId] ?? input.project.title;
}

export type ApprovedEvidenceDestination =
  | {
      project: { id: ApprovedProjectId; slug: string; title: string };
      destination: { mode: "anchor"; href: string; anchorId: string; dedupeKey: string };
      resolution: "exact-anchor" | "section-anchor";
    }
  | {
      project: { id: ApprovedProjectId; slug: string; title: string };
      destination: { mode: "project-top"; href: string; dedupeKey: string };
      resolution: "project-fallback";
    }
  | {
      destination: { mode: "no-link"; dedupeKey: string };
      resolution: "no-link";
    };

export function resolveApprovedEvidenceDestination(input: {
  sourceId: string;
  projectId?: string;
  exactAnchorId?: string;
  sectionAnchorId?: string;
}): ApprovedEvidenceDestination {
  const approvedProject = input.projectId
    ? approvedProjectDestinations[input.projectId as ApprovedProjectId]
    : undefined;

  if (!approvedProject) {
    return {
      destination: { mode: "no-link", dedupeKey: `source:${input.sourceId}` },
      resolution: "no-link",
    };
  }

  const approvedAnchor = [input.exactAnchorId, input.sectionAnchorId]
    .find((anchorId) => anchorId && approvedProject.anchors.has(anchorId));
  const projectMetadata = {
    id: approvedProject.projectId,
    slug: approvedProject.slug,
    title: approvedProject.title,
  };

  if (approvedAnchor) {
    const href = `/experience/${approvedProject.slug}#${approvedAnchor}`;
    return {
      project: projectMetadata,
      destination: { mode: "anchor", href, anchorId: approvedAnchor, dedupeKey: href },
      resolution: approvedAnchor === input.exactAnchorId ? "exact-anchor" : "section-anchor",
    };
  }

  const href = `/experience/${approvedProject.slug}`;
  return {
    project: projectMetadata,
    destination: { mode: "project-top", href, dedupeKey: href },
    resolution: "project-fallback",
  };
}
