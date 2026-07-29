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

function extractList(roleText: string, labels: string[]): string[] {
  const value = extractSection(roleText, labels);
  if (!value) return [];

  return value
    .split(/[;•\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function createRoleDraftFromText(roleText: string) {
  const sourceId = "role_input_current_request";
  const company = extractSection(roleText, ["company", "organization"]);
  const title = extractSection(roleText, ["title", "role"]);
  const description = extractSection(roleText, ["description", "summary"]);
  const responsibilities = extractList(roleText, ["responsibilities", "responsibility"]);
  const requirements = extractList(roleText, ["requirements", "must have", "required"]);

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

  return labeledFieldCount >= 2 || /responsibilities|requirements|qualifications|job description/i.test(message) || /דרישות|אחריות|תיאור משרה|תיאור תפקיד/.test(message);
}
