import { createRoleValidationResult } from "./eligibility.ts";

type RoleSectionKind = "description" | "responsibilities" | "requirements" | "preferred";
export type RoleClarificationField = "company" | "title" | "responsibilities" | "requirements";
export type RoleCorrection = { field: RoleClarificationField; value: string };

const roleSectionHeadings: Array<{ kind: RoleSectionKind; labels: string[] }> = [
  { kind: "description", labels: ["About the job", "About the role", "Job description", "The opportunity", "Overview"] },
  { kind: "responsibilities", labels: ["What You'll Do", "What You Will Do", "Responsibilities", "Key Responsibilities", "Your Responsibilities", "The Role"] },
  {
    kind: "requirements",
    labels: ["Requirements", "What We're Looking For", "What You Have", "Qualifications", "Required Qualifications", "Key Qualifications", "Must Have", "Skills"],
  },
  { kind: "preferred", labels: ["Nice to Have", "Preferred Qualifications", "Bonus Points", "Preferred"] },
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

function roleField(originalValue: string, sourceId: string) {
  return {
    originalValue,
    sourceRef: {
      sourceId,
      kind: "user-text" as const,
    },
    confidence: "medium" as const,
    confirmed: Boolean(originalValue.trim()),
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
    .filter((item) => signals.some((signal) => signal.test(item)));
}

const roleTitleSignal = /\b(ux|ui|user experience|product|design(?:er)?|research(?:er)?|strateg(?:y|ist)|manager|management|lead|director|head|vice president|vp|chief|engineer|developer|architect|analyst|specialist|consultant|coordinator|innovation|implementation|operations)\b/i;
const setupInstructionSignal = /\b(upload|paste|provide|send|share|attach|going to|want to|would like to|job description|role details)\b/i;

export function isPlausibleRoleTitle(value: string): boolean {
  const title = value.trim();
  const words = title.split(/\s+/);

  if (!title || title.length > 100 || words.length > 12) return false;
  if (/[.!?]$/.test(title) || setupInstructionSignal.test(title)) return false;
  if (/^(about|description|responsibilities|requirements|qualifications|skills)\s*:/i.test(title)) return false;

  return roleTitleSignal.test(title);
}

function inferTitle(roleText: string): string {
  const labeledTitle = extractSection(roleText, ["title", "role"]);
  if (labeledTitle) return labeledTitle;

  const normalizedText = normalizeRoleText(roleText);
  const firstHeadingIndex = normalizedText.search(headingPattern);
  const titleSource = firstHeadingIndex > 0 ? normalizedText.slice(0, firstHeadingIndex) : normalizedText;
  const inferredTitle = titleSource
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) =>
      line &&
      !line.startsWith("http") &&
      !line.includes("applicants") &&
      !line.includes("District") &&
      isPlausibleRoleTitle(line),
    );

  return inferredTitle ?? "";
}

const clarificationLabels: Record<RoleClarificationField, string> = {
  company: "Company",
  title: "Title",
  responsibilities: "Responsibilities",
  requirements: "Requirements",
};

export function isValidRoleClarificationAnswer(field: RoleClarificationField, value: string): boolean {
  const answer = value.trim();
  if (!answer || answer.length > 1000) return false;
  if (field === "title") return isPlausibleRoleTitle(answer);
  if (field === "company") return answer.length <= 120 && !/[.!?]\s/.test(answer);
  return answer.length >= 8;
}

export function mergeRoleClarification(roleText: string, field: RoleClarificationField, value: string): string {
  return [roleText.trim(), `${clarificationLabels[field]}: ${value.trim()}`].filter(Boolean).join("\n");
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

export function applyRoleCorrection(roleText: string, correction: RoleCorrection): string {
  const labels: Record<RoleClarificationField, RegExp> = {
    company: /^(?:Company|Organization):.*$/im,
    title: /^(?:Title|Role):.*$/im,
    responsibilities: /^(?:Responsibilities|Responsibility|Key Responsibilities):.*$/im,
    requirements: /^(?:Requirements|Qualifications|Skills):.*$/im,
  };
  const replacement = `${clarificationLabels[correction.field]}: ${correction.value}`;

  return labels[correction.field].test(roleText)
    ? roleText.replace(labels[correction.field], replacement)
    : [roleText.trim(), replacement].filter(Boolean).join("\n");
}

export function resolveRoleTextForValidation(input: {
  message: string;
  savedRoleText?: string;
  pendingField?: RoleClarificationField;
  hasRoleInput: boolean;
  hasReportIntent: boolean;
}): string {
  if (input.savedRoleText && input.pendingField && !input.hasRoleInput) {
    return mergeRoleClarification(input.savedRoleText, input.pendingField, input.message);
  }

  if (input.savedRoleText && !input.pendingField && input.hasReportIntent && !input.hasRoleInput) {
    return input.savedRoleText;
  }

  return input.message;
}

function inferCompany(roleText: string): string {
  const labeledCompany = extractSection(roleText, ["company", "organization"]);
  if (labeledCompany) return labeledCompany;

  const match = roleText.match(/\b([A-Z][A-Z0-9&.-]{1,})\s+is looking\b/);
  return match?.[1] ?? "";
}

export function createRoleDraftFromText(roleText: string) {
  const sourceId = "role_input_current_request";
  const company = inferCompany(roleText);
  const title = inferTitle(roleText);
  const blocks = extractSectionBlocks(roleText);
  const description =
    extractSection(roleText, ["description", "summary"]) ||
    blocks.description.join("\n");
  const labeledResponsibilities = extractList(roleText, ["responsibilities", "responsibility", "key responsibilities"]);
  const labeledRequirements = extractList(roleText, ["requirements", "must have", "required", "qualifications", "skills"]);
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

  return {
    company: roleField(company, sourceId),
    title: roleField(title, sourceId),
    description: roleField(description, sourceId),
    responsibilities: inferredResponsibilities.map((item) => roleField(item, sourceId)),
    requirements: inferredRequirements.map((item) => roleField(item, sourceId)),
    preferredQualifications: preferredQualifications.map((item) => roleField(item, sourceId)),
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

export function looksLikeReportIntent(message: string) {
  return /\b(report|fit|match|role fit|analy[sz]e|analysis)\b/i.test(message) || /דוח|דו"ח|דו״ח|התאמה|מתאימ|נתח|משרה|תפקיד/.test(message);
}

export function shouldValidateRoleCollectionMessage(input: {
  message: string;
  roleCollectionActive: boolean;
}) {
  return looksLikeRoleInput(input.message)
    || (input.roleCollectionActive && isPlausibleRoleTitle(input.message));
}

export function looksLikeRoleInput(message: string) {
  const lower = normalizeRoleText(message).toLowerCase();
  const labeledFieldCount = ["company:", "organization:", "title:", "role:", "description:", "responsibilities:", "requirements:", "qualifications:", "skills:"].filter((label) => lower.includes(label)).length;
  const linkedInSectionCount = normalizedHeadingEntries.filter(({ label }) => lower.includes(label.toLowerCase())).length;

  return labeledFieldCount >= 2 || linkedInSectionCount >= 2 || /responsibilities|key responsibilities|requirements|qualifications|job description/i.test(message) || /דרישות|אחריות|תיאור משרה|תיאור תפקיד/.test(message);
}
