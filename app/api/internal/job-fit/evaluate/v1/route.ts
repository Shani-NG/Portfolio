import { NextResponse } from "next/server";
import { normalizedJobCandidateSchema } from "@/lib/job-fit/contracts";
import { prepareCanonicalJobFit } from "@/lib/job-fit/evaluate";
import { runJobFitEvaluation } from "@/lib/job-fit/evaluation-service";
import { isInternalJobFitRequestAuthorized } from "@/lib/job-fit/internal-auth";

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

  const result = await runJobFitEvaluation(parsed.data);
  return NextResponse.json(result.body, { status: result.status, headers: result.headers });
}
