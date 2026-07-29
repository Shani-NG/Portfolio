import { NextResponse } from "next/server";
import { z } from "zod";
import { getRoleFitModelProvider } from "@/lib/role-fit/model";
import { getRoleFitPolicy } from "@/lib/role-fit/runtime/policy";
import { evaluateReportEligibility } from "@/lib/role-fit/server/eligibility";
import { validateRoleText } from "@/lib/role-fit/server/role-understanding";

const requestSchema = z
  .object({
    roleText: z.string(),
    approved: z.boolean(),
    completedReportCount: z.union([z.literal(0), z.literal(1), z.literal(2)]).default(0),
    conversationId: z.string().optional(),
    language: z.enum(["he", "en", "mixed"]).default("en"),
  })
  .strict();

export async function POST(request: Request) {
  const policy = getRoleFitPolicy();
  const parsedRequest = requestSchema.safeParse(await request.json().catch(() => null));

  if (!parsedRequest.success) {
    return NextResponse.json(
      {
        state: "validation-failed",
        safeMessageKey: "role.invalid_request",
      },
      { status: 400 },
    );
  }

  if (parsedRequest.data.roleText.length > policy.maxInputChars) {
    return NextResponse.json(
      {
        state: "validation-failed",
        safeMessageKey: "role.input_too_long",
        limits: {
          maxInputChars: policy.maxInputChars,
        },
      },
      { status: 413 },
    );
  }

  if (parsedRequest.data.completedReportCount >= policy.maxReportsPerSession) {
    const eligibility = evaluateReportEligibility({
      session: {
        status: "active",
        completedReportCount: parsedRequest.data.completedReportCount,
      },
      approval: {
        approved: parsedRequest.data.approved,
      },
      evidenceState: "ready",
      report: undefined,
    });

    return NextResponse.json({ state: "blocked", eligibility }, { status: 429 });
  }

  if (!parsedRequest.data.approved) {
    const eligibility = evaluateReportEligibility({
      session: {
        status: "active",
        completedReportCount: parsedRequest.data.completedReportCount,
      },
      approval: {
        approved: parsedRequest.data.approved,
      },
      evidenceState: "ready",
      report: undefined,
    });

    return NextResponse.json({ state: "blocked", eligibility }, { status: 409 });
  }

  const traceId = crypto.randomUUID();
  const conversationId = parsedRequest.data.conversationId ?? crypto.randomUUID();
  const validation = validateRoleText({
    conversationId,
    traceId,
    roleText: parsedRequest.data.roleText,
    detectedLanguage: parsedRequest.data.language,
  });

  if (validation.parseStatus !== "valid-complete") {
    return NextResponse.json(
      {
        state: "validation-failed",
        validation,
        safeMessageKey: "role.missing_required_fields",
      },
      { status: 422 },
    );
  }

  const provider = getRoleFitModelProvider();
  const modelResult = await provider.generateReport({
    roleText: parsedRequest.data.roleText,
    language: parsedRequest.data.language,
    task: "analysis",
    maxOutputTokens: policy.maxOutputTokens,
  });

  if (!modelResult.ok) {
    return NextResponse.json(
      {
        state: "model-unavailable",
        provider: modelResult.provider,
        model: modelResult.model,
        error: modelResult.error,
        safeMessageKey: modelResult.safeMessageKey,
        detail: modelResult.detail,
      },
      { status: modelResult.error === "missing-configuration" ? 503 : 502 },
    );
  }

  const eligibility = evaluateReportEligibility({
    session: {
      status: "active",
      completedReportCount: parsedRequest.data.completedReportCount,
    },
    approval: {
      approved: parsedRequest.data.approved,
    },
    evidenceState: "ready",
    report: modelResult.report,
  });

  return NextResponse.json({
    state: "ready",
    provider: modelResult.provider,
    model: modelResult.model,
    eligibility,
  });
}
