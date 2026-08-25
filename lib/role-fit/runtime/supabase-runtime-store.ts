export type RuntimeEventName =
  | "intent.detected"
  | "role.classified"
  | "role.validation_failed"
  | "role.clarification_requested"
  | "report.limit_blocked"
  | "report.generation_started"
  | "report.validation_completed"
  | "report.completed"
  | "report.no_meaningful_fit"
  | "report.insufficient_evidence"
  | "report.failed"
  | "error.occurred";

type RuntimeMode = "portfolio-qa" | "role-understanding" | "fit-analysis" | "report-follow-up";
type RuntimeOutcome = "success" | "failure" | "blocked" | "partial";
type SafeMetadata = Record<string, string | number | boolean | null | undefined>;
type DiagnosticStage = "config" | "client-init" | "rpc" | "response";
type DiagnosticResult = "success" | "failure" | "blocked" | "partial";
type DiagnosticTarget = "runtime-event" | "lead";
type DiagnosticOperation = "runtime-event-persist" | "lead-persist";

export type RoleFitRuntimeEvent = {
  eventName: RuntimeEventName;
  conversationId?: string;
  sessionId?: string;
  reportId?: string;
  traceId?: string;
  correlationId?: string;
  mode?: RuntimeMode;
  outcome: RuntimeOutcome;
  durationMs?: number;
  metadata?: SafeMetadata;
};

export type ContactLeadPersistenceInput = {
  leadId: string;
  name: string;
  email: string;
  companyName: string;
  message: string;
  sourceContext: "direct-contact-page" | "role-fit-report-cta" | "portfolio-cta" | "unknown";
  reportId?: string;
};

type SafePersistenceDiagnostic = {
  target: DiagnosticTarget;
  provider: "supabase";
  operation: DiagnosticOperation;
  stage: DiagnosticStage;
  result: DiagnosticResult;
  functionName: string;
  sessionId?: string;
  reportId?: string;
  correlationId?: string;
  errorCategory?: "missing-config" | "invalid-url" | "network" | "api-rejected" | "invalid-json" | "invalid-response";
  httpStatus?: number;
  providerCode?: string;
};

type RpcContext = {
  target: DiagnosticTarget;
  operation: DiagnosticOperation;
  functionName: string;
  sessionId?: string;
  reportId?: string;
  correlationId?: string;
};

type SupabaseConfig = {
  url?: string;
  serviceRoleKey?: string;
};

type PersistenceFailureReason = "missing-config" | "request-failed" | "invalid-response";

function getConfig(): SupabaseConfig {
  return {
    url: process.env.SUPABASE_URL?.replace(/\/$/, ""),
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeProviderCode(value: unknown) {
  if (!isRecord(value) || typeof value.code !== "string") return undefined;
  const code = value.code.trim();
  return /^[A-Za-z0-9_.-]{1,80}$/.test(code) ? code : undefined;
}

function safeString(value: unknown) {
  return typeof value === "string" ? value.slice(0, 120) : undefined;
}

function safeMetadata(metadata: SafeMetadata | undefined) {
  if (!metadata) return {};
  const allowedKeys = new Set([
    "provider", "model", "parseStatus", "repeatedInput", "missingField", "completedReportCount",
    "maxReportsPerSession", "language", "fitMode", "evidenceConfidence",
    "persistenceState", "persistenceReason", "providerStatus", "retryable", "retryAfterSeconds",
  ]);
  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([key]) => allowedKeys.has(key))
      .filter(([, value]) => value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean")
      .map(([key, value]) => [key, typeof value === "string" ? value.slice(0, 120) : value]),
  );
}

function logSupabasePersistenceDiagnostic(
  context: RpcContext,
  details: Omit<SafePersistenceDiagnostic, "target" | "provider" | "operation" | "functionName" | "sessionId" | "reportId" | "correlationId">,
) {
  console[details.result === "success" ? "info" : "warn"]("[rolefit-persistence]", {
    target: context.target,
    provider: "supabase",
    operation: context.operation,
    functionName: context.functionName,
    ...(context.sessionId ? { sessionId: context.sessionId } : {}),
    ...(context.reportId ? { reportId: context.reportId } : {}),
    ...(context.correlationId ? { correlationId: context.correlationId } : {}),
    ...details,
  } satisfies SafePersistenceDiagnostic);
}

async function callRpc(functionName: string, body: Record<string, unknown>, context: RpcContext): Promise<
  | { ok: true; data: unknown }
  | { ok: false; reason: PersistenceFailureReason }
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
      // Error bodies are intentionally ignored unless their code is safe and structured.
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

function isSuccessfulRpcResponse(value: unknown) {
  return value === true || (Array.isArray(value) && value[0] === true);
}

export async function logRoleFitEvent(event: RoleFitRuntimeEvent) {
  const context: RpcContext = {
    target: "runtime-event",
    operation: "runtime-event-persist",
    functionName: "persist_rolefit_runtime_event",
    sessionId: event.sessionId,
    reportId: event.reportId,
    correlationId: event.correlationId ?? event.traceId ?? event.conversationId,
  };
  const result = await callRpc(context.functionName, {
    p_session_id: event.sessionId ?? "",
    p_event_name: event.eventName,
    p_mode: event.mode ?? "",
    p_status: event.outcome,
    p_report_id: event.reportId ?? "",
    p_duration_ms: event.durationMs ?? null,
    p_provider: safeString(event.metadata?.provider) ?? "",
    p_model: safeString(event.metadata?.model) ?? "",
    p_error_code: safeString(event.metadata?.safeMessageKey) ?? "",
    p_details: safeMetadata(event.metadata),
  }, context);

  if (!result.ok) return result;
  if (!isSuccessfulRpcResponse(result.data)) {
    logSupabasePersistenceDiagnostic(context, { stage: "response", result: "failure", errorCategory: "invalid-response" });
    return { ok: false as const, reason: "invalid-response" as const };
  }
  return { ok: true as const };
}

export async function persistContactLeadToSupabase(input: ContactLeadPersistenceInput) {
  const context: RpcContext = {
    target: "lead",
    operation: "lead-persist",
    functionName: "persist_rolefit_contact_lead",
    reportId: input.reportId || undefined,
    correlationId: input.leadId,
  };
  const result = await callRpc(context.functionName, {
    p_lead_id: input.leadId,
    p_name: input.name,
    p_email: input.email,
    p_company_name: input.companyName,
    p_message: input.message,
    p_source_context: input.sourceContext,
    p_report_id: input.reportId ?? "",
  }, context);

  if (!result.ok) return result;
  if (!isSuccessfulRpcResponse(result.data)) {
    logSupabasePersistenceDiagnostic(context, { stage: "response", result: "failure", errorCategory: "invalid-response" });
    return { ok: false as const, reason: "invalid-response" as const };
  }
  return { ok: true as const };
}
