import type { ReportUIPayload } from "../contracts/index.ts";

export type RoleIdentity = {
  company?: string;
  title?: string;
};

export type ActiveReportRoleDisposition = "same-role" | "different-role" | "unknown";

function normalizeRoleIdentityPart(value: string | undefined) {
  return (value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function compareActiveReportRole(active: RoleIdentity, incoming: RoleIdentity): ActiveReportRoleDisposition {
  const activeTitle = normalizeRoleIdentityPart(active.title);
  const incomingTitle = normalizeRoleIdentityPart(incoming.title);
  if (!activeTitle || !incomingTitle) return "unknown";
  if (activeTitle !== incomingTitle) return "different-role";

  const activeCompany = normalizeRoleIdentityPart(active.company);
  const incomingCompany = normalizeRoleIdentityPart(incoming.company);
  if (!activeCompany && !incomingCompany) return "same-role";
  if (!activeCompany || !incomingCompany) return "unknown";
  return activeCompany === incomingCompany ? "same-role" : "different-role";
}

function publicReportItem(item: ReportUIPayload["requirementMapping"]["items"][number]) {
  const { itemId: _itemId, clusterIds: _clusterIds, ...semanticItem } = item;
  return semanticItem;
}

function publicDestination(destination: ReportUIPayload["evidencePanel"]["clusters"][number]["destination"]) {
  const { dedupeKey: _dedupeKey, ...publicNavigation } = destination;
  return publicNavigation;
}

function withoutInternalReportId(href: string | undefined) {
  if (!href) return undefined;
  const [path, query = ""] = href.split("?", 2);
  const publicQuery = query
    .split("&")
    .filter((part) => part && !part.toLowerCase().startsWith("report_id="))
    .join("&");
  return publicQuery ? `${path}?${publicQuery}` : path;
}

export function createPublicReportContext(report: ReportUIPayload) {
  return {
    language: report.language,
    role: report.roleSnapshot,
    overallFit: report.overallFitVisual,
    evidenceConfidence: report.evidenceConfidence,
    skills: report.skillsMatch.items.map(publicReportItem),
    requirements: report.requirementMapping.items.map(publicReportItem),
    evidence: report.evidencePanel.clusters.map((cluster) => {
      const {
        clusterId: _clusterId,
        supportedItemIds: _supportedItemIds,
        evidenceIds: _evidenceIds,
        destination,
        ...semanticCluster
      } = cluster;
      return { ...semanticCluster, destination: publicDestination(destination) };
    }),
    strengths: report.topStrengths.items.map(publicReportItem),
    gaps: report.keyGaps.items.map(publicReportItem),
    disclaimer: report.disclaimer,
    contact: {
      variant: report.contactCta.variant,
      label: report.contactCta.label,
      enabled: report.contactCta.enabled,
      ...(report.contactCta.href ? { href: withoutInternalReportId(report.contactCta.href) } : {}),
    },
  };
}

const englishUnfinishedReportPattern = /\b(?:report|fit review)\b.{0,40}\b(?:hasn['’]?t|has not|isn['’]?t|is not|not yet)\b|\b(?:hasn['’]?t|has not|isn['’]?t|is not|not yet)\b.{0,40}\b(?:report|fit review)\b/i;
const englishReportReadyPattern = /\b(?:the|your|this)?\s*(?:fit\s+)?(?:report|review)\s+(?:is|was|has been)\s+(?:ready|generated|created|completed|finished|available)\b|\b(?:i(?:['’]ve| have)|we(?:['’]ve| have))\s+(?:generated|created|completed|finished)\s+(?:the|your|this)?\s*(?:fit\s+)?(?:report|review)\b/i;
const hebrewUnfinishedReportPattern = /הדוח.{0,30}(?:לא|טרם).{0,20}(?:נוצר|הושלם|מוכן|זמין)|(?:לא|טרם).{0,30}הדוח/i;
const hebrewReportReadyPattern = /(?:הדוח|בדיקת ההתאמה).{0,30}(?:מוכן|מוכנה|נוצר|נוצרה|הושלם|הושלמה|זמין|זמינה)/i;

export function guardReportLifecycleClaim(input: {
  answer: string;
  hasAuthoritativeReport: boolean;
  language: "he" | "en" | "mixed";
}) {
  const answerWithoutIdentifierLabel = input.answer
    .replace(/report\s*(?:id|identifier)\s*[:#-]?\s*(?=R[A-Z0-9]{4}\b)/gi, "")
    .replace(/מזהה\s+הדוח\s*[:#-]?\s*(?=R[A-Z0-9]{4}\b)/g, "");
  const publicAnswer = answerWithoutIdentifierLabel.replace(
    /\bR[A-Z0-9]{4}\b/g,
    input.language === "he" || input.language === "mixed" ? "הדוח הפעיל" : "the active report",
  );
  if (input.hasAuthoritativeReport) return publicAnswer;
  const deniesCompletion = englishUnfinishedReportPattern.test(publicAnswer) || hebrewUnfinishedReportPattern.test(publicAnswer);
  const claimsCompletion = englishReportReadyPattern.test(publicAnswer) || hebrewReportReadyPattern.test(publicAnswer);
  if (!claimsCompletion || deniesCompletion) return publicAnswer;

  return input.language === "he" || input.language === "mixed"
    ? "הדוח עדיין לא נוצר. כשהוא יהיה מוכן, הוא יופיע באזור הדוח."
    : "The report hasn’t been generated yet. When it’s ready, it will appear in the report panel.";
}
