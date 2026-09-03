import { createRoleValidationResult } from "./eligibility.ts";
import type { RoleValidationResult } from "../contracts/index.ts";
import { findLexiconMatches, getRoleFitLexiconEntries, normalizeLexiconText } from "../lexicon.ts";

type RoleSectionKind = "description" | "responsibilities" | "requirements" | "preferred";
export type RoleClarificationField = "company" | "title" | "responsibilities" | "requirements";
export type RoleCorrection = { field: RoleClarificationField; value: string };
export type StructuredRoleDraft = RoleValidationResult["roleDraft"];

const roleSectionHeadings: Array<{ kind: RoleSectionKind; labels: string[] }> = [
  { kind: "description", labels: ["About the job", "About the role", "Job description", "The opportunity", "Overview", "תיאור המשרה", "על התפקיד"] },
  { kind: "responsibilities", labels: ["What You'll Do", "What You Will Do", "Responsibilities", "Key Responsibilities", "Your Responsibilities", "The Role", "תחומי אחריות", "אחריות", "מה תעשו", "מה תעשי"] },
  {
    kind: "requirements",
    labels: ["Requirements", "What We're Looking For", "What You Have", "Qualifications", "Required Qualifications", "Key Qualifications", "Must Have", "Skills", "דרישות", "כישורים נדרשים", "מה אנחנו מחפשים"],
  },
  { kind: "preferred", labels: ["Nice to Have", "Preferred Qualifications", "Bonus Points", "Preferred", "יתרון", "כישורים מועדפים"] },
];

const normalizedHeadingEntries = roleSectionHeadings.flatMap((section) =>
  section.labels.flatMap((label) => [
    { kind: section.kind, label },
    { kind: section.kind, label: label.replaceAll("'", "’") },
  ]),
);

