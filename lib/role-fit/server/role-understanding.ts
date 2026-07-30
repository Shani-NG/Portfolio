import { createRoleValidationResult } from "./eligibility.ts";

type RoleSectionKind = "description" | "responsibilities" | "requirements" | "preferred";

const roleSectionHeadings: Array<{ kind: RoleSectionKind; labels: string[] }> = [
  { kind: "description", labels: ["About the job", "About the role", "Job description", "The opportunity"] },
  { kind: "responsibilities", labels: ["What You'll Do", "What You’ll Do", "What You Will Do", "Responsibilities", "Your Responsibilities"] },
  {
    kind: "requirements",
    labels: ["Requirements", "What We're Looking For", "What We’re Looking For", "What You Have", "Qualifications", "Required Qualifications", "Must Have"],
  },
  { kind: "preferred", labels: ["Nice to Have", "Preferred Qualifications", "Bonus Points", "Preferred"] },
];

const normalizedHeadingEntries = roleSectionHeadings.flatMap((section) =>
  section.labels.map((label) => ({ kind: section.kind, label: label.replaceAll("’", "'") })),
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
  return roleText.replaceAll("’", "'").replaceAll("–", "-").replaceAll("—", "-");
}

function extractSection(roleText: string, labels: string[]): string {
  const lines = normalizeRoleText(roleText).split(/\r?\n/).map((line) => line.trim());

  for (const label of labels) {
    const normalizedLabel = label.replaceAll("’", "'");
    const match = lines.find((line) => line.toLowerCase().startsWith(`${normalizedLabel.toLowerCase()}:`));
    if (match) return match.slice(normalizedLabel.length + 1).trim();
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
    .split(/\r?\n|;|•|·/)
    .map((item) => item.replace(/^\s*[-*]\s*/, "").trim())
    .filter(Boolean);
}

function extractList(roleText: string, labels: string[]): string[] {
  const value = extractSection(roleText, labels);
  if (!value) return [];

  return splitBlockItems(value);
}

function inferTitle(roleText: string): string {
  const labeledTitle = extractSection(roleText, ["title", "role"]);
  if (labeledTitle) return labeledTitle;

  const normalizedText = normalizeRoleText(roleText);
  const firstHeadingIndex = normalizedText.search(headingPattern);
  const titleSource = firstHeadingIndex > 0 ? normalizedText.slice(0, firstHeadingIndex) : normalizedText;
  const firstMeaningfulLine = titleSource
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("http") && !line.includes("applicants") && !line.includes("District"));

  return firstMeaningfulLine ?? "";
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
  const labeledResponsibilities = extractList(roleText, ["responsibilities", "responsibility"]);
  const labeledRequirements = extractList(roleText, ["requirements", "must have", "required"]);
  const responsibilities = labeledResponsibilities.length > 0
    ? labeledResponsibilities
    : blocks.responsibilities.flatMap(splitBlockItems);
  const requirements = labeledRequirements.length > 0
    ? labeledRequirements
    : blocks.requirements.flatMap(splitBlockItems);
  const preferredQualifications = blocks.preferred.flatMap(splitBlockItems);

  return {
    company: roleField(company, sourceId),
    title: roleField(title, sourceId),
    description: roleField(description, sourceId),
    responsibilities: responsibilities.map((item) => roleField(item, sourceId)),
    requirements: requirements.map((item) => roleField(item, sourceId)),
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
  return /\b(report|fit|match|role fit|analy[sz]e|analysis)\b/i.test(message) || /דוח|התאמה|מתאימ|נתח|משרה|תפקיד/.test(message);
}

export function looksLikeRoleInput(message: string) {
  const lower = normalizeRoleText(message).toLowerCase();
  const labeledFieldCount = ["company:", "organization:", "title:", "role:", "description:", "responsibilities:", "requirements:"].filter((label) => lower.includes(label)).length;
  const linkedInSectionCount = normalizedHeadingEntries.filter(({ label }) => lower.includes(label.toLowerCase())).length;

  return labeledFieldCount >= 2 || linkedInSectionCount >= 2 || /responsibilities|requirements|qualifications|job description/i.test(message) || /דרישות|אחריות|תיאור משרה|תיאור תפקיד/.test(message);
}
