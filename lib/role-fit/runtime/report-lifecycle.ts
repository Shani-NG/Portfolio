export type ReportLifecycleBoundary =
  | "api-received"
  | "before-provider"
  | "provider-attempt"
  | "provider-call"
  | "provider-content"
  | "output-validation"
  | "composition"
  | "persistence"
  | "response"
  | "client-response"
  | "display";

export type ReportLifecycleOutcome = "started" | "success" | "failure" | "blocked" | "degraded";

export type ReportLifecycleRecord = {
  boundary: ReportLifecycleBoundary;
  outcome: ReportLifecycleOutcome;
  reportId: string;
  traceId?: string;
  attempt?: number;
  provider?: string;
  model?: string;
  failureCategory?: string;
  httpStatus?: number;
};

export function logReportLifecycle(record: ReportLifecycleRecord) {
  console.info("[rolefit-report-lifecycle]", record);
}