const headingPattern = new RegExp(
  normalizedHeadingEntries
    .map(({ label }) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .sort((a, b) => b.length - a.length)
    .join("|"),
  "gi",
);

function roleField<T extends string | number>(
  originalValue: T,
  sourceId: string,
  options: { kind?: "user-text" | "uploaded-file" | "clarification"; confidence?: "high" | "medium" | "low" } = {},
) {
  return {
    originalValue,
    sourceRef: {
      sourceId,
      kind: options.kind ?? "user-text" as const,
    },
    confidence: options.confidence ?? "medium" as const,
    confirmed: Boolean(String(originalValue).trim()),
  };
}

function normalizeRoleText(roleText: string) {
  return roleText
    .replaceAll("â€™", "'")
    .replaceAll("’", "'")
    .replaceAll("â€“", "-")
    .replaceAll("â€”", "-")
    .replaceAll("•", "\n")
    .replaceAll("·", "\n");
}

function extractSection(roleText: string, labels: string[]): string {
  const lines = normalizeRoleText(roleText).split(/\r?\n/).map((line) => line.trim());

  for (const label of labels) {
    const variants = [label, label.replaceAll("'", "’")].map((value) => value.toLowerCase());
    const match = lines.find((line) => variants.some((variant) => line.toLowerCase().startsWith(`${variant}:`)));
    if (match) return match.slice(match.indexOf(":") + 1).trim();
  }

  return "";
}

function extractSectionBlocks(roleText: string): Record<RoleSectionKind, string[]> {
  const normalizedText = normalizeRoleText(roleText);
  const matches = Array.from(normalizedText.matchAll(headingPattern));
  const blocks: Record<RoleSectionKind, string[]> = {
    description: [],
    responsibilities: [],
    requirements: [],
    preferred: [],
  };

  matches.forEach((match, index) => {
    const heading = normalizedHeadingEntries.find(({ label }) => label.toLowerCase() === match[0].toLowerCase());
    if (!heading || match.index === undefined) return;

    const blockStart = match.index + match[0].length;
    const blockEnd = matches[index + 1]?.index ?? normalizedText.length;
    const block = normalizedText.slice(blockStart, blockEnd).replace(/^[\s:.-]+/, "").trim();
    if (block) blocks[heading.kind].push(block);
  });

  return blocks;
}

function splitBlockItems(block: string): string[] {
  return block
    .split(/\r?\n|;|(?=\s[-*]\s)|(?=\s\d+[.)]\s)/)
    .map((item) => item.replace(/^\s*(?:[-*]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}

function extractList(roleText: string, labels: string[]): string[] {
  const value = extractSection(roleText, labels);
  if (!value) return [];

  return splitBlockItems(value);
}

function inferListBySignals(roleText: string, signals: RegExp[]): string[] {
  return splitBlockItems(normalizeRoleText(roleText))
    .filter((item) => item.length >= 18)
    .filter((item) => !/^(?:job title|title|role|תפקיד|שם המשרה)\s*:/i.test(item))
    .filter((item) => signals.some((signal) => signal.test(item)));
}

const roleTitleSignal = /\b(ux|ui|user experience|product|design(?:er)?|research(?:er)?|strateg(?:y|ist)|manager|management|lead|director|head|vice president|vp|chief|engineer|developer|architect|analyst|specialist|consultant|coordinator|innovation|implementation|operations)\b/i;
const setupInstructionSignal = /\b(upload|paste|provide|send|share|attach|going to|want to|would like to|job description|role details)\b/i;
const hebrewSetupInstructionSignal = /^(?:אני|היי|שלום|רוצה|אפשר|צריך|צריכה|תודה)\b/;
const conversationalQuestionSignal = /^(?:what|how|why|who|where|when|which|can|could|would|should|do|does|did|is|are|tell me|explain)\b/i;
const hebrewConversationalQuestionSignal = /^(?:מה|איך|למה|מי|איפה|מתי|האם|איזה|איזו|אפשר|תוכלי|את יכולה|ספרי|הסבירי|תסבירי)(?:\s|$)/;
const hebrewRoleTitleSignal = /(?:^|\s)(?:מנהל(?:ת|[-־]ת)?|מעצב(?:ת|[-־]ת)?|חוקר(?:ת|[-־]ת)?|אסטרטג(?:ית|[-־]ית)?|מוביל(?:ת|[-־]ה)?|ראש(?:ת|[-־]ת)?|מהנדס(?:ת|[-־]ת)?|מפתח(?:ת|[-־]ת)?|אנליסט(?:ית|[-־]ית)?|יועץ(?:[-־]ת)?|יועצת|רכז(?:ת|[-־]ת)?|ארכיטקט(?:ית|[-־]ית)?|מומחה(?:[-־]ית)?|מומחית|דירקטור(?:ית|[-־]ית)?|סמנכ["״]ל)(?:\s|$)/;
const standaloneTitleLabel = /^(?:job title|title|role|שם המשרה|תפקיד)\s*:\s*(.+)$/i;
const roleFieldLabelSignal = /^(?:company|organization|title|job title|role|description|responsibilities|requirements|qualifications|skills|location|job location|חברה|ארגון|תפקיד|שם המשרה|תיאור|תיאור המשרה|תחומי אחריות|אחריות|דרישות|כישורים נדרשים)\s*:/i;
const priorTitleReferenceSignal = /(?:שם\s+המשרה|הכותרת|התפקיד).{0,50}(?:כתוב|כתובה|הופיע|הופיעה|נמצא|נמצאת|שורה\s+ראשונה|למעלה|בהתחלה)|(?:כתוב|כתובה|הופיע|הופיעה|נמצא|נמצאת).{0,50}(?:שורה\s+ראשונה|למעלה|בהתחלה)|\b(?:title|role)\b.{0,50}\b(?:first line|above|previous|already|pasted)\b|\b(?:first line|above|previous|already pasted)\b.{0,50}\b(?:title|role)\b/i;
const embeddedUrlSignal = /(?:https?:\/\/|www\.)\S+/i;
const promotionalMediaTitleSignal = /\b(?:sneak\s+(?:peek|peak)|watch|learn\s+more|visit|click\s+here|our\s+product)\b/i;

function hasStrongTitleLexiconMatch(value: string) {
  return findLexiconMatches({ text: value, language: "mixed" })
    .some((match) => match.entry.kind === "title_family" && match.matched_by !== "keyword");
}

export function isPlausibleRoleTitle(value: string): boolean {
  const title = value.trim();
  const words = title.split(/\s+/);

  if (!title || title.length > 100 || words.length > 12) return false;
  if (/[.!?]$/.test(title) || setupInstructionSignal.test(title)) return false;
  if (/^(about|company|organization|description|responsibilities|requirements|qualifications|skills)\s*:/i.test(title)) return false;

  return roleTitleSignal.test(title) || hebrewRoleTitleSignal.test(title) || hasStrongTitleLexiconMatch(title);
}

function isTrustworthyUnlabeledTitleCandidate(value: string) {
  return !embeddedUrlSignal.test(value) && !promotionalMediaTitleSignal.test(value);
}

export function extractStandaloneRoleTitle(value: string): string | null {
  const input = value.trim();
  if (!input || input.includes("\n") || input.length > 100) return null;

  const labeledTitle = input.match(standaloneTitleLabel)?.[1]?.trim();
  const title = labeledTitle ?? input;
  if (!title || conversationalQuestionSignal.test(title) || hebrewConversationalQuestionSignal.test(title) || !isPlausibleRoleTitle(title)) return null;

  if (labeledTitle || roleTitleSignal.test(title) || hebrewRoleTitleSignal.test(title)) {
    return normalizeRoleTitleClarification(title);
  }

  return null;
}

function isKnownSectionHeading(value: string) {
  const normalized = value.trim().replace(/[:.]+$/, "").toLowerCase();
  return normalizedHeadingEntries.some(({ label }) => label.toLowerCase() === normalized);
}

function startsWithPlausibleTitleBeforeHeading(value: string) {
  const normalized = normalizeRoleText(value);
  const firstHeadingIndex = normalized.search(headingPattern);
  if (firstHeadingIndex <= 0) return false;
  return isPlausibleRoleTitle(normalized.slice(0, firstHeadingIndex).trim());
}

function isRoleBoundaryLine(value: string) {
  const line = value.trim();
  return roleFieldLabelSignal.test(line) || isKnownSectionHeading(line) || isPlausibleRoleTitle(line) || startsWithPlausibleTitleBeforeHeading(line);
}

export function extractRoleContent(message: string): string {
  const normalized = normalizeRoleText(message).trim();
  if (!normalized) return "";

  const lines = normalized.split(/\r?\n/);
  const firstRoleLine = lines.findIndex(isRoleBoundaryLine);
  if (firstRoleLine < 0) return normalized;
  return lines.slice(firstRoleLine).join("\n").trim();
}

function inferSemanticTitle(roleText: string): string {
  const titleEntries = getRoleFitLexiconEntries().filter((entry) => entry.kind === "title_family");
  const normalizedRoleText = normalizeLexiconText(roleText);
  const scored = titleEntries.map((entry) => {
    const keywordHits = entry.keywords.filter((term) => normalizedRoleText.includes(normalizeLexiconText(term))).length;
    const contextHits = entry.context_signals.filter((term) => normalizedRoleText.includes(normalizeLexiconText(term))).length;
    return { entry, keywordHits, contextHits, score: keywordHits * 2 + contextHits };
  }).filter(({ keywordHits, contextHits, score }) => score >= 5 && (keywordHits >= 3 || (keywordHits >= 1 && contextHits >= 2)))
    .sort((left, right) => right.score - left.score || left.entry.id.localeCompare(right.entry.id));

  const best = scored[0];
  const next = scored.find((candidate) => candidate.entry.concept_id !== best?.entry.concept_id);
  if (!best || (next && best.score - next.score < 4)) return "";
  return best.entry.preferred_label;
}

function inferTitle(roleText: string): { value: string; confidence: "high" | "medium" | "low" } {
  const labeledTitle = extractSection(roleText, ["title", "role", "תפקיד", "שם המשרה"]);
  if (labeledTitle) return { value: labeledTitle, confidence: "high" };

  const normalizedText = normalizeRoleText(roleText);
  const firstHeadingIndex = normalizedText.search(headingPattern);
  const titleSource = firstHeadingIndex >= 0 ? normalizedText.slice(0, firstHeadingIndex) : normalizedText;
  const inferredTitle = titleSource
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) =>
      line &&
      !line.startsWith("http") &&
      !line.includes("applicants") &&
      !line.includes("District") &&
      isTrustworthyUnlabeledTitleCandidate(line) &&
      isPlausibleRoleTitle(line),
    );

  if (inferredTitle) return { value: inferredTitle, confidence: "medium" };
  const rejectedPromotionalCandidate = titleSource
    .split(/\r?\n/)
    .map((line) => line.trim())
    .some((line) => line && isPlausibleRoleTitle(line) && !isTrustworthyUnlabeledTitleCandidate(line));
  if (rejectedPromotionalCandidate) return { value: "", confidence: "medium" };
  const semanticTitle = inferSemanticTitle(roleText);
  return { value: semanticTitle, confidence: semanticTitle ? "low" : "medium" };
}

const genericRoleTitles = new Map([
  ["ux", "UX Position"],
  ["strategy", "Strategy Position"],
  ["innovation", "Innovation Position"],
  ["ai", "AI Position"],
]);

export function isNoRoleTitleAnswer(value: string): boolean {
  return /^(?:no|none|no title|there is no title|it has no title|unknown|not specified)$/i.test(value.trim())
    || /^(?:אין|אין שם|אין כותרת|אין שם משרה|לא צוין|לא ידוע)$/.test(value.trim());
}

export function referencesPreviouslyProvidedTitle(value: string): boolean {
  return priorTitleReferenceSignal.test(value.trim());
}

export function normalizeRoleTitleClarification(value: string): string {
  return genericRoleTitles.get(value.trim().toLowerCase()) ?? value.trim();
}

export function isValidRoleClarificationAnswer(field: RoleClarificationField, value: string): boolean {
  const answer = value.trim();
  if (!answer || answer.length > 1000) return false;
  if (field === "title") return isPlausibleRoleTitle(normalizeRoleTitleClarification(answer));
  if (field === "company") return answer.length <= 120 && !/[.!?]\s/.test(answer);
  return answer.length >= 8;
}

export function detectRoleCorrection(message: string): RoleCorrection | null {
  const english = message.match(/\b(?:actually|correction|change|update|instead)\b[^\n]{0,50}?\b(title|role|company|responsibilities|requirements)\b\s*(?:is|to|:)?\s+(.+)/i);
  if (english) {
    const field = english[1].toLowerCase() === "role"
      ? "title"
      : (english[1].toLowerCase() as RoleClarificationField);
    const value = english[2].trim().replace(/[.!?]+$/, "");
    return value ? { field, value } : null;
  }

  const hebrew = message.match(/(?:בעצם|תיקון|שינוי)[^\n]{0,50}?(שם המשרה|התפקיד|החברה|האחריות|הדרישות)\s*(?:הוא|היא|ל|:)?\s+(.+)/);
  if (!hebrew) return null;

  const fieldByLabel: Record<string, RoleClarificationField> = {
    "שם המשרה": "title",
    "התפקיד": "title",
    "החברה": "company",
    "האחריות": "responsibilities",
    "הדרישות": "requirements",
  };
  const value = hebrew[2].trim().replace(/[.!?]+$/, "");
  return value ? { field: fieldByLabel[hebrew[1]], value } : null;
}

function nonEmptyField<T extends { originalValue: string | number }>(field: T | undefined) {
  return field && String(field.originalValue).trim() ? field : undefined;
}

function mergeRoleFieldLists<T extends { originalValue: string }>(current: T[], incoming: T[]) {
  const seen = new Set<string>();
  return [...current, ...incoming].filter((field) => {
    const key = field.originalValue.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function createEmptyRoleDraft(): StructuredRoleDraft {
  return { responsibilities: [], requirements: [], preferredQualifications: [] };
}

export function hasRoleDraftContent(
  roleDraft: StructuredRoleDraft | null | undefined,
): roleDraft is StructuredRoleDraft {
  if (!roleDraft) return false;
  return Boolean(
    nonEmptyField(roleDraft.company)
    || nonEmptyField(roleDraft.title)
    || nonEmptyField(roleDraft.description)
    || roleDraft.responsibilities.length
    || roleDraft.requirements.length
    || roleDraft.preferredQualifications.length,
  );
}

function isCompleteDraft(roleDraft: StructuredRoleDraft) {
  return Boolean(nonEmptyField(roleDraft.title) && roleDraft.responsibilities.length && roleDraft.requirements.length);
}

export function mergeStructuredRoleDraft(
  current: StructuredRoleDraft | null | undefined,
  incoming: StructuredRoleDraft,
  options: { replaceCompleteRole?: boolean } = {},
): StructuredRoleDraft {
  if (!current || !hasRoleDraftContent(current)) return incoming;
  if (options.replaceCompleteRole && isCompleteDraft(incoming)) return incoming;

  return {
    company: nonEmptyField(incoming.company) ?? current.company,
    title: nonEmptyField(incoming.title) ?? current.title,
    description: nonEmptyField(incoming.description) ?? current.description,
    responsibilities: mergeRoleFieldLists(current.responsibilities, incoming.responsibilities),
    requirements: mergeRoleFieldLists(current.requirements, incoming.requirements),
    preferredQualifications: mergeRoleFieldLists(current.preferredQualifications, incoming.preferredQualifications),
    seniority: nonEmptyField(incoming.seniority) ?? current.seniority,
    yearsOfExperience: incoming.yearsOfExperience ?? current.yearsOfExperience,
    location: nonEmptyField(incoming.location) ?? current.location,
    workModel: nonEmptyField(incoming.workModel) ?? current.workModel,
    employmentType: nonEmptyField(incoming.employmentType) ?? current.employmentType,
  };
}

export function mergeRoleDraftClarification(
  roleDraft: StructuredRoleDraft | null | undefined,
  field: RoleClarificationField,
  value: string,
): StructuredRoleDraft {
  const next = roleDraft ?? createEmptyRoleDraft();
  const normalizedValue = field === "title" ? normalizeRoleTitleClarification(value) : value.trim();
  const fieldValue = roleField(normalizedValue, `role_clarification_${field}`, { kind: "clarification", confidence: "high" });

  if (field === "responsibilities" || field === "requirements") {
    return { ...next, [field]: mergeRoleFieldLists(next[field], [fieldValue]) };
  }
  return { ...next, [field]: fieldValue };
}

export function applyRoleDraftCorrection(roleDraft: StructuredRoleDraft, correction: RoleCorrection) {
  return mergeRoleDraftClarification(roleDraft, correction.field, correction.value);
}

export function serializeRoleDraftForBoundary(roleDraft: StructuredRoleDraft): string {
  const lines = [
    nonEmptyField(roleDraft.company) ? `Company: ${roleDraft.company!.originalValue}` : "",
    nonEmptyField(roleDraft.title) ? `Title: ${roleDraft.title!.originalValue}` : "",
    nonEmptyField(roleDraft.description) ? `Description: ${roleDraft.description!.originalValue}` : "",
    roleDraft.responsibilities.length ? `Responsibilities:\n${roleDraft.responsibilities.map((item) => `- ${item.originalValue}`).join("\n")}` : "",
    roleDraft.requirements.length ? `Requirements:\n${roleDraft.requirements.map((item) => `- ${item.originalValue}`).join("\n")}` : "",
    roleDraft.preferredQualifications.length ? `Preferred Qualifications:\n${roleDraft.preferredQualifications.map((item) => `- ${item.originalValue}`).join("\n")}` : "",
    roleDraft.yearsOfExperience ? `Years of experience: ${roleDraft.yearsOfExperience.originalValue}` : "",
    nonEmptyField(roleDraft.location) ? `Location: ${roleDraft.location!.originalValue}` : "",
    nonEmptyField(roleDraft.workModel) ? `Work model: ${roleDraft.workModel!.originalValue}` : "",
  ].filter(Boolean);
  return lines.join("\n").trim();
}

export function resolveEnglishReportTitle(canonicalRoleTitle: string): string {
  const title = canonicalRoleTitle.trim();
  if (!/[\u0590-\u05ff]/.test(title)) return title;

  const match = findLexiconMatches({ text: title, language: "he" })
    .find((candidate) => candidate.entry.kind === "title_family");
  const englishEntry = match
    ? getRoleFitLexiconEntries().find((entry) => entry.language === "en" && entry.kind === "title_family" && entry.concept_id === match.entry.concept_id)
    : undefined;

  let baseTitle = englishEntry?.preferred_label ?? "";
  if (/דירקטור/.test(title)) {
    baseTitle = /ux\s*[/\\-]?\s*ui/i.test(title) ? "Director of UX/UI" : `Director of ${baseTitle || "Product Experience"}`;
  } else if (/מנהל(?:ת)?/.test(title)) {
    baseTitle = englishEntry?.aliases.find((alias) => /manager/i.test(alias)) ?? baseTitle;
  } else if (/ראש/.test(title)) {
    baseTitle = englishEntry?.aliases.find((alias) => /head/i.test(alias)) ?? baseTitle;
  } else if (/מוביל(?:ת)?/.test(title)) {
    baseTitle = englishEntry?.aliases.find((alias) => /lead/i.test(alias)) ?? baseTitle;
  }

  if (!baseTitle) {
    const domain = /ux\s*[/\\-]?\s*ui/i.test(title)
      ? "UX/UI"
      : /(?:חוויית משתמש|ux)/i.test(title)
        ? "UX"
        : /חדשנות/.test(title)
          ? "Innovation"
          : /מוצר/.test(title)
            ? /ai/i.test(title) ? "AI Product" : "Product"
            : /(?:הטמעה|יישום).{0,12}ai|ai.{0,12}(?:הטמעה|יישום)/i.test(title)
              ? "AI Implementation"
              : /ai/i.test(title)
                ? "AI"
                : /דיגיטל/.test(title)
                  ? "Digital"
                  : /תוכנית|תכנית/.test(title)
                    ? "Program"
                    : "";
    const roleNoun = /דירקטור/.test(title)
      ? "Director"
      : /מנהל(?:ת)?/.test(title)
        ? "Manager"
        : /(?:מוביל|ראש)/.test(title)
          ? "Lead"
          : /אסטרטג/.test(title)
            ? "Strategist"
            : /מעצב/.test(title)
              ? "Designer"
              : /חוקר/.test(title)
                ? "Researcher"
                : /יוע(?:ץ|צת)/.test(title)
                  ? "Consultant"
                  : /אנליסט/.test(title)
                    ? "Analyst"
                    : /ארכיטקט/.test(title)
                      ? "Architect"
                      : /מומח/.test(title)
                        ? "Specialist"
                        : /מהנדס/.test(title)
                          ? "Engineer"
                          : /מפתח/.test(title)
                            ? "Developer"
                            : /רכז/.test(title)
                              ? "Coordinator"
                              : "Role";
    baseTitle = [domain, roleNoun].filter(Boolean).join(" ");
  }

  const hasSeniorMarker = /בכיר(?:ה|ים|ות)?/.test(title);
  return hasSeniorMarker && !/^senior\b/i.test(baseTitle) ? `Senior ${baseTitle}` : baseTitle;
}

function inferCompany(roleText: string): string {
  const labeledCompany = extractSection(roleText, ["company", "organization", "חברה", "ארגון"]);
  if (labeledCompany) return labeledCompany;

  const match = roleText.match(/\b([A-Z][A-Z0-9&.-]{1,})\s+is looking\b/);
  return match?.[1] ?? "";
}

function inferYearsOfExperience(roleText: string): number | undefined {
  const normalizedText = normalizeRoleText(roleText);
  const patterns = [
    /\b(?:minimum|min\.?|at least|required)?\s*(\d{1,2})\s*\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:relevant\s+)?experience\b/i,
    /\bexperience\s*(?:of|:)?\s*(?:(?:at least|minimum|min\.?)\s*)?(\d{1,2})\s*\+?\s*(?:years?|yrs?)\b/i,
    /\b(\d{1,2})\s*\+?\s*(?:years?|yrs?)\s+(?:in|working with)\b/i,
  ];

  for (const pattern of patterns) {
    const years = Number(normalizedText.match(pattern)?.[1]);
    if (Number.isInteger(years) && years > 0 && years <= 50) return years;
  }

  return undefined;
}

function inferLocation(roleText: string): string {
  return extractSection(roleText, ["location", "job location"])
    .replace(/\s*[\[(].*\b(?:hybrid|remote|on[ -]?site|in[ -]?office)\b.*$/i, "")
    .trim();
}

function inferWorkModel(roleText: string): string {
  const match = normalizeRoleText(roleText).match(/\b(hybrid|remote|on[ -]?site|in[ -]?office)\b/i)?.[1]?.toLowerCase();
  if (match === "hybrid") return "Hybrid";
  if (match === "remote") return "Remote";
  if (match) return "On-site";
  return "";
}

export function createRoleDraftFromText(roleText: string) {
  roleText = extractRoleContent(roleText);
  const sourceId = "role_input_current_request";
  const company = inferCompany(roleText);
  const title = inferTitle(roleText);
  const blocks = extractSectionBlocks(roleText);
  const description =
    extractSection(roleText, ["description", "summary", "תיאור", "תיאור המשרה"]) ||
    blocks.description.join("\n");
  const labeledResponsibilities = extractList(roleText, ["responsibilities", "responsibility", "key responsibilities", "תחומי אחריות", "אחריות"]);
  const labeledRequirements = extractList(roleText, ["requirements", "must have", "required", "qualifications", "skills", "דרישות", "כישורים נדרשים"]);
  const responsibilities = labeledResponsibilities.length > 0
    ? labeledResponsibilities
    : blocks.responsibilities.flatMap(splitBlockItems);
  const requirements = labeledRequirements.length > 0
    ? labeledRequirements
    : blocks.requirements.flatMap(splitBlockItems);
  const inferredResponsibilities = responsibilities.length > 0 ? responsibilities : inferListBySignals(roleText, [
    /\b(lead|own|manage|drive|define|create|build|develop|collaborate|partner|work with|deliver|support|shape)\b/i,
  ]);
  const inferredRequirements = requirements.length > 0 ? requirements : inferListBySignals(roleText, [
    /\b(experience|years|proven|strong|excellent|ability|knowledge|familiar|expertise|background|degree|portfolio|figma|ux|product)\b/i,
  ]);
  const preferredQualifications = blocks.preferred.flatMap(splitBlockItems);
  const yearsOfExperience = inferYearsOfExperience(roleText);
  const location = inferLocation(roleText);
  const workModel = inferWorkModel(roleText);

  return {
    company: roleField(company, sourceId),
    title: roleField(title.value, sourceId, { confidence: title.confidence }),
    description: roleField(description, sourceId),
    responsibilities: inferredResponsibilities.map((item) => roleField(item, sourceId)),
    requirements: inferredRequirements.map((item) => roleField(item, sourceId)),
    preferredQualifications: preferredQualifications.map((item) => roleField(item, sourceId)),
    ...(yearsOfExperience !== undefined ? { yearsOfExperience: roleField(yearsOfExperience, sourceId) } : {}),
    ...(location ? { location: roleField(location, sourceId) } : {}),
    ...(workModel ? { workModel: roleField(workModel, sourceId) } : {}),
  };
}

export function inferRoleFamily(title: string) {
  const normalizedTitle = title.toLowerCase();

  if (/\b(ai|artificial intelligence)\b/.test(normalizedTitle) && /\b(implementation|integration|adoption)\b/.test(normalizedTitle)) return "ai-implementation";
  if (/\b(ai|artificial intelligence)\b/.test(normalizedTitle) && /\b(product|strategy|manager|lead)\b/.test(normalizedTitle)) return "ai-product";
  if (/\bux\b/.test(normalizedTitle) && /\b(strategy|strategist)\b/.test(normalizedTitle)) return "ux-strategy";
  if (/\bproduct design/.test(normalizedTitle)) return "product-design";
  if (/\b(ux|user experience|designer|design)\b/.test(normalizedTitle)) return "ux-design";
  if (/\binnovation\b/.test(normalizedTitle)) return "innovation";
  if (/\bresearch\b/.test(normalizedTitle)) return "research";
  if (/\bproduct\b/.test(normalizedTitle)) return "product";
  if (/\b(manager|management|director|head|vp|vice president)\b/.test(normalizedTitle)) return "management";
  if (/\b(system|systems|engineer|engineering)\b/.test(normalizedTitle)) return "systems-engineering";

  return "other";
}

export function validateRoleText(input: {
  conversationId: string;
  traceId: string;
  roleText: string;
  detectedLanguage: "he" | "en" | "mixed";
}) {
  return createRoleValidationResult({
    conversationId: input.conversationId,
    traceId: input.traceId,
    roleDraft: createRoleDraftFromText(input.roleText),
    detectedLanguage: input.detectedLanguage,
  });
}

export function validateStructuredRoleDraft(input: {
  conversationId: string;
  traceId: string;
  roleDraft: StructuredRoleDraft;
  detectedLanguage: "he" | "en" | "mixed";
}) {
  return createRoleValidationResult(input);
}

export function looksLikeReportIntent(message: string) {
  return /\b(report|fit|match|role fit|analy[sz]e|analysis)\b/i.test(message) || /דוח|דו"ח|דו״ח|התאמה|מתאימ|נתח|משרה|תפקיד/.test(message);
}

export function shouldValidateRoleCollectionMessage(input: {
  message: string;
  roleCollectionActive: boolean;
}) {
  return looksLikeRoleInput(input.message)
    || (input.roleCollectionActive && input.message.trim().length >= 240)
    || (input.roleCollectionActive && isPlausibleRoleTitle(input.message));
}

export function shouldTreatAsRoleClarification(pendingField: RoleClarificationField | undefined, message: string) {
  return Boolean(pendingField) && !looksLikeRoleInput(message);
}

export function looksLikeRoleInput(message: string) {
  const lower = normalizeRoleText(message).toLowerCase();
  const labeledFieldCount = ["company:", "organization:", "title:", "role:", "description:", "responsibilities:", "requirements:", "qualifications:", "skills:"].filter((label) => lower.includes(label)).length;
  const linkedInSectionCount = normalizedHeadingEntries.filter(({ label }) => lower.includes(label.toLowerCase())).length;

  return labeledFieldCount >= 2 || linkedInSectionCount >= 2 || /responsibilities|key responsibilities|requirements|qualifications|job description/i.test(message) || /דרישות|אחריות|תיאור משרה|תיאור תפקיד/.test(message);
}
