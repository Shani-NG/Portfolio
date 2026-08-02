import { reportUIPayloadSchema, type ReportUIPayload, type RoleValidationResult } from "../contracts/index.ts";
import type { ApprovedEvidenceBundle } from "../knowledge/load-approved-evidence.ts";
import type { QualitativeReportAnalysis } from "../model/provider.ts";

type RoleDraft = RoleValidationResult["roleDraft"];

export type RoleAnalysisItem = {
  originalText: string;
  source: "requirement" | "responsibility";
};

export function getRoleAnalysisItems(roleDraft: RoleDraft): RoleAnalysisItem[] {
  const seen = new Set<string>();
  const items: RoleAnalysisItem[] = [];

  for (const [source, fields] of [
    ["requirement", roleDraft.requirements],
    ["responsibility", roleDraft.responsibilities],
  ] as const) {
    for (const field of fields) {
      const originalText = field.originalValue.trim();
      const key = originalText.toLowerCase();
      if (!originalText || seen.has(key)) continue;
      seen.add(key);
      items.push({ originalText, source });
    }
  }

  return items;
}

type CompositionResult =
  | { ok: true; report: ReportUIPayload }
  | { ok: false; diagnostic: string };

const fitPresentation = {
  strong: { value: 82, illustrationKey: "fit-strong", colorToken: "fit.strong", label: "Strong fit" },
  good: { value: 68, illustrationKey: "fit-good", colorToken: "fit.good", label: "Good fit" },
  partial: { value: 45, illustrationKey: "fit-partial", colorToken: "fit.partial", label: "Partial fit" },
} as const;

function splitSentences(value: string): string[] {
  return value.replace(/\s+/g, " ").trim().match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((item) => item.trim()).filter(Boolean) ?? [];
}

function conciseSentences(value: string, maxSentences: number, maxChars: number) {
  const sentences = splitSentences(value).slice(0, maxSentences);
  const text = (sentences.length ? sentences.join(" ") : value.replace(/\s+/g, " ").trim()).slice(0, maxChars).trim();
  return text.replace(/[,:;–-]\s*$/, ".");
}

function normalizeItemText(value: string, fallback: string, maxChars: number) {
  const normalized = conciseSentences(value, 1, maxChars);
  return normalized || fallback;
}

function isNearDuplicate(a: string, b: string) {
  const normalize = (value: string) => new Set(value.toLowerCase().match(/[a-z0-9]{4,}|[\u0590-\u05ff]{3,}/g) ?? []);
  const left = normalize(a);
  const right = normalize(b);
  if (left.size === 0 || right.size === 0) return false;
  const overlap = [...left].filter((term) => right.has(term)).length;
  return overlap / Math.min(left.size, right.size) > 0.72;
}

