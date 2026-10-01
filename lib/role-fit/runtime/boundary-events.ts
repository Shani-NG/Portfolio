import { z } from "zod";

export const roleFitBoundaryEvents = [
  "rolefit.confirmation_yes_received",
  "rolefit.confirmation_yes_routed_to_report",
  "rolefit.confirmation_yes_fell_through_to_chat",
  "rolefit.request_report_entered",
  "rolefit.generating_report_state_set",
  "rolefit.report_post_started",
  "rolefit.report_post_failed",
  "rolefit.report_api_validation_started",
  "rolefit.report_api_validation_completed",
  "rolefit.provider_call_started",
  "rolefit.provider_call_completed",
  "rolefit.provider_call_failed",
  "rolefit.report_persisted",
  "rolefit.report_persistence_failed",
  "rolefit.report_ready_state_set",
  "rolefit.report_display_state_reached",
  "rolefit.cta_clicked",
  "rolefit.cta_missing_active_draft",
  "rolefit.cta_revalidated_draft",
] as const;

export type RoleFitBoundaryEventName = (typeof roleFitBoundaryEvents)[number];

export const roleFitClientBoundaryEvents = [
  "rolefit.confirmation_yes_received",
  "rolefit.confirmation_yes_routed_to_report",
  "rolefit.confirmation_yes_fell_through_to_chat",
  "rolefit.request_report_entered",
  "rolefit.generating_report_state_set",
  "rolefit.report_post_started",
  "rolefit.report_post_failed",
  "rolefit.report_ready_state_set",
  "rolefit.report_display_state_reached",
  "rolefit.cta_clicked",
  "rolefit.cta_missing_active_draft",
  "rolefit.cta_revalidated_draft",
] as const;

export type RoleFitClientBoundaryEventName = (typeof roleFitClientBoundaryEvents)[number];

export type RoleFitBoundaryDecision =
  | "request-report"
  | "chat-fall-through"
  | "missing-draft"
  | "revalidate-draft"
  | "revalidation-complete"
  | "revalidation-incomplete"
  | "revalidation-error"
  | "report-ready"
  | "already-in-flight"
  | "agent-unavailable"
  | "report-api-error"
  | "report-payload-invalid"
  | "report-request-exception";

export type RoleFitBoundaryValidationStatus =
  | "not-checked"
  | "valid-complete"
  | "incomplete"
  | "invalid";

export type RoleFitBoundaryClientState =
  | "initial"
  | "general-qa"
  | "awaiting-role-completion"
  | "awaiting-report-confirmation"
  | "generating-report"
  | "report-ready"
  | "recoverable-error";

export type RoleFitBoundarySnapshot = {
  roleDraftPresent: boolean;
  roleDraftValidationStatus: RoleFitBoundaryValidationStatus;
  pendingReportConfirmation: boolean;
  reportPayloadPresent: boolean;
  clientState: RoleFitBoundaryClientState;
  revalidationAttempted?: boolean;
  routingDecision?: RoleFitBoundaryDecision;
  providerPhase?: "initial" | "composition-repair";
  httpStatus?: number;
  persistenceOutcome?: "limit-reached" | "missing-config" | "request-failed" | "invalid-response" | "invalid-payload";
};

export const roleFitClientBoundaryEventSchema = z.object({
  eventName: z.enum(roleFitClientBoundaryEvents),
  sessionId: z.string().regex(/^session_[A-Za-z0-9_-]{8,100}$/),
  correlationId: z.uuid(),
  reportId: z.string().regex(/^R[A-Z0-9]{4}$/).optional(),
  clientTimestamp: z.iso.datetime(),
  snapshot: z.object({
    roleDraftPresent: z.boolean(),
    roleDraftValidationStatus: z.enum(["not-checked", "valid-complete", "incomplete", "invalid"]),
    pendingReportConfirmation: z.boolean(),
    reportPayloadPresent: z.boolean(),
    clientState: z.enum([
      "initial", "general-qa", "awaiting-role-completion", "awaiting-report-confirmation",
      "generating-report", "report-ready", "recoverable-error",
    ]),
    revalidationAttempted: z.boolean().optional(),
    routingDecision: z.enum([
      "request-report", "chat-fall-through", "missing-draft", "revalidate-draft",
      "revalidation-complete", "revalidation-incomplete", "revalidation-error",
      "report-ready", "already-in-flight", "agent-unavailable",
      "report-api-error", "report-payload-invalid", "report-request-exception",
    ]).optional(),
    httpStatus: z.number().int().min(100).max(599).optional(),
  }).strict(),
}).strict();
