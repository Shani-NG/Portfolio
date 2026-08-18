import type { EligibilityResult, ReportUIPayload, RoleValidationResult, SessionRecord } from "../contracts/index.ts";
import { eligibilityResultSchema, roleDraftSchema, roleFieldSchema, roleValidationResultSchema } from "../contracts/index.ts";
import { z } from "zod";

type RequiredRoleField = "title" | "responsibilities" | "requirements";

type RoleDraftInput = {
  company?: unknown;
  title?: unknown;
  description?: unknown;
  responsibilities?: unknown;
  requirements?: unknown;
  seniority?: unknown;
  yearsOfExperience?: unknown;
  location?: unknown;
  workModel?: unknown;
  employmentType?: unknown;
  preferredQualifications?: unknown;
};

type ReportEligibilityInput = {
  session: Pick<SessionRecord, "status" | "completedReportCount">;
  approval: {
    approved: boolean;
  };
  evidenceState: "ready" | "insufficient-evidence" | "no-meaningful-fit";
  report?: unknown;
};

export function evidenceStateFromComposedReport(report: Pick<ReportUIPayload, "overallFitVisual">): ReportEligibilityInput["evidenceState"] {
  if (report.overallFitVisual.mode === "insufficient") return "insufficient-evidence";
  if (report.overallFitVisual.mode === "out-of-scope") return "no-meaningful-fit";
  return "ready";
}

const requiredFields: RequiredRoleField[] = ["title", "responsibilities", "requirements"];
const textRoleFieldSchema = roleFieldSchema(z.string());
const nonRoleInstructionPattern = /\b(ignore previous|system prompt|developer message|jailbreak|bypass|act as|disregard|you are chatgpt|reveal|do not validate)\b/i;

function hasConfirmedTextField(value: unknown): boolean {
  const parsed = textRoleFieldSchema.safeParse(value);
  if (!parsed.success) return false;

  return parsed.data.confirmed && Boolean(parsed.data.originalValue.trim());
}

function hasConfirmedListItem(value: unknown): boolean {
  if (!Array.isArray(value)) return false;

  return value.some((item) => {
    const parsed = textRoleFieldSchema.safeParse(item);
    if (!parsed.success) return false;

    return parsed.data.confirmed && Boolean(parsed.data.originalValue.trim());
  });
}

function meaningfulListItems(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    const parsed = textRoleFieldSchema.safeParse(item);
    if (!parsed.success) return [];

    const text = parsed.data.originalValue.trim();
    if (!parsed.data.confirmed || text.length < 18 || nonRoleInstructionPattern.test(text)) return [];

    return [text];
  });
}

function isSufficientJobDescription(roleDraft: RoleDraftInput): boolean {
  const responsibilities = meaningfulListItems(roleDraft.responsibilities);
  const requirements = meaningfulListItems(roleDraft.requirements);
  const totalRoleSignals = responsibilities.length + requirements.length;

  return totalRoleSignals >= 2 && responsibilities.length >= 1 && requirements.length >= 1;
}

export function getMissingRequiredRoleFields(roleDraft: RoleDraftInput): RequiredRoleField[] {
  const missing: RequiredRoleField[] = [];

  if (!hasConfirmedTextField(roleDraft.title)) missing.push("title");
  if (!hasConfirmedListItem(roleDraft.responsibilities)) missing.push("responsibilities");
  if (!hasConfirmedListItem(roleDraft.requirements)) missing.push("requirements");

  return missing;
}

export function createRoleValidationResult(input: {
  conversationId: string;
  traceId: string;
  roleDraft: unknown;
  detectedLanguage: "he" | "en" | "mixed";
}): RoleValidationResult {
  const parsedRoleDraft = roleDraftSchema.safeParse(input.roleDraft);

  if (!parsedRoleDraft.success) {
    return roleValidationResultSchema.parse({
      identifiers: {
        conversationId: input.conversationId,
        traceId: input.traceId,
      },
      parseStatus: "valid-incomplete",
      roleDraft: {
        responsibilities: [],
        requirements: [],
        preferredQualifications: [],
      },
      missingFields: requiredFields,
      detectedLanguage: input.detectedLanguage,
      recommendedNextAction: "ask-for-missing-field",
      nextQuestionKey: "role.missing_required_fields",
    });
  }

  const missingFields = getMissingRequiredRoleFields(parsedRoleDraft.data);

  const parseStatus = missingFields.length === 0
    ? isSufficientJobDescription(parsedRoleDraft.data)
      ? "valid-complete"
      : "valid-incomplete"
    : "valid-incomplete";
  const resolvedMissingFields = missingFields.length === 0 && parseStatus !== "valid-complete"
    ? ["responsibilities", "requirements"] as RequiredRoleField[]
    : missingFields;

  return roleValidationResultSchema.parse({
    identifiers: {
      conversationId: input.conversationId,
      traceId: input.traceId,
    },
    parseStatus,
    roleDraft: parsedRoleDraft.data,
    missingFields: resolvedMissingFields,
    detectedLanguage: input.detectedLanguage,
    recommendedNextAction: parseStatus === "valid-complete" ? "role-ready" : "ask-for-missing-field",
    nextQuestionKey: parseStatus === "valid-complete" ? undefined : "role.missing_required_fields",
  });
}

export function canProceedToReportEligibility(validation: RoleValidationResult): boolean {
  return validation.parseStatus === "valid-complete" && validation.missingFields.length === 0;
}

export function evaluateReportEligibility(input: ReportEligibilityInput): EligibilityResult {
  if (input.session.status === "expired") {
    return eligibilityResultSchema.parse({
      state: "blocked",
      reason: "session-expired",
      safeMessageKey: "report.session_expired",
    });
  }

  if (input.session.completedReportCount >= 2) {
    return eligibilityResultSchema.parse({
      state: "blocked",
      reason: "report-limit-reached",
      safeMessageKey: "report.limit_reached",
    });
  }

  if (!input.approval.approved) {
    return eligibilityResultSchema.parse({
      state: "blocked",
      reason: "approval-missing",
      safeMessageKey: "report.approval_missing",
    });
  }

  if (input.evidenceState === "insufficient-evidence") {
    return eligibilityResultSchema.parse({
      state: "no-report",
      reason: "insufficient-evidence",
      safeMessageKey: "report.insufficient_evidence",
    });
  }

  if (input.evidenceState === "no-meaningful-fit") {
    return eligibilityResultSchema.parse({
      state: "no-report",
      reason: "no-meaningful-fit",
      safeMessageKey: "report.no_meaningful_fit",
    });
  }

  return eligibilityResultSchema.parse({
    state: "ready",
    report: input.report,
  });
}