export function composeReportUIPayload(input: {
  analysis: QualitativeReportAnalysis;
  roleDraft: RoleDraft;
  evidence: ApprovedEvidenceBundle;
  language: "he" | "en" | "mixed";
}): CompositionResult {
  const roleItems = getRoleAnalysisItems(input.roleDraft);
  const sourceById = new Map(input.evidence.sources.map((source) => [source.id, source]));
  const seenIndexes = new Set<number>();

  if (input.analysis.items.length === 0 || input.analysis.items.length > 5) {
    return { ok: false, diagnostic: "composition:item-count" };
  }

  const reportItems: ReportUIPayload["requirementMapping"]["items"] = [];

  for (const [position, analysisItem] of input.analysis.items.entries()) {
    const roleItem = roleItems[analysisItem.roleItemIndex];
    if (!roleItem || seenIndexes.has(analysisItem.roleItemIndex)) {
      return { ok: false, diagnostic: "composition:invalid-role-item-index" };
    }
    seenIndexes.add(analysisItem.roleItemIndex);

    const evidenceSourceIds = [...new Set(analysisItem.evidenceSourceIds)];
    if (evidenceSourceIds.some((sourceId) => !sourceById.has(sourceId))) {
      return { ok: false, diagnostic: "evidence:unapproved-source-id" };
    }

    const requiresEvidence = ["direct", "semantic", "transferable", "partial"].includes(analysisItem.matchType);
    if (requiresEvidence && evidenceSourceIds.length === 0) {
      return { ok: false, diagnostic: "evidence:positive-item-without-source" };
    }

    const displayLabel = normalizeItemText(analysisItem.displayLabel, roleItem.originalText, 64);
    const rawRationale = normalizeItemText(analysisItem.shortRationale, "Supported by approved evidence.", 150);
    const shortRationale = isNearDuplicate(displayLabel, rawRationale)
      ? normalizeItemText(roleItem.originalText, rawRationale, 150)
      : rawRationale;

    reportItems.push({
      itemId: `role-item-${position + 1}`,
      originalText: roleItem.originalText,
      displayLabel,
      source: roleItem.source,
      importance: analysisItem.importance,
      matchType: analysisItem.matchType,
      impact: analysisItem.impact,
      evidenceConfidence: analysisItem.evidenceConfidence,
      shortRationale,
      clusterIds: evidenceSourceIds.map((sourceId) => `evidence-${sourceId}`),
    });
  }

  const referencedSourceIds = [...new Set(input.analysis.items.flatMap((item) => item.evidenceSourceIds))];
  const clusters: ReportUIPayload["evidencePanel"]["clusters"] = referencedSourceIds.map((sourceId) => {
    const source = sourceById.get(sourceId)!;
    const supportedItems = reportItems.filter((item) => item.clusterIds.includes(`evidence-${sourceId}`));
    const summary = source.claim ?? [...new Set(supportedItems.map((item) => item.shortRationale))].slice(0, 2).join(" ");

    return {
      clusterId: `evidence-${sourceId}`,
      title: source.label,
      summary: conciseSentences(summary || `Approved evidence from ${source.label}.`, 2, 220),
      supportedItemIds: supportedItems.map((item) => item.itemId),
      evidenceIds: [sourceId],
      ...(source.project ? { project: { slug: source.project.slug, title: source.project.title } } : {}),
      destination: source.project
        ? source.project.anchorId
          ? {
            mode: "anchor" as const,
            href: `/experience/${source.project.slug}#${source.project.anchorId}`,
            anchorId: source.project.anchorId,
            dedupeKey: sourceId,
          }
          : {
              mode: "project-top" as const,
              href: `/experience/${source.project.slug}`,
              dedupeKey: sourceId,
            }
        : { mode: "no-link" as const, dedupeKey: sourceId },
      reliability: "high" as const,
    };
  });

  const strengths = reportItems.filter((item) => item.impact === "strength").slice(0, 5);
  const gaps = reportItems.filter((item) => item.impact === "gap").slice(0, 3);
  const language = input.language === "he" ? "he" : "en";
  const fitLevel = input.analysis.fitLevel;
  const overallFitVisual = fitLevel === "insufficient" || fitLevel === "out-of-scope"
    ? {
        mode: fitLevel,
        label: fitLevel === "insufficient" ? "Insufficient evidence" : "Outside the supported role scope",
        rationale: conciseSentences(input.analysis.fitRationale, 2, 260),
      }
    : {
        mode: "fit" as const,
        level: fitLevel,
        fitVisualValue: fitPresentation[fitLevel].value,
        illustrationKey: fitPresentation[fitLevel].illustrationKey,
        colorToken: fitPresentation[fitLevel].colorToken,
        label: fitPresentation[fitLevel].label,
        rationale: conciseSentences(input.analysis.fitRationale, 2, 260),
        ...(input.analysis.evidenceConfidence === "low" || input.analysis.evidenceConfidence === "insufficient"
          ? { qualifiers: ["evidence-limited" as const] }
          : {}),
      };

  const parsed = reportUIPayloadSchema.safeParse({
    schemaVersion: "1.0",
    reportId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    language,
    state: "ready",
    roleSnapshot: {
      company: input.roleDraft.company?.originalValue.trim() ?? "",
      title: input.roleDraft.title?.originalValue.trim() ?? "",
    },
    overallFitVisual,
    evidenceConfidence: {
      level: input.analysis.evidenceConfidence,
      rationale: conciseSentences(input.analysis.evidenceConfidenceRationale, 2, 220),
    },
    skillsMatch: {
      items: strengths,
      visualCoverage: { mode: "qualitative", label: input.analysis.skillsCoverageLabel },
    },
    requirementMapping: {
      items: reportItems,
      ...(reportItems[0] ? { defaultSelectedItemId: reportItems[0].itemId } : {}),
    },
    evidencePanel: {
      clusters,
      ...(clusters[0] ? { defaultClusterId: clusters[0].clusterId } : {}),
    },
    topStrengths: { items: strengths },
    keyGaps: { items: gaps },
    disclaimer: {
      copyKey: "report.disclaimer.v1",
      text: "This qualitative report is based on the submitted role description and approved portfolio evidence. It is not an ATS decision, does not replace human judgment, and the visual fit indicator is not a literal numeric score.",
    },
    contactCta: {
      variant: fitLevel,
      label: "Contact Shani",
      href: "/contact",
      enabled: true,
    },
  });

  if (!parsed.success) {
    const paths = parsed.error.issues.slice(0, 5).map((issue) => issue.path.join(".") || "root").join(",");
    return { ok: false, diagnostic: `schema:${paths}` };
  }

  return { ok: true, report: parsed.data };
}
