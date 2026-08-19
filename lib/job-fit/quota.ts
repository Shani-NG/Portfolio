type QuotaResult =
  | { ok: true; outcome: "reserved" | "reused"; dailyCount: number }
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
  return Number.isInteger(raw) && raw > 0 && raw <= 100 ? raw : undefined;
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
  const rpc = await callJobEvaluatorRpc("reserve_job_evaluator_slot", { p_evaluation_key: evaluationKey, p_daily_limit: dailyLimit });
  if (!rpc.ok) return rpc;
  const payload = rpc.payload;
  const row = Array.isArray(payload) ? payload[0] : payload;
  if (!row || typeof row.outcome !== "string" || typeof row.daily_count !== "number") return { ok: false, reason: "persistence" };
  if (row.outcome === "reserved" || row.outcome === "reused") return { ok: true, outcome: row.outcome, dailyCount: row.daily_count };
  if (row.outcome === "limit_reached") return { ok: false, reason: "quota-blocked" };
  return { ok: false, reason: "persistence" };
}

export async function recordJobEvaluatorCompletion(evaluationKey: string, state: JobEvaluatorCompletionState) {
  const rpc = await callJobEvaluatorRpc("complete_job_evaluator_evaluation", {
    p_evaluation_key: evaluationKey,
    p_outcome: state,
  });
  if (!rpc.ok) return rpc;
  const value = Array.isArray(rpc.payload) ? rpc.payload[0] : rpc.payload;
  return value === true ? { ok: true as const } : { ok: false as const, reason: "persistence" as const };
}
