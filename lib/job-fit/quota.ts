type QuotaResult =
  | { ok: true; outcome: "reserved" | "reused"; dailyCount: number }
  | { ok: false; reason: "quota-blocked" | "configuration" | "persistence" };

function getConfig() {
  return {
    url: process.env.SUPABASE_URL?.replace(/\/$/, ""),
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function getJobEvaluatorDailyLimit() {
  const raw = Number(process.env.JOB_EVALUATOR_DAILY_LIMIT ?? "5");
  return Number.isInteger(raw) && raw > 0 && raw <= 100 ? raw : 5;
}

export async function reserveJobEvaluatorSlot(evaluationKey: string): Promise<QuotaResult> {
  const { url, serviceRoleKey } = getConfig();
  if (!url || !serviceRoleKey) return { ok: false, reason: "configuration" };

  let response: Response;
  try {
    response = await fetch(new URL("/rest/v1/rpc/reserve_job_evaluator_slot", `${url}/`), {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_evaluation_key: evaluationKey, p_daily_limit: getJobEvaluatorDailyLimit() }),
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    return { ok: false, reason: "persistence" };
  }
  if (!response.ok) return { ok: false, reason: "persistence" };

  const payload = await response.json().catch(() => null);
  const row = Array.isArray(payload) ? payload[0] : payload;
  if (!row || typeof row.outcome !== "string" || typeof row.daily_count !== "number") return { ok: false, reason: "persistence" };
  if (row.outcome === "reserved" || row.outcome === "reused") return { ok: true, outcome: row.outcome, dailyCount: row.daily_count };
  if (row.outcome === "limit_reached") return { ok: false, reason: "quota-blocked" };
  return { ok: false, reason: "persistence" };
}
