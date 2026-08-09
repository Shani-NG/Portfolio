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
};

function project(
  projectId: ApprovedProjectId,
  title: string,
  slug: string,
  anchors: readonly string[],
): ApprovedProjectDestination {
  return { projectId, title, slug, anchors: new Set(anchors) };
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
  ]),
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
  ]),
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
  ]),
};

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
