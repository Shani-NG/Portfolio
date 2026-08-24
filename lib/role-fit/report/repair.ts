import type { QualitativeReportAnalysis } from "../model/provider.ts";

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
