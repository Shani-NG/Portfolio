import { createRoleValidationResult } from "./eligibility.ts";
import type { RoleValidationResult } from "../contracts/index.ts";
import { findLexiconMatches, getRoleFitLexiconEntries, normalizeLexiconText } from "../lexicon.ts";

type RoleSectionKind = "description" | "responsibilities" | "requirements" | "preferred";
type StructuralSectionKind = RoleSectionKind | "boilerplate";
export type RoleClarificationField = "company" | "title" | "responsibilities" | "requirements";
export type RoleCorrection = { field: RoleClarificationField; value: string };
export type StructuredRoleDraft = RoleValidationResult["roleDraft"];

const structuralSectionHeadings: Array<{ kind: StructuralSectionKind; labels: string[] }> = [
  { kind: "description", labels: ["About the job", "About the role", "Job description", "The opportunity", "Overview", "Description", "תיאור המשרה", "תיאור משרה", "תיאור התפקיד", "על התפקיד"] },
  {
    kind: "responsibilities",
    labels: [
      "Responsibilities", "Key Responsibilities", "Your Responsibilities", "What You'll Do", "What You Will Do", "What You'll Be Doing",
      "In This Role", "In This Role, You Will", "Your Role", "The Role", "Your Team and Role", "In Your Day-to-Day, You Will",
      "תחומי אחריות", "תחומי אחריות מרכזיים", "אחריות", "אחריות בתפקיד", "במסגרת התפקיד", "מה כולל התפקיד", "מה בתפקיד",
      "מה התפקיד שלך יכלול", "מה תעשה בתפקיד", "מה תעשי בתפקיד", "מה תעשו",
    ],
  },
  {
    kind: "requirements",
    labels: [
      "Requirements", "Qualifications", "Required Qualifications", "Key Qualifications", "What We're Looking For", "Who You Are", "About You",
      "We'd Love to Hear From You If You Have", "What You'll Bring", "What You'll Bring To The Team", "What You Bring", "What You Have",
      "Experience & Qualifications", "Must Have", "Skills", "Additional Requirements",
      "דרישות", "דרישות התפקיד", "למי התפקיד יתאים", "השכלה וניסיון", "ניסיון והשכלה", "ידע וניסיון", "ניסיון וכישורים",
      "יכולות מקצועיות", "מיומנויות מקצועיות", "מיומנויות אישיות", "כישורים", "כישורים נדרשים", "מה אנחנו מחפשים",
    ],
  },
  {
    kind: "preferred",
    labels: [
      "Preferred", "Preferred Qualifications", "Nice to Have", "Bonus", "Bonus Points", "Added Plus", "While Not Required",
      "While Not Required, It's an Added Plus If You Also Have", "Advantages", "יתרון", "יתרון משמעותי", "יהווה יתרון", "כישורים מועדפים",
    ],
  },
  {
    kind: "boilerplate",
    labels: [
      "Company Description", "About the Company", "About Us", "Who We Are", "Compensation", "Benefits", "Hiring Process",
      "Equal Opportunity", "Equal Opportunities", "Diversity", "Diversity, Equity and Inclusion", "Accessibility Accommodations",
      "Candidate Privacy Notice", "Please Note That", "Disclosure Statement: Use of AI in Hiring Process", "Application Instructions",
      "Additional Information", "Examples of Accommodations Include but Are Not Limited To", "Share This Job", "Apply for This Job",
      "רוצה להבין מה במשרה יכול להתאים לך", "פרטים נוספים",
    ],
  },
];

const normalizedHeadingEntries = structuralSectionHeadings.flatMap((section) =>
  section.labels.map((label) => ({ kind: section.kind, label, normalized: normalizeStructuralLabel(label) })),
).sort((left, right) => right.normalized.length - left.normalized.length);

function roleField<T extends string | number>(
  originalValue: T,
  sourceId: string,
  options: { kind?: "user-text" | "uploaded-file" | "clarification"; confidence?: "high" | "medium" | "low"; confirmed?: boolean } = {},
) {
  return {
    originalValue,
    sourceRef: {
      sourceId,
      kind: options.kind ?? "user-text" as const,
    },
    confidence: options.confidence ?? "medium" as const,
    confirmed: options.confirmed ?? Boolean(String(originalValue).trim()),
  };
}

function normalizeRoleText(roleText: string) {
  return roleText
    .replaceAll("â€™", "'")
    .replaceAll("’", "'")
    .replaceAll("â€“", "-")
    .replaceAll("â€”", "-");
}

