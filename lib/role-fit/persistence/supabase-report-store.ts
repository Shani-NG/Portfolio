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

function readCompletedReportCount(value: unknown): number | null {
  if (!isRecord(value) || typeof value.completed_report_count !== "number") return null;
  const count = value.completed_report_count;
  return Number.isInteger(count) && count >= 0 ? count : null;
}

function logSupabasePersistenceFailure(stage: string, details: Record<string, string | number> = {}) {
  console.warn("[rolefit-supabase-persistence]", { stage, ...details });
}

async function callRpc(functionName: string, body: Record<string, unknown>): Promise<
  | { ok: true; data: unknown }
  | { ok: false; reason: "missing-config" | "request-failed" }
> {
  const config = getConfig();
  if (!config.url || !config.serviceRoleKey) return { ok: false, reason: "missing-config" };

  let response: Response;
  try {
    response = await fetch(`${config.url}/rest/v1/rpc/${functionName}`, {
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
    logSupabasePersistenceFailure("rpc-request-failed", { functionName });
    return { ok: false, reason: "request-failed" };
  }

  if (!response.ok) {
    logSupabasePersistenceFailure("rpc-rejected", { functionName, status: response.status });
    return { ok: false, reason: "request-failed" };
  }

  try {
    return { ok: true, data: await response.json() };
  } catch {
    logSupabasePersistenceFailure("rpc-invalid-json", { functionName });
    return { ok: false, reason: "request-failed" };
  }
}

export async function getPersistedRoleFitCompletedReportCount(sessionId: string): Promise<RoleFitCompletedReportCountResult> {
  const result = await callRpc("rolefit_completed_report_count", { p_session_id: sessionId });
  if (!result.ok) return result;

  if (typeof result.data !== "number" || !Number.isInteger(result.data) || result.data < 0) {
    logSupabasePersistenceFailure("count-invalid-response");
    return { ok: false, reason: "invalid-response" };
  }

  return { ok: true, completedReportCount: result.data };
}

export async function persistRoleFitCompletedReport(input: RoleFitSupabaseReportInput): Promise<RoleFitSupabaseReportPersistenceResult> {
  const result = await callRpc("persist_rolefit_completed_report", {
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
  });
  if (!result.ok) return result;

  const row = Array.isArray(result.data) ? result.data[0] : result.data;
  const completedReportCount = readCompletedReportCount(row);
  if (!isRecord(row) || completedReportCount === null || typeof row.outcome !== "string") {
    logSupabasePersistenceFailure("persist-invalid-response");
    return { ok: false, reason: "invalid-response" };
  }

  if (row.outcome === "persisted" || row.outcome === "duplicate") {
    return { ok: true, outcome: row.outcome, completedReportCount };
  }
  if (row.outcome === "limit_reached") {
    return { ok: false, reason: "limit-reached", completedReportCount };
  }

  logSupabasePersistenceFailure("persist-unknown-outcome");
  return { ok: false, reason: "invalid-response" };
}
