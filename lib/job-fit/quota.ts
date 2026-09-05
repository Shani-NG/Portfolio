import type { JobFitProviderDiagnostics } from "./contracts";

type QuotaResult =
  | { ok: true; outcome: "reserved" | "retry_reserved"; dailyCount: number; attemptToken: string; leaseExpiresAt: string }
  | { ok: true; outcome: "in_progress"; dailyCount: number; retryAfterSeconds: number; leaseExpiresAt: string }
  | { ok: false; reason: "quota-blocked" | "configuration" | "persistence" };

export type JobEvaluatorCompletionState = "ready" | "rejected" | "insufficient-evidence" | "validation-failed" | "quota-blocked" | "model-unavailable";

function getConfig() {
  return {
    url: process.env.SUPABASE_URL?.replace(/\/$/, ""),
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function getJobEvaluatorDailyLimit() {
  const raw = Number(process.env.JOB_EVALUATOR_DAILY_LIMIT);
  return raw === 5 ? raw : undefined;
}

async function callJobEvaluatorRpc(functionName: string, body: Record<string, unknown>) {
  const { url, serviceRoleKey } = getConfig();
  if (!url || !serviceRoleKey) return { ok: false as const, reason: "configuration" as const };

  let response: Response;
  try {
    response = await fetch(new URL(`/rest/v1/rpc/${functionName}`, `${url}/`), {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    return { ok: false as const, reason: "persistence" as const };
  }
  if (!response.ok) return { ok: false as const, reason: "persistence" as const };
  return { ok: true as const, payload: await response.json().catch(() => null) };
}

export async function reserveJobEvaluatorSlot(evaluationKey: string): Promise<QuotaResult> {
  const dailyLimit = getJobEvaluatorDailyLimit();
  if (!dailyLimit) return { ok: false, reason: "configuration" };
  const rpc = await callJobEvaluatorRpc("reserve_job_evaluator_slot_v2", { p_evaluation_key: evaluationKey, p_daily_limit: dailyLimit });
  if (!rpc.ok) return rpc;
  const payload = rpc.payload;
  const row = Array.isArray(payload) ? payload[0] : payload;
  if (!row || typeof row.outcome !== "string" || typeof row.daily_count !== "number") return { ok: false, reason: "persistence" };
  if (row.outcome === "reserved" || row.outcome === "retry_reserved") {
    if (typeof row.attempt_token !== "string" || !row.attempt_token || typeof row.lease_expires_at !== "string") {
      return { ok: false, reason: "persistence" };
    }
    return { ok: true, outcome: row.outcome, dailyCount: row.daily_count, attemptToken: row.attempt_token, leaseExpiresAt: row.lease_expires_at };
  }
  if (row.outcome === "in_progress") {
    if (typeof row.retry_after_seconds !== "number" || typeof row.lease_expires_at !== "string") {
      return { ok: false, reason: "persistence" };
    }
    return {
      ok: true,
      outcome: "in_progress",
      dailyCount: row.daily_count,
      retryAfterSeconds: Math.max(1, Math.ceil(row.retry_after_seconds)),
      leaseExpiresAt: row.lease_expires_at,
    };
  }
  if (row.outcome === "limit_reached") return { ok: false, reason: "quota-blocked" };
  return { ok: false, reason: "persistence" };
}

export async function recordJobEvaluatorCompletion(
  evaluationKey: string,
  state: JobEvaluatorCompletionState,
  attemptToken: string,
  diagnostics: JobFitProviderDiagnostics = {},
) {
  const rpc = await callJobEvaluatorRpc("complete_job_evaluator_evaluation_v2", {
    p_evaluation_key: evaluationKey,
    p_outcome: state,
    p_attempt_token: attemptToken,
    p_diagnostics: diagnostics,
  });
  if (!rpc.ok) return rpc;
  const value = Array.isArray(rpc.payload) ? rpc.payload[0] : rpc.payload;
  return typeof value === "boolean"
    ? { ok: true as const, accepted: value }
    : { ok: false as const, reason: "persistence" as const };
}
