import { NextResponse } from "next/server";
import { normalizedJobCandidateSchema } from "@/lib/job-fit/contracts";
import { evaluateCanonicalJobFit, evaluationKeyForCandidate, prepareCanonicalJobFit } from "@/lib/job-fit/evaluate";
import { isInternalJobFitRequestAuthorized } from "@/lib/job-fit/internal-auth";
import { evaluateJobFitOnce, getCachedJobFitEvaluation, hasInFlightJobFitEvaluation } from "@/lib/job-fit/retry";
import { recordJobEvaluatorCompletion, reserveJobEvaluatorSlot } from "@/lib/job-fit/quota";

export async function POST(request: Request) {
  if (!isInternalJobFitRequestAuthorized(request)) {
    return NextResponse.json({ state: "unauthorized" }, { status: 401 });
  }
  const parsed = normalizedJobCandidateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ state: "validation-failed", reason: "invalid-normalized-candidate" }, { status: 400 });
  }
  const prepared = prepareCanonicalJobFit(parsed.data);
  if (!prepared.ok) return NextResponse.json(prepared.response, { status: 422 });

  const evaluationKey = evaluationKeyForCandidate(parsed.data);
  const cached = getCachedJobFitEvaluation(evaluationKey);
  if (cached) return NextResponse.json(cached, { status: isPersistableEvaluation(cached.state) ? 200 : 422 });

  const quota = await reserveJobEvaluatorSlot(evaluationKey);
  if (!quota.ok) {
    return NextResponse.json(
      { state: quota.reason === "quota-blocked" ? "quota-blocked" : "model-unavailable", reason: quota.reason },
      { status: quota.reason === "quota-blocked" ? 429 : 503 },
    );
  }
  if (quota.outcome === "reused" && !hasInFlightJobFitEvaluation(evaluationKey)) {
    return NextResponse.json(
      { state: "retry-ambiguous", reason: "existing-evaluation-cannot-be-replayed" },
      { status: 409 },
    );
  }
  const result = await evaluateJobFitOnce(evaluationKey, () => evaluateCanonicalJobFit(parsed.data));
  await recordJobEvaluatorCompletion(evaluationKey, result.state);
  return NextResponse.json(result, { status: isPersistableEvaluation(result.state) ? 200 : 422 });
}

function isPersistableEvaluation(state: string) {
  return state === "ready" || state === "insufficient-evidence";
}
