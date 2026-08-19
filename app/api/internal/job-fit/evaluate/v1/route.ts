import { NextResponse } from "next/server";
import { normalizedJobCandidateSchema } from "@/lib/job-fit/contracts";
import { evaluateCanonicalJobFit, evaluationKeyForCandidate, prepareCanonicalJobFit } from "@/lib/job-fit/evaluate";
import { isInternalJobFitRequestAuthorized } from "@/lib/job-fit/internal-auth";
import { reserveJobEvaluatorSlot } from "@/lib/job-fit/quota";

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

  const quota = await reserveJobEvaluatorSlot(evaluationKeyForCandidate(parsed.data));
  if (!quota.ok) {
    return NextResponse.json(
      { state: quota.reason === "quota-blocked" ? "quota-blocked" : "model-unavailable", reason: quota.reason },
      { status: quota.reason === "quota-blocked" ? 429 : 503 },
    );
  }
  const result = await evaluateCanonicalJobFit(parsed.data);
  return NextResponse.json(result, { status: result.state === "ready" ? 200 : 422 });
}
