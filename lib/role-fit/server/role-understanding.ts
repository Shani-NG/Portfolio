import { createRoleValidationResult } from "./eligibility.ts";

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

function extractSection(roleText: string, labels: string[]): string {
  const lines = roleText.split(/\r?\n/).map((line) => line.trim());

  for (const label of labels) {
    const match = lines.find((line) => line.toLowerCase().startsWith(`${label.toLowerCase()}:`));
    if (match) return match.slice(label.length + 1).trim();
  }

  return "";
}

function extractBlock(roleText: string, startLabels: string[], endLabels: string[]): string {
  const lines = roleText.split(/\r?\n/);
  const startIndex = lines.findIndex((line) => startLabels.some((label) => line.trim().toLowerCase() === label.toLowerCase()));

  if (startIndex < 0) return "";

  const endIndex = lines.findIndex((line, index) => index > startIndex && endLabels.some((label) => line.trim().toLowerCase() === label.toLowerCase()));
  return lines
    .slice(startIndex + 1, endIndex > startIndex ? endIndex : undefined)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

function splitBlockItems(block: string): string[] {
  return block
    .split(/\n|;|•/)
    .map((item) => item.trim())
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

  const firstMeaningfulLine = roleText
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
  const description =
    extractSection(roleText, ["description", "summary"]) ||
    extractBlock(roleText, ["About the job"], ["What You'll Do", "What You’ll Do", "What We're Looking For", "What We’re Looking For", "Nice to Have", "What We Offer"]);
  const labeledResponsibilities = extractList(roleText, ["responsibilities", "responsibility"]);
  const labeledRequirements = extractList(roleText, ["requirements", "must have", "required"]);
  const responsibilities = labeledResponsibilities.length > 0
    ? labeledResponsibilities
    : splitBlockItems(extractBlock(roleText, ["What You'll Do", "What You’ll Do"], ["What We're Looking For", "What We’re Looking For", "Nice to Have", "What We Offer"]));
  const requirements = labeledRequirements.length > 0
    ? labeledRequirements
    : splitBlockItems(extractBlock(roleText, ["What We're Looking For", "What We’re Looking For"], ["Nice to Have", "What We Offer"]));

  return {
    company: roleField(company, sourceId),
    title: roleField(title, sourceId),
    description: roleField(description, sourceId),
    responsibilities: responsibilities.map((item) => roleField(item, sourceId)),
    requirements: requirements.map((item) => roleField(item, sourceId)),
    preferredQualifications: [],
  };
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
  const lower = message.toLowerCase();
  const labeledFieldCount = ["company:", "organization:", "title:", "role:", "description:", "responsibilities:", "requirements:"].filter((label) => lower.includes(label)).length;
  const linkedInSectionCount = ["about the job", "what you'll do", "what you’ll do", "what we're looking for", "what we’re looking for"].filter((label) => lower.includes(label)).length;

  return labeledFieldCount >= 2 || linkedInSectionCount >= 2 || /responsibilities|requirements|qualifications|job description/i.test(message) || /דרישות|אחריות|תיאור משרה|תיאור תפקיד/.test(message);
}
