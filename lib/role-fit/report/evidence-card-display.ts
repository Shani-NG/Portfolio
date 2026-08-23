import type { ReportUIPayload } from "../contracts/index.ts";
import { evidenceDestinationDisplayLabel } from "../knowledge/evidence-destinations.ts";

type EvidenceCluster = ReportUIPayload["evidencePanel"]["clusters"][number];

export function evidenceProjectTitles(clusters: EvidenceCluster[]) {
  return [...new Set(clusters.map((cluster) => cluster.project?.title).filter((title): title is string => Boolean(title)))];
}

export function evidenceClusterTitle(cluster: EvidenceCluster, hasMultipleProjects: boolean) {
  const sectionTitle = evidenceDestinationDisplayLabel({ project: cluster.project, destination: cluster.destination });
  if (!sectionTitle) return cluster.project?.title || cluster.title;
  return hasMultipleProjects ? `${sectionTitle} | ${cluster.project?.title || cluster.title}` : sectionTitle;
}

export function evidenceConfidenceAccessibilityLabel(projectTitles: string[], confidence: ReportUIPayload["requirementMapping"]["items"][number]["evidenceConfidence"]) {
  const sourceLabel = projectTitles.length ? projectTitles.join(", ") : "No case studies";
  return `${sourceLabel}. ${confidence.replaceAll("-", " ")} evidence confidence.`;
}
