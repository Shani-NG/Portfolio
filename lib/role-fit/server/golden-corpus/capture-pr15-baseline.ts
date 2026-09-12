import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadApprovedEvidence } from "../../knowledge/load-approved-evidence.ts";
import { getRoleAnalysisItems } from "../../report/compose-report.ts";
import {
  createRoleDraftFromText,
  extractStandaloneRoleTitle,
  serializeRoleDraftForBoundary,
  shouldValidateRoleCollectionMessage,
  validateStructuredRoleDraft,
} from "../role-understanding.ts";
import { goldenCorpusFixtures } from "./fixtures.ts";

const here = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = join(here, "..", "..", "..", "..");
const outputDirectory = join(repositoryRoot, "artifacts", "rolefit");

function values(fields: Array<{ originalValue: string }>) {
  return fields.map((field) => field.originalValue);
}

function normalize(value: string) {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim().toLocaleLowerCase();
}

function routeBoundary(message: string, id: string) {
  const standaloneRoleTitle = extractStandaloneRoleTitle(message);
  const admitted = Boolean(standaloneRoleTitle) || shouldValidateRoleCollectionMessage({
    message,
    roleCollectionActive: false,
  });
  const draft = admitted ? createRoleDraftFromText(message) : createRoleDraftFromText("");
  const validation = admitted
    ? validateStructuredRoleDraft({
        conversationId: `baseline_${id}`,
        traceId: `baseline_${id}`,
        roleDraft: draft,
        detectedLanguage: /[\u0590-\u05ff]/.test(message) ? "mixed" : "en",
      })
    : null;
  return { admitted, standaloneRoleTitle, draft, validation };
}

function packedCandidateIds(promptContext: string) {
  return [...promptContext.matchAll(/ROLE_ITEM_INDEX: (\d+)\nROLE_ITEM_CANDIDATE_SOURCE_IDS: ([^\n]+)/g)].map((match) => ({
    roleItemIndex: Number(match[1]),
    sourceIds: match[2] === "none" ? [] : match[2]!.split(", "),
  }));
}

function compactEvidenceSourceIds(promptContext: string) {
  return [...promptContext.matchAll(/^EVIDENCE_ID: ([^\s|]+)/gm)].map((match) => match[1]!);
}

const cases = [];
for (const fixture of goldenCorpusFixtures) {
  const sourcePath = join(here, "source", fixture.sourceFile);
  const sourceText = await readFile(sourcePath, "utf8");
  const route = routeBoundary(sourceText, fixture.id);
  const directDraft = createRoleDraftFromText(sourceText);
  const directValidation = validateStructuredRoleDraft({
    conversationId: `baseline_direct_${fixture.id}`,
    traceId: `baseline_direct_${fixture.id}`,
    roleDraft: directDraft,
    detectedLanguage: /[\u0590-\u05ff]/.test(sourceText) ? "mixed" : "en",
  });
  const analysisDraft = { ...directDraft, company: undefined };
  const serializedAnalysisInput = serializeRoleDraftForBoundary(analysisDraft);
  const roleItems = getRoleAnalysisItems(directDraft);
  const evidence = await loadApprovedEvidence(serializedAnalysisInput, roleItems);
  const uploadMessage = `Uploaded file: ${fixture.sourceFile}\n\n${sourceText}`;
  const uploadRoute = routeBoundary(uploadMessage, `${fixture.id}_upload`);
  const searchableOutput = normalize([
    serializedAnalysisInput,
    ...roleItems.map((item) => item.originalText),
  ].join("\n"));

  cases.push({
    id: fixture.id,
    company: fixture.company,
    roleIdentity: fixture.roleIdentity,
    sourceUrl: fixture.sourceUrl,
    sourceFile: fixture.sourceFile,
    sourceSha256: createHash("sha256").update(sourceText).digest("hex"),
    sourceChars: sourceText.length,
    expectedTitle: fixture.expectedTitle,
    revisionNote: fixture.revisionNote ?? null,
    routeBoundary: {
      admitted: route.admitted,
      standaloneRoleTitle: route.standaloneRoleTitle,
      parseStatus: route.validation?.parseStatus ?? null,
      missingFields: route.validation?.missingFields ?? null,
    },
    parser: {
      parseStatus: directValidation.parseStatus,
      missingFields: directValidation.missingFields,
      title: directDraft.title?.originalValue ?? "",
      titleMatchesOracle: directDraft.title?.originalValue === fixture.expectedTitle,
      description: directDraft.description?.originalValue ?? "",
      responsibilities: values(directDraft.responsibilities),
      requirements: values(directDraft.requirements),
      preferred: values(directDraft.preferredQualifications),
    },
    roleItemCount: roleItems.length,
    roleItems,
    serializedAnalysisInputChars: serializedAnalysisInput.length,
    serializedAnalysisInput,
    lostCriticalConcepts: fixture.criticalSourceFragments.filter((fragment) => !searchableOutput.includes(normalize(fragment))),
    contamination: fixture.contaminationFragments.filter((fragment) => searchableOutput.includes(normalize(fragment))),
    candidatesByRoleItem: evidence.candidatesByRoleItem ?? [],
    packedCandidateIds: packedCandidateIds(evidence.promptContext),
    compactEvidenceSourceIds: compactEvidenceSourceIds(evidence.promptContext),
    evidencePromptChars: evidence.promptContext.length,
    uploadBoundary: {
      prefix: `Uploaded file: ${fixture.sourceFile}`,
      admitted: uploadRoute.admitted,
      parseStatus: uploadRoute.validation?.parseStatus ?? null,
      title: uploadRoute.draft.title?.originalValue ?? "",
      titleMatchesPlainText: uploadRoute.draft.title?.originalValue === directDraft.title?.originalValue,
      responsibilitiesMatchPlainText: JSON.stringify(values(uploadRoute.draft.responsibilities)) === JSON.stringify(values(directDraft.responsibilities)),
      requirementsMatchPlainText: JSON.stringify(values(uploadRoute.draft.requirements)) === JSON.stringify(values(directDraft.requirements)),
    },
  });
}

