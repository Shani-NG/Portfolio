export type RoleFitSupabaseReportInput = {
  reportId: string;
  sessionId: string;
  roleTitle: string;
  companyName: string;
  roleFamily?: string;
  locationOrWorkModel?: string;
  fitLabel: "Strong" | "Good" | "Partial";
  schemaVersion: string;
  evidenceProjectsUsed: string[];
  contactCtaClicked: boolean;
  reportJson: Record<string, unknown>;
};

type DiagnosticStage = "config" | "client-init" | "rpc" | "response";
type DiagnosticResult = "success" | "failure" | "blocked" | "partial";

type SafePersistenceDiagnostic = {
  target: "report";
  provider: "supabase";
  operation: "completed-report-count" | "completed-report-persist";
  stage: DiagnosticStage;
  result: DiagnosticResult;
  functionName: string;
  sessionId: string;
  reportId?: string;
  errorCategory?: "missing-config" | "invalid-url" | "network" | "api-rejected" | "invalid-json" | "invalid-response";
  httpStatus?: number;
  providerCode?: string;
};

export type RoleFitCompletedReportCountResult =
  | { ok: true; completedReportCount: number }
  | { ok: false; reason: "missing-config" | "request-failed" | "invalid-response" };

export type RoleFitSupabaseReportPersistenceResult =
  | { ok: true; outcome: "persisted" | "duplicate"; completedReportCount: number }
  | { ok: false; reason: "missing-config" | "request-failed" | "invalid-response" | "limit-reached"; completedReportCount?: number };

type SupabaseConfig = {
  url?: string;
  serviceRoleKey?: string;
};

type RpcContext = {
  operation: SafePersistenceDiagnostic["operation"];
  functionName: string;
  sessionId: string;
  reportId?: string;
};

function getConfig(): SupabaseConfig {
  return {
    url: process.env.SUPABASE_URL?.replace(/\/$/, ""),
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function isRoleFitSupabasePersistenceConfigured() {
  const config = getConfig();
  return Boolean(config.url && config.serviceRoleKey);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeProviderCode(value: unknown) {
  if (!isRecord(value) || typeof value.code !== "string") return undefined;
  const code = value.code.trim();
  return /^[A-Za-z0-9_.-]{1,80}$/.test(code) ? code : undefined;
}

function logSupabasePersistenceDiagnostic(context: RpcContext, details: Omit<SafePersistenceDiagnostic, "target" | "provider" | "operation" | "functionName" | "sessionId" | "reportId">) {
  console[details.result === "success" ? "info" : "warn"]("[rolefit-persistence]", {
    target: "report",
    provider: "supabase",
    operation: context.operation,
    functionName: context.functionName,
    sessionId: context.sessionId,
    ...(context.reportId ? { reportId: context.reportId } : {}),
    ...details,
  } satisfies SafePersistenceDiagnostic);
}

function readCompletedReportCount(value: unknown): number | null {
  if (!isRecord(value) || typeof value.completed_report_count !== "number") return null;
  const count = value.completed_report_count;
  return Number.isInteger(count) && count >= 0 ? count : null;
}

async function callRpc(functionName: string, body: Record<string, unknown>, context: RpcContext): Promise<
  | { ok: true; data: unknown }
  | { ok: false; reason: "missing-config" | "request-failed" }
> {
  const config = getConfig();
  if (!config.url || !config.serviceRoleKey) {
    logSupabasePersistenceDiagnostic(context, { stage: "config", result: "failure", errorCategory: "missing-config" });
    return { ok: false, reason: "missing-config" };
  }

  let endpoint: string;
  try {
    endpoint = new URL(`/rest/v1/rpc/${functionName}`, `${config.url}/`).toString();
  } catch {
    logSupabasePersistenceDiagnostic(context, { stage: "client-init", result: "failure", errorCategory: "invalid-url" });
    return { ok: false, reason: "request-failed" };
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    logSupabasePersistenceDiagnostic(context, { stage: "rpc", result: "failure", errorCategory: "network" });
    return { ok: false, reason: "request-failed" };
  }

  if (!response.ok) {
    let providerCode: string | undefined;
    try {
      providerCode = safeProviderCode(await response.clone().json());
    } catch {
      // Response body is intentionally ignored unless its code is safe and structured.
    }
    logSupabasePersistenceDiagnostic(context, {
      stage: "rpc",
      result: response.status === 401 || response.status === 403 ? "blocked" : "failure",
      errorCategory: "api-rejected",
      httpStatus: response.status,
      ...(providerCode ? { providerCode } : {}),
    });
    return { ok: false, reason: "request-failed" };
  }

  try {
    const data = await response.json();
    logSupabasePersistenceDiagnostic(context, { stage: "rpc", result: "success", httpStatus: response.status });
    return { ok: true, data };
  } catch {
    logSupabasePersistenceDiagnostic(context, { stage: "response", result: "failure", errorCategory: "invalid-json", httpStatus: response.status });
    return { ok: false, reason: "request-failed" };
  }
}

export async function getPersistedRoleFitCompletedReportCount(sessionId: string): Promise<RoleFitCompletedReportCountResult> {
  const context: RpcContext = {
    operation: "completed-report-count",
    functionName: "rolefit_completed_report_count",
    sessionId,
  };
  const result = await callRpc(context.functionName, { p_session_id: sessionId }, context);
  if (!result.ok) return result;

  if (typeof result.data !== "number" || !Number.isInteger(result.data) || result.data < 0) {
    logSupabasePersistenceDiagnostic(context, { stage: "response", result: "failure", errorCategory: "invalid-response" });
    return { ok: false, reason: "invalid-response" };
  }

  return { ok: true, completedReportCount: result.data };
}

export async function persistRoleFitCompletedReport(input: RoleFitSupabaseReportInput): Promise<RoleFitSupabaseReportPersistenceResult> {
  const context: RpcContext = {
    operation: "completed-report-persist",
    functionName: "persist_rolefit_completed_report",
    sessionId: input.sessionId,
    reportId: input.reportId,
  };
  const result = await callRpc(context.functionName, {
    p_report_id: input.reportId,
    p_session_id: input.sessionId,
    p_role_title: input.roleTitle,
    p_company_name: input.companyName,
    p_role_family: input.roleFamily ?? "",
    p_location_or_work_model: input.locationOrWorkModel ?? "",
    p_fit_label: input.fitLabel,
    p_schema_version: input.schemaVersion,
    p_evidence_projects_used: input.evidenceProjectsUsed,
    p_contact_cta_clicked: input.contactCtaClicked,
    p_report_json: input.reportJson,
  }, context);
  if (!result.ok) return result;

  const row = Array.isArray(result.data) ? result.data[0] : result.data;
  const completedReportCount = readCompletedReportCount(row);
  if (!isRecord(row) || completedReportCount === null || typeof row.outcome !== "string") {
    logSupabasePersistenceDiagnostic(context, { stage: "response", result: "failure", errorCategory: "invalid-response" });
    return { ok: false, reason: "invalid-response" };
  }

  if (row.outcome === "persisted" || row.outcome === "duplicate") {
    return { ok: true, outcome: row.outcome, completedReportCount };
  }
  if (row.outcome === "limit_reached") {
    logSupabasePersistenceDiagnostic(context, { stage: "rpc", result: "blocked" });
    return { ok: false, reason: "limit-reached", completedReportCount };
  }

  logSupabasePersistenceDiagnostic(context, { stage: "response", result: "failure", errorCategory: "invalid-response" });
  return { ok: false, reason: "invalid-response" };
}
