import { readFile } from "node:fs/promises";
import { join } from "node:path";

const canonicalRoot = join(process.cwd(), "PORTFOLIO_IMPLEMENTATION", "role-fit-agent", "docs", "canonical");

const sources = [
  { id: "cv", label: "CV knowledge", file: "CV_Knowledge.md", always: true },
  { id: "profile", label: "General profile knowledge", file: "General_Profile_Knowledge.md", always: true },
  { id: "big-red-button", label: "The Big Red Button case study", file: "Case_Study_Knowledge_The_Big_Red_Button.md", always: false },
  { id: "c4i", label: "C4I case study", file: "Case_Study_Knowledge_C4I.md", always: false },
  { id: "epd", label: "EPD case study", file: "Case_Study_Knowledge_EPD.md", always: false },
  { id: "howtool", label: "HOWTOOL case study", file: "Case_Study_Knowledge_HOWTOOL.md", always: false },
  { id: "monitoring", label: "Monitoring and Product Intelligence case study", file: "Case_Study_Knowledge_Monitoring_and_Product_Intelligence.md", always: false },
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

export async function loadApprovedEvidence(roleText: string) {
  const loaded = await Promise.all(
    sources.map(async (source) => {
      const content = await readFile(join(canonicalRoot, source.file), "utf8");
      return { ...source, content, score: relevance(roleText, content) };
    }),
  );

  return loaded
    .filter((source) => source.always || source.score > 0)
    .sort((a, b) => Number(b.always ?? false) - Number(a.always ?? false) || b.score - a.score)
    .slice(0, 5)
    .map((source) => `### APPROVED_SOURCE_ID: ${source.id}\nSource label: ${source.label}\n${source.content.slice(0, 10000)}`)
    .join("\n\n---\n\n");
}
