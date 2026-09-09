import { createRoleValidationResult } from "./eligibility.ts";
import type { RoleValidationResult } from "../contracts/index.ts";
import { findLexiconMatches, getRoleFitLexiconEntries, normalizeLexiconText } from "../lexicon.ts";

type RoleSectionKind = "description" | "responsibilities" | "requirements" | "preferred";
export type RoleClarificationField = "company" | "title" | "responsibilities" | "requirements";
export type RoleCorrection = { field: RoleClarificationField; value: string };
export type StructuredRoleDraft = RoleValidationResult["roleDraft"];

const roleSectionHeadings: Array<{ kind: RoleSectionKind; labels: string[] }> = [
  { kind: "description", labels: ["About the job", "About the role", "Job description", "The opportunity", "Overview", "תיאור המשרה", "תיאור התפקיד", "על התפקיד"] },
  {
    kind: "responsibilities",
    labels: [
      "What You'll Do",
      "What You Will Do",
      "What You'll Be Doing",
      "What You’ll Be Doing",
      "Responsibilities",
      "Key Responsibilities",
      "Your Responsibilities",
      "The Role",
      "תחומי אחריות",
      "תחומי אחריות מרכזיים",
      "אחריות",
      "אחריות מרכזית",
      "אחריות בתפקיד",
      "מה תעשה בתפקיד",
      "מה תעשי בתפקיד",
      "מה עושים בתפקיד",
      "מה כולל התפקיד",
      "מה תעשו",
      "מה תעשי",
    ],
  },
  {
    kind: "requirements",
    labels: [
      "Requirements",
      "Qualifications",
      "Required Qualifications",
      "What You'll Bring",
      "What You Bring",
      "What You'll Bring To The Team",
      "What You’ll Bring To The Team",
      "What We're Looking For",
      "What We’re Looking For",
      "Who You Are",
      "Skills",
      "Experience & Qualifications",
      "Key Qualifications",
      "Must Have",
      "What You Have",
      "דרישות",
      "דרישות התפקיד",
      "השכלה וניסיון",
      "ניסיון והשכלה",
      "ידע וניסיון",
      "ניסיון וכישורים",
      "יכולות מקצועיות",
      "מיומנויות מקצועיות",
      "מיומנויות אישיות",
      "כישורים",
      "כישורים נדרשים",
      "מה אנחנו מחפשים",
    ],
  },
  { kind: "preferred", labels: ["Preferred Qualifications", "Nice to Have", "Bonus", "Bonus Points", "Advantage", "Preferred", "יתרון", "יתרון משמעותי", "כישורים מועדפים"] },
];

const normalizedHeadingEntries = roleSectionHeadings.flatMap((section) =>
  section.labels.flatMap((label) => [
    { kind: section.kind, label },
    { kind: section.kind, label: label.replaceAll("'", "’") },
  ]),
);

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
    .replaceAll("\u00a0", " ")
    .replaceAll("â€™", "'")
    .replaceAll("’", "'")
    .replaceAll("‘", "'")
    .replaceAll("â€“", "-")
    .replaceAll("â€”", "-")
    .replaceAll("–", "-")
    .replaceAll("—", "-")
    .replaceAll("•", "\n")
    .replaceAll("·", "\n");
}

function segmentInlineHeadings(roleText: string) {
  const headingAlternatives = normalizedHeadingEntries
    .filter(({ label }) => !/[\u0590-\u05ff]/.test(label))
    .filter(({ label }) => normalizeDetectionText(label).toLowerCase() !== "the role")
    .map(({ label }) => label)
    .sort((left, right) => right.length - left.length)
    .map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replaceAll("'", "['’]"));
  if (headingAlternatives.length === 0) return normalizeRoleText(roleText);

  return normalizeRoleText(roleText).replace(new RegExp(`\\s+(${headingAlternatives.join("|")})(?=\\s|:)`, "gi"), "\n$1");
}

