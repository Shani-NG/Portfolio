import type { EligibilityResult, RoleValidationResult, SessionRecord } from "../contracts/index.ts";
import { eligibilityResultSchema, roleDraftSchema, roleFieldSchema, roleValidationResultSchema } from "../contracts/index.ts";
import { z } from "zod";

type RequiredRoleField = "company" | "title" | "description" | "responsibilities" | "requirements";

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

const requiredFields: RequiredRoleField[] = ["company", "title", "description", "responsibilities", "requirements"];
const textRoleFieldSchema = roleFieldSchema(z.string());

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

export function getMissingRequiredRoleFields(roleDraft: RoleDraftInput): RequiredRoleField[] {
  const missing: RequiredRoleField[] = [];

  if (!hasConfirmedTextField(roleDraft.company)) missing.push("company");
  if (!hasConfirmedTextField(roleDraft.title)) missing.push("title");
  if (!hasConfirmedTextField(roleDraft.description)) missing.push("description");
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

  return roleValidationResultSchema.parse({
    identifiers: {
      conversationId: input.conversationId,
      traceId: input.traceId,
    },
    parseStatus: missingFields.length === 0 ? "valid-complete" : "valid-incomplete",
    roleDraft: parsedRoleDraft.data,
    missingFields,
    detectedLanguage: input.detectedLanguage,
    recommendedNextAction: missingFields.length === 0 ? "role-ready" : "ask-for-missing-field",
    nextQuestionKey: missingFields.length === 0 ? undefined : "role.missing_required_fields",
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