function normalizeStructuralLabel(value: string) {
  return value
    .replace(/^#{1,6}\s*/, "")
    .replaceAll("’", "'")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[?:]+$/u, "")
    .toLowerCase();
}

function stripListMarker(value: string) {
  const match = value.match(/^\s*(?:[-*•·–—]|\d+[.)])\s+(.*)$/u);
  return { text: (match?.[1] ?? value).trim(), isListItem: Boolean(match) };
}

function matchStructuralHeading(value: string): { kind: StructuralSectionKind; content: string; label: string } | null {
  const line = value.replace(/^#{1,6}\s*/, "").trim();
  const colonIndex = line.indexOf(":");
  const headingPart = colonIndex >= 0 ? line.slice(0, colonIndex).trim() : line;
  const normalized = normalizeStructuralLabel(headingPart);

  for (const entry of normalizedHeadingEntries) {
    const exact = normalized === entry.normalized;
    const decorated = (
      (entry.normalized === "what you'll do" && normalized.startsWith(`${entry.normalized} at `))
      || (entry.normalized === "nice to have" && new RegExp(`^${entry.normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-–—]`).test(normalized))
      || normalized.startsWith(`${entry.normalized} (`)
    );
    if (!exact && !decorated) continue;
    return { kind: entry.kind, content: colonIndex >= 0 ? line.slice(colonIndex + 1).trim() : "", label: entry.normalized };
  }

  return null;
}

function isMetadataLine(value: string) {
  const line = value.trim();
  return /^(?:full[- ]time|part[- ]time|remote|hybrid|on[- ]site|city|location|department(?:\/company)?|משרה\s+\d+|משרה חלקית|עבודה מהבית|\d{2}\/\d{2}\/\d{4}|\d+\s*[-–]\s*\d+\s+שנים)(?:\s*:|$)/i.test(line)
    || /^(?:מרכז|צפון|דרום|ירושלים|תל אביב(?:-יפו)?|tel aviv(?:-yafo)?(?:, (?:tel aviv district, )?israel)?|remote|r&d and innovation center)$/i.test(line)
    || (line.match(/(?:משרה חלקית|עבודה מהבית|היברידי|full[- ]time|part[- ]time|remote|hybrid|on[- ]site)/gi)?.length ?? 0) >= 2;
}

function isBoilerplateLead(value: string) {
  return /^(?:we at deloitte believe that diversity|figma is growing our team of passionate creatives|at figma, one of our values|at figma we celebrate|figma is an equal opportunity workplace|we will work to ensure individuals with disabilities|to ensure the integrity of our hiring process|by applying for this job|accessibe is the market leader in web accessibility|at accessibe, we celebrate diversity|at accessibe, we prioritize diversity|in addition, accessibe will provide accommodation|please don't hesitate to share your needs|we're proud to be an equal opportunity employer|at wix, we believe our best work happens together|by clicking the link above or any third-party link|משרה זו פונה לנשים וגברים)/i.test(value.trim());
}

function isNonRoleReferenceLine(value: string) {
  return /^(?:https?:\/\/|here(?:'|’)s an example of a recent project|want to make a real impact\?\s*click here|click here to learn more)/i.test(value.trim());
}

function isRoleDescriptionLead(value: string) {
  return /^(?:we(?:'re| are) looking for|we(?:'re| are) seeking\b|this role\b|the role\b)/i.test(value.trim());
}

function isStandaloneSourceChrome(value: string, titleCandidate: string) {
  const line = value.trim();
  if (titleCandidate && normalizeStructuralLabel(line).startsWith(`${normalizeStructuralLabel(titleCandidate)} at `)) return true;
  return !/[.!?]$/.test(line)
    && line.split(/\s+/).length <= 5
    && !descriptionItemIsResponsibility(line)
    && !/\b(?:role|position|designer|manager|engineer|strategist|accountant|product|ux|ui)\b/i.test(line);
}

function looksLikeSubheading(value: string, section: RoleSectionKind, isListItem: boolean) {
  if (isListItem || section === "description") return false;
  const line = value.trim();
  if (!line || /[.!?]$/.test(line) || line.split(/\s+/).length > 8) return false;
  if (/^(?:experience|proven|strong|excellent|ability|knowledge|familiar|bachelor|portfolio|english|hebrew|תואר|ניסיון|יכולת|אנגלית|עברית|כ-?\s*\d)/i.test(line)) return false;
  if (section === "responsibilities" && descriptionItemIsResponsibility(line)) return false;
  return /[&–—]/.test(line) || /^[A-Z][\w/& -]+$/.test(line);
}

function descriptionItemIsResponsibility(value: string) {
  return /^(?:lead|own|manage|drive|define|create|build|develop|collaborate|align|partner|work|deliver|support|shape|conduct|translate|prioritize|monitor|communicate|stay|identify|help|be\b|as (?:a|an)\b|at [^,]+,|הובלת|בנייה|בניית|איסוף|תיעדוף|הגדרת|עבודה|זיהוי|ניהול|מדידת|עיצוב|ייזום|יזום|הטמעה)/i.test(value.trim());
}

function isExplicitOptionalItem(value: string) {
  const line = value.trim();
  return /^(?:preferred\b|nice to have\b|bonus(?: points)?(?: if)?\b|advantage\b|יתרון ל|רצוי\b)/i.test(line)
    || /(?:\bis an advantage|\bare an advantage|\bis a plus|\bare a plus|[-–—]\s*an advantage)[.!]?$/i.test(line);
}

function splitExplicitOptionalClause(value: string): { required: string; preferred: string } | null {
  const line = value.trim();
  const match = line.match(/^(.+?[.!?])\s+(bonus points if .+)$/i)
    ?? line.match(/^(.+?),\s+(with bonus points for .+)$/i)
    ?? line.match(/^(.+?)\s+[–—-]\s+(רצוי .+)$/i);
  if (!match) return null;
  return { required: match[1]!.trim(), preferred: match[2]!.trim() };
}

function splitInlineHeadingContent(value: string) {
  return value.split(";").map((item) => item.trim()).filter(Boolean);
}

function parseRoleStructure(roleText: string) {
  const blocks: Record<RoleSectionKind, string[]> = { description: [], responsibilities: [], requirements: [], preferred: [] };
  const lines = normalizeRoleText(roleText).split(/\r?\n/).map((line) => line.trim());
  if (/^Uploaded file:\s*[^\r\n]+$/i.test(lines[0] ?? "")) lines.shift();

  let section: StructuralSectionKind | null = null;
  let titleCandidate = "";
  let hasRoleSection = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || /^\*\*$/.test(line)) continue;

    if (!titleCandidate && !section) {
      const prefixedTitle = titleBeforeInlineDescriptionHeading(line);
      if (prefixedTitle) {
        titleCandidate = prefixedTitle.title;
        section = "description";
        if (prefixedTitle.description) blocks.description.push(prefixedTitle.description);
        continue;
      }
    }

    const heading = matchStructuralHeading(line);
    if (heading) {
      section = heading.kind;
      if (heading.kind !== "boilerplate" && heading.kind !== "description") hasRoleSection = true;
      if (heading.content && heading.kind !== "boilerplate") {
        const headingItems = splitInlineHeadingContent(heading.content);
        if (heading.kind === "responsibilities" && heading.label === "your role") blocks.description.push(...headingItems);
        else blocks[heading.kind].push(...headingItems);
      }
      continue;
    }

    const item = stripListMarker(line);
    if (section === "boilerplate" && isRoleDescriptionLead(item.text)) {
      section = "description";
      blocks.description.push(item.text);
      continue;
    }
    if (isBoilerplateLead(line) || isBoilerplateLead(item.text)) {
      section = "boilerplate";
      continue;
    }

    if (!titleCandidate && !section && !isMetadataLine(line) && isPlausibleSourceTitle(line)) {
      titleCandidate = line;
      continue;
    }
    if (isMetadataLine(line) || (!section && isStandaloneSourceChrome(line, titleCandidate)) || isNonRoleReferenceLine(line) || isNonRoleReferenceLine(item.text) || section === "boilerplate") continue;

    if (section) {
      if (looksLikeSubheading(item.text, section, item.isListItem)) continue;
      const optionalClause = section !== "preferred" ? splitExplicitOptionalClause(item.text) : null;
      if (optionalClause) {
        blocks[section].push(optionalClause.required);
        blocks.preferred.push(optionalClause.preferred);
      } else if (section !== "preferred" && isExplicitOptionalItem(item.text)) {
        blocks.preferred.push(item.text);
      } else if (section === "description" && item.isListItem && descriptionItemIsResponsibility(item.text)) {
        blocks.responsibilities.push(item.text);
        hasRoleSection = true;
      } else if (section === "responsibilities" && !item.isListItem && !descriptionItemIsResponsibility(item.text)) {
        blocks.description.push(item.text);
      } else {
        blocks[section].push(item.text);
      }
      continue;
    }

    if (titleCandidate && line.length >= 18) blocks.description.push(item.text);
  }

  return { blocks, titleCandidate, hasRoleSection };
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
  return parseRoleStructure(roleText).blocks;
}

function splitBlockItems(block: string): string[] {
  return block
    .split(/\r?\n/)
    .map((item) => stripListMarker(item).text)
    .filter(Boolean);
}

function extractList(roleText: string, labels: string[]): string[] {
  const value = extractSection(roleText, labels);
  if (!value) return [];

  return splitBlockItems(value);
}

function inferListBySignals(roleText: string, signals: RegExp[]): string[] {
  const structuralLines = normalizeRoleText(roleText).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (structuralLines.length < 3) return [];
  return structuralLines
    .map((item) => stripListMarker(item).text)
    .filter((item) => item.length >= 18)
    .filter((item) => !/^(?:job title|title|role|תפקיד|שם המשרה)\s*:/i.test(item))
    .filter((item) => signals.some((signal) => signal.test(item)));
}

const roleTitleSignal = /\b(ux|ui|user experience|product|design(?:er)?|research(?:er)?|strateg(?:y|ist)|manager|management|lead|director|head|vice president|vp|chief|engineer|developer|architect|analyst|specialist|consultant|coordinator|innovation|implementation|operations)\b/i;
const setupInstructionSignal = /\b(upload|paste|provide|send|share|attach|going to|want to|would like to|job description|role details)\b/i;
const hebrewSetupInstructionSignal = /^(?:אני|היי|שלום|רוצה|אפשר|צריך|צריכה|תודה)\b/;
const conversationalQuestionSignal = /^(?:what|how|why|who|where|when|which|can|could|would|should|do|does|did|is|are|tell me|explain)\b/i;
const hebrewConversationalQuestionSignal = /^(?:מה|איך|למה|מי|איפה|מתי|האם|איזה|איזו|אפשר|תוכלי|את יכולה|ספרי|הסבירי|תסבירי)(?:\s|$)/;
const hebrewRoleTitleSignal = /(?:^|\s)(?:מנהל(?:ת|[-־/\\]ת)?|מעצב(?:ת|[-־/\\]ת)?|חוקר(?:ת|[-־/\\]ת)?|אסטרטג(?:ית|[-־/\\]ית)?|מוביל(?:ת|[-־/\\]ה)?|ראש(?:ת|[-־/\\]ת)?|מהנדס(?:ת|[-־/\\]ת)?|מפתח(?:ת|[-־/\\]ת)?|אנליסט(?:ית|[-־/\\]ית)?|יועץ(?:[-־/\\]ת)?|יועצת|רכז(?:ת|[-־/\\]ת)?|ארכיטקט(?:ית|[-־/\\]ית)?|מומחה(?:[-־/\\]ית)?|מומחית|דירקטור(?:ית|[-־/\\]ית)?|סמנכ["״]ל)(?:\s|$)/;
const standaloneTitleLabel = /^(?:job title|title|role|שם המשרה|תפקיד)\s*:\s*(.+)$/i;
const roleFieldLabelSignal = /^(?:company|organization|title|job title|role|description|responsibilities|requirements|qualifications|skills|location|job location|חברה|ארגון|תפקיד|שם המשרה|תיאור|תיאור המשרה|תחומי אחריות|אחריות|דרישות|כישורים נדרשים)\s*:/i;
const priorTitleReferenceSignal = /(?:שם\s+המשרה|הכותרת|התפקיד).{0,50}(?:כתוב|כתובה|הופיע|הופיעה|נמצא|נמצאת|שורה\s+ראשונה|למעלה|בהתחלה)|(?:כתוב|כתובה|הופיע|הופיעה|נמצא|נמצאת).{0,50}(?:שורה\s+ראשונה|למעלה|בהתחלה)|\b(?:title|role)\b.{0,50}\b(?:first line|above|previous|already|pasted)\b|\b(?:first line|above|previous|already pasted)\b.{0,50}\b(?:title|role)\b/i;
const obviousNonTitleLineSignal = /(?:https?:\/\/|www\.|\b[\w.-]+\.[a-z]{2,}(?:\/\S*)?|\byoutube\b|\b(?:sneak\s+pe[ae]k|watch|learn more|read more)\b)/i;
const titleRejectionSignal = /(?:שם\s+המשרה\s+לא\s+נכון|הכותרת\s+לא\s+נכונה|התפקיד\s+שזיהית\s+לא\s+נכון|זה\s+לא\s+שם\s+המשרה)|\b(?:the\s+)?(?:job\s+)?title\s+is\s+(?:wrong|incorrect)\b|\bthat's\s+not\s+the\s+role\s+title\b|\byou\s+got\s+the\s+title\s+wrong\b/i;

function hasStrongTitleLexiconMatch(value: string) {
  return findLexiconMatches({ text: value, language: "mixed" })
    .some((match) => match.entry.kind === "title_family" && match.matched_by !== "keyword");
}

export function isPlausibleRoleTitle(value: string): boolean {
  const title = value.trim();
  const words = title.split(/\s+/);

  if (!title || title.length > 100 || words.length > 12) return false;
  if (obviousNonTitleLineSignal.test(title)) return false;
  if (/[.!?]$/.test(title) || setupInstructionSignal.test(title)) return false;
  if (/^(about|company|organization|description|responsibilities|requirements|qualifications|skills)\s*:/i.test(title)) return false;

  return roleTitleSignal.test(title) || hebrewRoleTitleSignal.test(title) || hasStrongTitleLexiconMatch(title);
}

function isPlausibleSourceTitle(value: string): boolean {
  const title = value.trim();
  const words = title.split(/\s+/);
  if (!title || title.length > 100 || words.length > 12) return false;
  if (obviousNonTitleLineSignal.test(title) || roleFieldLabelSignal.test(title) || isMetadataLine(title)) return false;
  if (/^(?:about|based in|we are|we're|our |the |this |here(?:'|’)s|want to|click here|רוצה להבין|הניסיון שלך)/i.test(title)) return false;
  if (matchStructuralHeading(title) || /[.!?]$/.test(title) || setupInstructionSignal.test(title)) return false;
  if (!/[\p{L}]/u.test(title)) return false;
  return isPlausibleRoleTitle(title)
    || /^[\p{Lu}][\p{L}&/\\()+.-]*(?:\s+[\p{L}&/\\()+.-]+){0,7}$/u.test(title);
}

function titleBeforeInlineDescriptionHeading(value: string) {
  const line = value.trim();
  const match = line.match(/^(.+?)\s+(About the job|About the role|Job description|תיאור המשרה|תיאור משרה|תיאור התפקיד)\b\s*(.*)$/i);
  const title = match?.[1]?.trim() ?? "";
  return title && isPlausibleSourceTitle(title)
    ? { title, description: match?.[3]?.trim() ?? "" }
    : null;
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
  return Boolean(matchStructuralHeading(value));
}

function startsWithPlausibleTitleBeforeHeading(value: string) {
  if (titleBeforeInlineDescriptionHeading(value)) return true;
  const lines = normalizeRoleText(value).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const firstHeadingIndex = lines.findIndex((line) => Boolean(matchStructuralHeading(line)));
  if (firstHeadingIndex <= 0) return false;
  return lines.slice(0, firstHeadingIndex).some(isPlausibleSourceTitle);
}

function isRoleBoundaryLine(value: string) {
  const line = value.trim();
  return roleFieldLabelSignal.test(line) || isKnownSectionHeading(line) || isPlausibleSourceTitle(line) || startsWithPlausibleTitleBeforeHeading(line);
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

function inferTitle(roleText: string): { value: string; confidence: "high" | "medium" | "low"; confirmed: boolean } {
  const labeledTitle = extractSection(roleText, ["title", "role", "תפקיד", "שם המשרה"]);
  if (labeledTitle && isPlausibleRoleTitle(labeledTitle)) return { value: labeledTitle, confidence: "high", confirmed: true };

  const inferredTitle = parseRoleStructure(roleText).titleCandidate;

  if (inferredTitle) return { value: inferredTitle, confidence: "medium", confirmed: true };
  const semanticTitle = inferSemanticTitle(roleText);
  return { value: semanticTitle, confidence: semanticTitle ? "low" : "medium", confirmed: false };
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

export function isRoleTitleRejection(value: string): boolean {
  return titleRejectionSignal.test(value.trim());
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
  return Boolean(roleDraft.title?.confirmed && nonEmptyField(roleDraft.title) && roleDraft.responsibilities.length && roleDraft.requirements.length);
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
  const normalizedValue = field === "title"
    ? normalizeRoleTitleClarification(value)
    : field === "company"
      ? normalizeCompanyName(value)
      : value.trim();
  const fieldValue = roleField(normalizedValue, `role_clarification_${field}`, { kind: "clarification", confidence: "high" });

  if (field === "responsibilities" || field === "requirements") {
    return { ...next, [field]: mergeRoleFieldLists(next[field], [fieldValue]) };
  }
  return { ...next, [field]: fieldValue };
}

export function applyRoleDraftCorrection(roleDraft: StructuredRoleDraft, correction: RoleCorrection) {
  return mergeRoleDraftClarification(roleDraft, correction.field, correction.value);
}

export function clearRoleDraftField(roleDraft: StructuredRoleDraft, field: RoleClarificationField): StructuredRoleDraft {
  if (field === "responsibilities" || field === "requirements") return { ...roleDraft, [field]: [] };
  const { [field]: _removed, ...rest } = roleDraft;
  return rest;
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

function inferCompanyIntroduction(roleText: string) {
  const explicitIntroductionPatterns = [
    /\b[Ww]e(?:'|’)?re\s+([A-Z][A-Za-z0-9&.'’()-]*(?:\s+(?:[A-Z][A-Za-z0-9&.'’()-]*|&)){0,4})(?=\s*,)/,
    /(?:^|[.!?]\s+|\n)At\s+((?:[A-Z][A-Za-z0-9&.'’()-]*(?:\s+(?:[A-Z][A-Za-z0-9&.'’()-]*|&)){0,4})|(?:[a-z0-9][a-z0-9.-]*\.[a-z]{2,}))(?=\s*,\s+(?:we|our)\b)/m,
  ];
  for (const pattern of explicitIntroductionPatterns) {
    const introducedCompany = roleText.match(pattern)?.[1]?.trim();
    if (introducedCompany) return introducedCompany;
  }

  return "";
}

export function normalizeCompanyName(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "";

  return normalized
    .replace(
      /\s*[,–—]\s*(?:a|an|the|which|who|where|part of)\b.*$/i,
      "",
    )
    .replace(
      /\s+(?:is|are)\s+(?:a|an|the)\b.*$/i,
      "",
    )
    .trim();
}

function inferCompany(roleText: string): string {
  const labeledCompany = extractSection(roleText, ["company", "organization", "חברה", "ארגון"]);
  if (labeledCompany) return normalizeCompanyName(labeledCompany);

  const introducedCompany = inferCompanyIntroduction(roleText);
  if (introducedCompany) return normalizeCompanyName(introducedCompany);

  const domainHiringMatch = roleText.match(
    /\b([a-z0-9][a-z0-9.-]*\.[a-z]{2,})\s+is\s+(?:looking|hiring)\b/i,
  );
  if (domainHiringMatch) return normalizeCompanyName(domainHiringMatch[1]);

  const match = roleText.match(/\b([A-Z][A-Z0-9&.-]{1,})\s+is looking\b/);
  return normalizeCompanyName(match?.[1] ?? "");
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
  const preExtractCompany = inferCompany(roleText);
  roleText = extractRoleContent(roleText);
  const sourceId = "role_input_current_request";
  const company = inferCompany(roleText) || preExtractCompany;
  const title = inferTitle(roleText);
  const blocks = extractSectionBlocks(roleText);
  const description = blocks.description.join("\n");
  const responsibilities = blocks.responsibilities.flatMap(splitBlockItems);
  const requirements = blocks.requirements.flatMap(splitBlockItems);
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
    title: roleField(title.value, sourceId, { confidence: title.confidence, confirmed: title.confirmed }),
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
  const roleText = extractRoleContent(message);
  const structure = parseRoleStructure(roleText);
  const explicitTitle = extractSection(roleText, ["job title", "title", "role", "תפקיד", "שם המשרה"]);
  const title = structure.titleCandidate || explicitTitle;
  const hasPlausibleTitle = Boolean(title) && isPlausibleRoleTitle(title);
  const hasResponsibilities = structure.blocks.responsibilities.length > 0;
  const hasRequirements = structure.blocks.requirements.length > 0;
  const hasRealRoleSection = structure.hasRoleSection && (hasResponsibilities || hasRequirements);

  return (hasPlausibleTitle && hasRealRoleSection)
    || (hasResponsibilities && hasRequirements);
}