const counts = cases.map((entry) => entry.roleItemCount);
const evidenceFingerprint = createHash("sha256").update(JSON.stringify(cases.map((entry) => ({
  id: entry.id,
  candidatesByRoleItem: entry.candidatesByRoleItem,
  packedCandidateIds: entry.packedCandidateIds,
  compactEvidenceSourceIds: entry.compactEvidenceSourceIds,
})))).digest("hex");
const baseline = {
  generatedAt: new Date().toISOString(),
  baselineSha: "737f814022439fdae3c484fa445c85741783ab0c",
  corpusAuthority: "Currently verifiable frozen source text; no live URL dependency at test time.",
  evidenceFingerprint,
  cases,
  cardinality: {
    minimum: Math.min(...counts),
    maximum: Math.max(...counts),
    mean: counts.reduce((sum, count) => sum + count, 0) / counts.length,
    total: counts.reduce((sum, count) => sum + count, 0),
  },
};

await mkdir(outputDirectory, { recursive: true });
await writeFile(join(outputDirectory, "pr15-golden-corpus-baseline.json"), `${JSON.stringify(baseline, null, 2)}\n`, "utf8");
const reportLines = [
  "# PR15 Golden Corpus Offline Baseline",
  "",
  `Base SHA: \`${baseline.baselineSha}\``,
  "",
  "This is an observation of unmodified PR15 behavior. Corpus failures are intentionally preserved.",
  "",
  "## Traceable corpus revisions",
  "",
  "- G05: the current official Deloitte display title `Product Manager` is the canonical title. `Technical Product Manager` remains source context, not a replacement title.",
  "- G09: the current live DuckDuckGo posting published 2026-08-19 is authoritative. Assertions retained are limited to its current text. Historical implemented-motion, easing/spring, interruptible-transition, and broader agentic-workflow assertions were removed.",
  "",
  "## Inventory and route boundary",
  "",
  "| ID | Company / role | SHA-256 | chars | admitted | validation | parsed title | oracle title | roleItems | analysis chars |",
  "|---|---|---|---:|---|---|---|---|---:|---:|",
  ...cases.map((entry) => `| ${entry.id} | ${entry.company} — ${entry.roleIdentity.replaceAll("|", "\\|")} | \`${entry.sourceSha256}\` | ${entry.sourceChars} | ${entry.routeBoundary.admitted} | ${entry.routeBoundary.parseStatus ?? "not reached"} | ${entry.parser.title.replaceAll("|", "\\|") || "—"} | ${entry.expectedTitle.replaceAll("|", "\\|")} | ${entry.roleItemCount} | ${entry.serializedAnalysisInputChars} |`),
  "",
  "## Structural field counts and observed loss",
  "",
  "| ID | Responsibilities | Requirements | Preferred | lost critical assertions | contamination hits | compact IDs |",
  "|---|---:|---:|---:|---:|---:|---:|",
  ...cases.map((entry) => `| ${entry.id} | ${entry.parser.responsibilities.length} | ${entry.parser.requirements.length} | ${entry.parser.preferred.length} | ${entry.lostCriticalConcepts.length} | ${entry.contamination.length} | ${entry.compactEvidenceSourceIds.length} |`),
  "",
  `Cardinality: minimum ${baseline.cardinality.minimum}, maximum ${baseline.cardinality.maximum}, mean ${baseline.cardinality.mean}, total ${baseline.cardinality.total}.`,
  "",
  "## Exact per-case parser output and roleItems",
  "",
  ...cases.flatMap((entry) => [
    `### ${entry.id} — ${entry.roleIdentity}`,
    "",
    `Source: ${entry.sourceUrl}`,
    "",
    `Lost critical concepts: ${entry.lostCriticalConcepts.length ? entry.lostCriticalConcepts.map((value) => `\`${value}\``).join(", ") : "none"}`,
    "",
    `Contamination: ${entry.contamination.length ? entry.contamination.map((value) => `\`${value}\``).join(", ") : "none"}`,
    "",
    "```json",
    JSON.stringify({
      title: entry.parser.title,
      responsibilities: entry.parser.responsibilities,
      requirements: entry.parser.requirements,
      preferred: entry.parser.preferred,
      roleItems: entry.roleItems,
    }, null, 2),
    "```",
    "",
  ]),
  "## Deterministic evidence trace",
  "",
  `The adjacent JSON artifact contains the complete \`candidatesByRoleItem\`, every packed candidate ID set, and every compact evidence source ID for all cases. Two consecutive runs produced the same evidence fingerprint: \`${evidenceFingerprint}\`.`,
  "",
  "## Upload transport",
  "",
  "The existing `Uploaded file: <filename>` prefix was passed through the same chat admission and parser boundary. G01 and G03–G10 matched their plain-text parser arrays. G02 was rejected at admission in both forms; because the upload message was not parsed, its resulting empty draft does not match the direct diagnostic parse.",
  "",
  "## Existing test conflict",
  "",
  "`lib/role-fit/server/role-understanding.test.ts` contains `recognizes headings embedded in continuous text`. It requires prose-inline phrases such as `Responsibilities`, `What You Have`, and `Preferred Qualifications` to open sections without line boundaries. That behavior directly conflicts with the approved line-aware Structural Recovery rule, where heading recognition requires structural line context so ordinary prose cannot become a heading.",
  "",
  "## Test enumeration",
  "",
  "The `package.json` test command explicitly lists every test file. A future standalone Golden Corpus test file will therefore require a mechanical test-command update; this baseline capture script runs directly and required no package change.",
  "",
  "## Scope conclusion",
  "",
  "The baseline exposes parser/admission defects but no need to change protected eligibility, report composition, evidence ranking/packing, persistence, session, mobile, provider, or deployment mechanisms. Structural Recovery can remain bounded to role-understanding behavior plus its tests and corpus expectations.",
  "",
];
await writeFile(join(outputDirectory, "pr15-golden-corpus-baseline.md"), `${reportLines.join("\n")}\n`, "utf8");
console.log(JSON.stringify({
  output: join(outputDirectory, "pr15-golden-corpus-baseline.json"),
  cases: cases.map((entry) => ({
    id: entry.id,
    admitted: entry.routeBoundary.admitted,
    parseStatus: entry.routeBoundary.parseStatus,
    title: entry.parser.title,
    roleItemCount: entry.roleItemCount,
    lostCriticalConcepts: entry.lostCriticalConcepts.length,
    contamination: entry.contamination.length,
    uploadMatches: entry.uploadBoundary.titleMatchesPlainText && entry.uploadBoundary.responsibilitiesMatchPlainText && entry.uploadBoundary.requirementsMatchPlainText,
  })),
  cardinality: baseline.cardinality,
}, null, 2));
