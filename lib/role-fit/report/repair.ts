import type { QualitativeReportAnalysis } from "../model/provider.ts";

const limitationMatchTypes = new Set<QualitativeReportAnalysis["items"][number]["matchType"]>([
  "partial",
  "insufficient-evidence",
  "real-gap",
]);

export function getDeterministicLimitationRepresentation(input: {
  analysis: QualitativeReportAnalysis;
  diagnostic: string;
}): readonly number[] | null {
  if (input.diagnostic !== "semantic:unrepresented-limitation") return null;

  const roleItemIndexes = input.analysis.items
    .filter((item) => limitationMatchTypes.has(item.matchType) && item.impact === "neutral")
    .map((item) => item.roleItemIndex);

  return roleItemIndexes.length > 0 ? roleItemIndexes : null;
}

export function shouldUseModelRepair(diagnostic: string) {
  return !diagnostic.startsWith("evidence:");
}

export function constrainRepairAnalysis(input: {
  original: QualitativeReportAnalysis;
  repaired: QualitativeReportAnalysis;
  diagnostic: string;
}): QualitativeReportAnalysis {
  if (!input.diagnostic.startsWith("evidence:")) return input.repaired;

  const repairedByRoleItem = new Map(input.repaired.items.map((item) => [item.roleItemIndex, item]));
  return {
    ...input.original,
    items: input.original.items.map((item) => ({
      ...item,
      evidenceSourceIds: repairedByRoleItem.get(item.roleItemIndex)?.evidenceSourceIds ?? item.evidenceSourceIds,
    })),
  };
}