function normalizeDetectionText(value: string) {
  return normalizeRoleText(value)
    .replace(/^\s{0,3}#{1,6}\s*/, "")
    .replace(/^[-*]\s+/, "")
    .replace(/^_{2,}(.+?)_{2,}$/g, "$1")
    .replace(/^\*{1,3}(.+?)\*{1,3}$/g, "$1")
    .replace(/([\u0590-\u05ff]+)\.(?=[\u0590-\u05ff])/g, "$1-")
    .replace(/־/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function stripDetectionWrapper(value: string) {
  return value
    .trim()
    .replace(/^\s{0,3}#{1,6}\s*/, "")
    .replace(/\*{1,3}(.+?)\*{1,3}/g, "$1")
    .replace(/_{2,}(.+?)_{2,}/g, "$1")
    .replace(/^_{2,}(.+?)_{2,}$/g, "$1")
    .replace(/^\*{1,3}(.+?)\*{1,3}$/g, "$1")
    .trim();
}

function normalizeHeadingCandidate(value: string) {
  return normalizeDetectionText(value).replace(/[:.]+$/, "").toLowerCase();
}

function matchKnownRoleHeading(value: string): { kind: RoleSectionKind; inlineValue: string } | null {
  const stripped = stripDetectionWrapper(value);
  const detectionLine = normalizeDetectionText(stripped);
  for (const entry of normalizedHeadingEntries) {
    const normalizedLabel = normalizeDetectionText(entry.label).toLowerCase();
    const normalizedLine = detectionLine.toLowerCase();
    if (normalizedLine === normalizedLabel) return { kind: entry.kind, inlineValue: "" };
    if (normalizedLine.startsWith(`${normalizedLabel}:`) || new RegExp(`^${normalizedLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\([^)]{1,30}\\)\\s*:`).test(normalizedLine)) {
      const colonIndex = stripped.indexOf(":");
      return { kind: entry.kind, inlineValue: colonIndex >= 0 ? stripped.slice(colonIndex + 1).trim() : "" };
    }
    if (normalizedLine.startsWith(`${normalizedLabel} `)) {
      return { kind: entry.kind, inlineValue: stripped.slice(entry.label.length).trim() };
    }
  }

  return null;
}

const nonRoleHeadingSignal = /^(?:about\s+(?:the\s+)?(?:role|job|position|team|team\s*&\s*about\s+role|us|our\s+team|this\s+role|you|opportunity)|join\s+us|equal\s+opportunity|inclusion|diversity|location|job\s*id|based\s+in|מזהה\s+דרישה|מיקום|על\s+(?:התפקיד|המשרה|הצוות)|מי\s+אנחנו)$/i;

function isStructuralStopHeading(value: string) {
  const line = normalizeDetectionText(value);
  if (!line) return false;
  if (matchKnownRoleHeading(line)) return true;
  if (nonRoleHeadingSignal.test(line)) return true;
  if (/^about\s+/i.test(line) && line.split(/\s+/).length <= 5) return true;
  if (/^\s{0,3}#{1,6}\s+/.test(value) && line.length <= 100 && !/[.!?]$/.test(line)) return true;
  return line.length <= 80
    && !/[.!?]$/.test(line)
    && !/^[-*]\s/.test(value.trim())
    && /^[A-Z][\w&.'()-]+(?:\s+[A-Z][\w&.'()-]+){0,7}$/.test(line);
}

function extractSection(roleText: string, labels: string[]): string {
  const lines = segmentInlineHeadings(roleText).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  for (let index = 0; index < lines.length; index += 1) {
    const line = stripDetectionWrapper(lines[index]);
    const normalizedLine = normalizeDetectionText(line).toLowerCase();
    for (const label of labels) {
      const normalizedLabel = normalizeDetectionText(label).toLowerCase();
      if (normalizedLine.startsWith(`${normalizedLabel}:`)) {
        const colonIndex = line.indexOf(":");
        return colonIndex >= 0 ? line.slice(colonIndex + 1).trim() : "";
      }
      if (new RegExp(`^${normalizedLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\([^)]{1,30}\\)\\s*:`).test(normalizedLine)) {
        const colonIndex = line.indexOf(":");
        return colonIndex >= 0 ? line.slice(colonIndex + 1).trim() : "";
      }
      if (normalizedLine === normalizedLabel && lines[index + 1] && !isStructuralStopHeading(lines[index + 1])) {
        return stripDetectionWrapper(lines[index + 1]);
      }
    }
  }

  return "";
}

function extractSectionBlocks(roleText: string): Record<RoleSectionKind, string[]> {
  const blocks: Record<RoleSectionKind, string[]> = {
    description: [],
    responsibilities: [],
    requirements: [],
    preferred: [],
  };
  let currentKind: RoleSectionKind | null = null;

  for (const rawLine of segmentInlineHeadings(roleText).split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const heading = matchKnownRoleHeading(line);
    if (heading) {
      currentKind = heading.kind;
      if (heading.inlineValue) blocks[currentKind].push(heading.inlineValue);
      continue;
    }

    if (currentKind && isStructuralStopHeading(line)) {
      currentKind = null;
      continue;
    }

    if (currentKind) blocks[currentKind].push(line);
  }

  return blocks;
}

function splitBlockItems(block: string): string[] {
  return block
    .split(/\r?\n|;|(?=\s[-*]\s)|(?=\s\d+[.)]\s)/)
    .map((item) => item.replace(/^\s*(?:[-*]|\d+[.)])\s*/, "").trim())
    .filter(Boolean)
    .filter((item) => !obviousNonTitleLineSignal.test(item))
    .filter((item) => !/^(?:join\s+us|equal\s+opportunity|inclusion|diversity|about\s+|מזהה\s+דרישה|מיקום)\b/i.test(normalizeDetectionText(item)));
}

function extractList(roleText: string, labels: string[]): string[] {
  const value = extractSection(roleText, labels);
  if (!value) return [];

  return splitBlockItems(value);
}

function inferListBySignals(roleText: string, signals: RegExp[]): string[] {
  return splitUnstructuredRoleItems(roleText)
    .filter((item) => item.length >= 18)
    .filter((item) => !/^(?:job title|title|role|תפקיד|שם המשרה)\s*:/i.test(item))
    .filter((item) => signals.some((signal) => signal.test(item)));
}

function splitUnstructuredRoleItems(roleText: string): string[] {
  return normalizeRoleText(roleText)
    .split(/\r?\n|;|(?=\s[-*]\s)|(?=\s\d+[.)]\s)|(?<=[.!?])\s+(?=[A-Z\u0590-\u05ff])/u)
    .map((item) => stripDetectionWrapper(item).replace(/^\s*(?:[-*]|\d+[.)])\s*/, "").trim())
    .filter(Boolean)
    .filter((item) => !obviousNonTitleLineSignal.test(item));
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
const obviousNonTitleLineSignal = /(?:https?:\/\/|www\.|\b[\w.-]+\.[a-z]{2,}(?:\/\S*)?|\byoutube\b|\b(?:sneak\s+pe[ae]k|watch|learn more|read more|red\s+dot|if\s+design\s+award|gartner\s+magic\s+quadrant|leader|ipo|arr|linkedin|medium\s+page|job\s*id|hybrid|remote|equal\s+opportunity|inclusion|join\s+us)\b|מזהה\s+דרישה|מיקום)/i;
const titleRejectionSignal = /(?:שם\s+המשרה\s+לא\s+נכון|הכותרת\s+לא\s+נכונה|התפקיד\s+שזיהית\s+לא\s+נכון|זה\s+לא\s+שם\s+המשרה)|\b(?:the\s+)?(?:job\s+)?title\s+is\s+(?:wrong|incorrect)\b|\bthat's\s+not\s+the\s+role\s+title\b|\byou\s+got\s+the\s+title\s+wrong\b/i;
const englishResponsibilitySignal = /\b(lead|own|manage|drive|define|create|build|develop|collaborate|partner|work with|deliver|support|shape|facilitate|design|implement)\b/i;
const englishRequirementSignal = /\b(experience|years|proven|strong|excellent|ability|knowledge|familiar|expertise|background|degree|portfolio|proficiency|skilled)\b/i;
const hebrewResponsibilitySignal = /(?:להוביל|הובלת|ניהול|לנהל|אחריות|עבודה\s+עם|שיתוף\s+פעולה|לפתח|פיתוח|לתכנן|תכנון|להגדיר|הגדרת|ליצור|יצירת|לבנות|בניית|ליישם|יישום|להטמיע|הטמעת|לתמוך|תמיכה|לרכז|ריכוז)/;
const hebrewRequirementSignal = /(?:ניסיון|יכולת|יכולות|ידע|היכרות|שליטה|השכלה|תואר|מיומנות|מיומנויות|כישורים|מומחיות|רקע|חובה|נדרש(?:ת|ים|ות)?|יתרון|לפחות\s+\d+|\d+\s*שנ(?:ה|ים|ות))/;

function hasStrongTitleLexiconMatch(value: string) {
  return findLexiconMatches({ text: value, language: "mixed" })
    .some((match) => match.entry.kind === "title_family" && match.matched_by !== "keyword");
}

export function isPlausibleRoleTitle(value: string): boolean {
  const title = stripDetectionWrapper(value);
  const detectionTitle = normalizeDetectionText(title);
  const words = detectionTitle.split(/\s+/);

  if (!detectionTitle || detectionTitle.length > 100 || words.length > 12) return false;
  if (obviousNonTitleLineSignal.test(detectionTitle)) return false;
  if (/[.!?]$/.test(detectionTitle) || setupInstructionSignal.test(detectionTitle)) return false;
  if (/^(about|company|organization|description|responsibilities|requirements|qualifications|skills)\s*:/i.test(detectionTitle)) return false;

  return roleTitleSignal.test(detectionTitle) || hebrewRoleTitleSignal.test(detectionTitle) || hasStrongTitleLexiconMatch(detectionTitle);
}

export function extractStandaloneRoleTitle(value: string): string | null {
  const input = value.trim();
  if (!input || input.includes("\n") || input.length > 100) return null;

  if (conversationalQuestionSignal.test(input) || hebrewConversationalQuestionSignal.test(input)) return null;
  const title = resolveSourceBackedRoleTitle(input, { allowUnframed: true });
  return title || null;
}

function isKnownSectionHeading(value: string) {
  const normalized = normalizeHeadingCandidate(value);
  return normalizedHeadingEntries.some(({ label }) => normalizeDetectionText(label).toLowerCase() === normalized);
}

function hasRoleStructureAfter(lines: string[], startIndex: number) {
  return lines.slice(startIndex + 1, startIndex + 12).some((line) =>
    Boolean(matchKnownRoleHeading(line)) || roleFieldLabelSignal.test(normalizeDetectionText(line)),
  );
}

function hasRoleEvidenceAfter(lines: string[], startIndex: number) {
  const followingLines = lines.slice(startIndex + 1, startIndex + 9);
  const hasResponsibility = followingLines.some((line) => englishResponsibilitySignal.test(line) || hebrewResponsibilitySignal.test(line));
  const hasRequirement = followingLines.some((line) => englishRequirementSignal.test(line) || hebrewRequirementSignal.test(line));
  return hasResponsibility && hasRequirement;
}

function isRoleBoundaryLine(value: string, lines: string[] = [], index = 0) {
  const line = value.trim();
  const detectionLine = normalizeDetectionText(line);
  return roleFieldLabelSignal.test(detectionLine)
    || isKnownSectionHeading(line)
    || (isPlausibleRoleTitle(line) && hasRoleStructureAfter(lines, index))
    || /\bwe(?:\s+are|'re)\s+(?:looking\s+for|hiring)\b|\bin\s+this\s+role\s+as\b/i.test(detectionLine)
    || /(?:דרוש[.-]?ה|מגייסת|מגייסים)/.test(detectionLine);
}

export function extractRoleContent(message: string): string {
  const normalized = segmentInlineHeadings(message).trim();
  if (!normalized) return "";

  const lines = normalized.split(/\r?\n/);
  const firstRoleLine = lines.findIndex((line, index) => isRoleBoundaryLine(line, lines, index));
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

function cleanTitleCandidate(value: string) {
  return stripDetectionWrapper(value)
    .replace(/^(?:a|an|the)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanHiringTitleCandidate(value: string) {
  return cleanTitleCandidate(value)
    .replace(/^(?:highly[-\s]skilled|skilled|experienced|talented|passionate)\s+/i, "")
    .trim();
}

function extractTitleFromRecruitmentStatement(roleText: string) {
  const lines = normalizeRoleText(roleText).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const englishPatterns = [
    /\bwe(?:\s+are|'re)\s+(?:looking\s+for|hiring)\s+(?:an|a|the)?\s*(.+?)(?=\s+(?:for|who|with|at|in)\b|\s+to\s+(?:join|build|lead|own|manage|drive|define|create|develop|collaborate|partner|deliver|support|shape|work)\b|[,.]|$)/i,
    /\bin\s+this\s+role\s+as\s+(?:an|a|the)?\s*(.+?)(?=\s+(?:who|with|at|in)\b|\s+to\s+(?:join|build|lead|own|manage|drive|define|create|develop|collaborate|partner|deliver|support|shape|work)\b|[,.]|$)/i,
    /\b(?:actually,?\s*)?(?:the\s+)?role\s+is\s+(?:an|a|the)?\s*(.+?)(?=\s+(?:who|with|at|in)\b|\s+to\s+(?:join|build|lead|own|manage|drive|define|create|develop|collaborate|partner|deliver|support|shape|work)\b|[,.]|$)/i,
  ];
  const hebrewPatterns = [
    /(?:דרוש[.-]?ה|דרושה|דרוש)\s+(.+?)(?=\s+(?:לחברת|ב|עבור|לאגף|למחלקה)|,|\.(?:\s|$)|$)/,
    /(?:מגייסת|מגייסים)\s+(.+?)(?=\s+(?:לחברת|ב|עבור|לאגף|למחלקה)|,|\.(?:\s|$)|$)/,
  ];

  for (const line of lines.slice(0, 30)) {
    for (const pattern of englishPatterns) {
      const englishCandidate = line.match(pattern)?.[1];
      if (englishCandidate) {
        const title = cleanHiringTitleCandidate(englishCandidate);
        if (isPlausibleRoleTitle(title)) return title;
      }
    }

    for (const pattern of hebrewPatterns) {
      const hebrewCandidate = line.match(pattern)?.[1];
      if (hebrewCandidate) {
        const title = cleanHiringTitleCandidate(hebrewCandidate);
        if (isPlausibleRoleTitle(title)) return title;
      }
    }
  }

  return "";
}

function resolveSourceBackedRoleTitle(value: string, options: { allowUnframed: boolean }): string {
  const input = stripDetectionWrapper(value).trim();
  if (!input) return "";

  const labeledTitle = input.match(standaloneTitleLabel)?.[1]?.trim();
  if (labeledTitle) {
    const title = cleanTitleCandidate(labeledTitle);
    return isPlausibleRoleTitle(title) ? title : "";
  }

  const recruitmentTitle = extractTitleFromRecruitmentStatement(input);
  if (recruitmentTitle) return recruitmentTitle;

  if (!options.allowUnframed) return "";
  const title = cleanTitleCandidate(input).replace(/[.!?]+$/u, "").trim();
  return isPlausibleRoleTitle(title) ? title : "";
}

function extractStructuralTitle(roleText: string) {
  const lines = splitUnstructuredRoleItems(segmentInlineHeadings(roleText));
  const firstRoleSectionIndex = lines.findIndex((line) => Boolean(matchKnownRoleHeading(line)));
  const titleSearchEnd = firstRoleSectionIndex >= 0 ? firstRoleSectionIndex : Math.min(lines.length, 12);
  const candidates = lines.slice(0, titleSearchEnd);

  for (let index = 0; index < candidates.length; index += 1) {
    const line = candidates[index];
    if (!isPlausibleRoleTitle(line)) continue;
    if (!hasRoleStructureAfter(lines, index) && !hasRoleEvidenceAfter(lines, index) && !/^#{1,6}\s/.test(line.trim())) continue;
    return resolveSourceBackedRoleTitle(line, { allowUnframed: true });
  }

  return "";
}

function inferTitle(roleText: string): { value: string; confidence: "high" | "medium" | "low"; confirmed: boolean } {
  const labeledTitle = resolveSourceBackedRoleTitle(extractSection(roleText, ["job title", "title", "role", "תפקיד", "שם המשרה"]), { allowUnframed: true });
  if (labeledTitle) return { value: labeledTitle, confidence: "high", confirmed: true };

  const structuralTitle = extractStructuralTitle(roleText);
  if (structuralTitle) return { value: structuralTitle, confidence: "medium", confirmed: true };

  const recruitmentTitle = resolveSourceBackedRoleTitle(roleText, { allowUnframed: false });
  if (recruitmentTitle) return { value: recruitmentTitle, confidence: "medium", confirmed: true };

  return { value: "", confidence: "medium", confirmed: false };
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
  const genericTitle = genericRoleTitles.get(value.trim().toLowerCase());
  return genericTitle ?? resolveSourceBackedRoleTitle(value, { allowUnframed: true });
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
  if (!normalizedValue) return next;
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
    /(?:^|[.!?]\s+|\n)([a-z0-9][a-z0-9.-]*\.[a-z]{2,})\s+is\s+(?:looking|hiring)\b/im,
    /(?:^|[.!?]\s+|\n)([A-Z][A-Z0-9&.-]{1,})\s+is\s+(?:looking|hiring)\b/m,
    /(?:^|\n)ב([א-ת][א-תA-Za-z0-9&.'’()-]{1,40})\s+דרוש[.-]?ה/m,
    /(?:^|\n)([א-ת][א-תA-Za-z0-9&.'’()-]{1,40})\s+מגייסת/m,
    /(?:^|\n)לחברת\s+([א-תA-Za-z0-9&.'’()-]{2,40})\s+דרוש[.-]?ה/m,
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

  const company = normalized
    .replace(
      /\s*[,–—]\s*(?:a|an|the|which|who|where|part of)\b.*$/i,
      "",
    )
    .replace(
      /\s+(?:is|are)\s+(?:a|an|the)\b.*$/i,
      "",
    )
    .trim();
  if (/^(?:company|organization|the company|team|group|department|our team|החברה|חברה|קבוצה|צוות|מחלקה)$/i.test(company)) return "";
  return company;
}

function inferCompanyFromAboutHeading(roleText: string) {
  const excludedAbout = /^(?:about\s+(?:the\s+)?(?:role|job|position|team|team\s*&\s*about\s+role|us|our\s+team|this\s+role|you|opportunity)|על\s+(?:התפקיד|המשרה|הצוות)|מי\s+אנחנו)$/i;
  const lines = normalizeRoleText(roleText).split(/\r?\n/).map((line) => stripDetectionWrapper(line.trim())).filter(Boolean);

  for (const line of lines.slice(0, 30)) {
    const detectionLine = normalizeDetectionText(line);
    if (excludedAbout.test(detectionLine)) continue;
    const englishCompany = detectionLine.match(/^about\s+([A-Z][A-Za-z0-9&.'()-]*(?:\s+[A-Z][A-Za-z0-9&.'()-]*){0,3}|[a-z0-9][a-z0-9.-]*\.[a-z]{2,})$/i)?.[1];
    if (englishCompany) return normalizeCompanyName(englishCompany);
  }

  return "";
}

function inferCompany(roleText: string): string {
  const labeledCompany = extractSection(roleText, ["company", "organization", "חברה", "ארגון"]);
  if (labeledCompany) return normalizeCompanyName(labeledCompany);

  const aboutCompany = inferCompanyFromAboutHeading(roleText);
  if (aboutCompany) return aboutCompany;

  const introducedCompany = inferCompanyIntroduction(roleText);
  if (introducedCompany) return normalizeCompanyName(introducedCompany);
  return "";
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
  const description =
    extractSection(roleText, ["description", "summary", "תיאור", "תיאור המשרה"]) ||
    blocks.description.join("\n");
  const labeledResponsibilities = extractList(roleText, ["what you'll do", "what you will do", "what you'll be doing", "responsibilities", "responsibility", "key responsibilities", "your responsibilities", "the role", "תחומי אחריות", "תחומי אחריות מרכזיים", "אחריות", "אחריות מרכזית", "אחריות בתפקיד", "מה תעשה בתפקיד", "מה תעשי בתפקיד", "מה עושים בתפקיד", "מה כולל התפקיד"]);
  const labeledRequirements = extractList(roleText, ["requirements", "must have", "required", "qualifications", "required qualifications", "what you'll bring", "what you bring", "what you'll bring to the team", "what we're looking for", "who you are", "skills", "experience & qualifications", "דרישות", "דרישות התפקיד", "השכלה וניסיון", "ניסיון והשכלה", "ידע וניסיון", "ניסיון וכישורים", "יכולות מקצועיות", "מיומנויות מקצועיות", "מיומנויות אישיות", "כישורים", "כישורים נדרשים"]);
  const blockResponsibilities = blocks.responsibilities.flatMap(splitBlockItems);
  const blockRequirements = blocks.requirements.flatMap(splitBlockItems);
  const responsibilities = blockResponsibilities.length > 0 ? blockResponsibilities : labeledResponsibilities;
  const requirements = blockRequirements.length > 0 ? blockRequirements : labeledRequirements;
  const inferredResponsibilities = responsibilities.length > 0 ? responsibilities : inferListBySignals(roleText, [
    englishResponsibilitySignal,
    hebrewResponsibilitySignal,
  ]);
  const inferredRequirements = requirements.length > 0 ? requirements : inferListBySignals(roleText, [
    englishRequirementSignal,
    hebrewRequirementSignal,
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
  const normalized = normalizeRoleText(message).trim();
  const lower = normalized.toLowerCase();
  const labeledFieldCount = ["company:", "organization:", "title:", "role:", "description:", "responsibilities:", "requirements:", "qualifications:", "skills:"].filter((label) => lower.includes(label)).length;
  const linkedInSectionCount = new Set(
    normalizedHeadingEntries
      .map(({ label }) => normalizeDetectionText(label).toLowerCase())
      .filter((label) => lower.includes(label)),
  ).size;

  if (labeledFieldCount >= 2 || linkedInSectionCount >= 2) return true;

  const conversational = conversationalQuestionSignal.test(normalized)
    || hebrewConversationalQuestionSignal.test(normalized)
    || /\?\s*$/u.test(normalized);
  if (conversational) return false;

  const lines = normalized.split(/\r?\n/).filter(Boolean);
  const hasExactHeading = lines.some((line) => Boolean(matchKnownRoleHeading(line)));
  const hasSingleRoleMarker = /responsibilities|key responsibilities|requirements|qualifications|job description/i.test(message)
    || /דרישות|אחריות|תיאור משרה|תיאור תפקיד/.test(message);
  if ((hasExactHeading && normalized.length >= 80) || hasSingleRoleMarker) return true;
  if (normalized.length < 180) return false;

  const items = splitUnstructuredRoleItems(normalized);
  const hasResponsibility = items.some((item) => englishResponsibilitySignal.test(item) || hebrewResponsibilitySignal.test(item));
  const hasRequirement = items.some((item) => englishRequirementSignal.test(item) || hebrewRequirementSignal.test(item));
  const hasRoleIdentity = Boolean(resolveSourceBackedRoleTitle(normalized, { allowUnframed: false }))
    || items.slice(0, 4).some((item) => isPlausibleRoleTitle(item));
  const hasDocumentStructure = items.length >= 3 || lines.length >= 3;

  return hasDocumentStructure && hasResponsibility && hasRequirement && hasRoleIdentity;
}
