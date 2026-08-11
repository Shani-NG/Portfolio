import { after, NextResponse } from "next/server";
import { z } from "zod";
import { getRoleFitModelProvider } from "@/lib/role-fit/model";
import { logRoleFitEvent, logRoleFitReportSummary, logRoleFitSessionSummary } from "@/lib/role-fit/runtime/google-sheets-store";
import { getRoleFitPolicy } from "@/lib/role-fit/runtime/policy";
import { loadApprovedEvidence } from "@/lib/role-fit/knowledge/load-approved-evidence";
import { composeReportUIPayload, getRoleAnalysisItems } from "@/lib/role-fit/report/compose-report";
import { evaluateReportEligibility } from "@/lib/role-fit/server/eligibility";
import { inferRoleFamily, validateRoleText } from "@/lib/role-fit/server/role-understanding";

const requestSchema = z
  .object({
    roleText: z.string(),
    approved: z.boolean(),
    completedReportCount: z.union([z.literal(0), z.literal(1), z.literal(2)]).default(0),
    conversationId: z.string().optional(),
    sessionId: z.string().optional(),
    language: z.enum(["he", "en", "mixed"]).default("en"),
  })
  .strict();

export async function POST(request: Request) {
  const policy = getRoleFitPolicy();
  const parsedRequest = requestSchema.safeParse(await request.json().catch(() => null));
  const startedAt = Date.now();

  if (!parsedRequest.success) {
    return NextResponse.json(
      {
        state: "validation-failed",
        safeMessageKey: "role.invalid_request",
        safeMessage: "The report request was incomplete. Please return to the chat and confirm the role details again.",
      },
      { status: 400 },
    );
  }

  const traceId = crypto.randomUUID();
  const conversationId = parsedRequest.data.conversationId ?? crypto.randomUUID();
  const sessionId = parsedRequest.data.sessionId;

  if (parsedRequest.data.roleText.length > policy.maxInputChars) {
    after(() =>
      logRoleFitEvent({
        eventName: "role.validation_failed",
        conversationId,
        sessionId,
        traceId,
        mode: "fit-analysis",
        outcome: "failure",
        metadata: { safeMessageKey: "role.input_too_long" },
      }),
    );

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

    after(() =>
      logRoleFitEvent({
        eventName: "report.limit_blocked",
        conversationId,
        sessionId,
        traceId,
        mode: "fit-analysis",
        outcome: "blocked",
        metadata: {
          completedReportCount: parsedRequest.data.completedReportCount,
          maxReportsPerSession: policy.maxReportsPerSession,
        },
      }),
    );

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

    after(() =>
      logRoleFitEvent({
        eventName: "report.failed",
        conversationId,
        sessionId,
        traceId,
        mode: "fit-analysis",
        outcome: "blocked",
        metadata: { reason: "approval-missing" },
      }),
    );

    return NextResponse.json({ state: "blocked", eligibility }, { status: 409 });
  }

  const validation = validateRoleText({
    conversationId,
    traceId,
    roleText: parsedRequest.data.roleText,
    detectedLanguage: parsedRequest.data.language,
  });

  if (validation.parseStatus !== "valid-complete") {
    after(() =>
      logRoleFitEvent({
        eventName: "role.validation_failed",
        conversationId,
        sessionId,
        traceId,
        mode: "fit-analysis",
        outcome: "failure",
        metadata: {
          parseStatus: validation.parseStatus,
          missingFieldCount: validation.missingFields.length,
        },
      }),
    );

    return NextResponse.json(
      {
        state: "validation-failed",
        validation,
        safeMessageKey: "role.missing_required_fields",
        safeMessage: "The saved role is missing a required field. Please add the requested detail in the chat before retrying.",
      },
      { status: 422 },
    );
  }

  after(() =>
    logRoleFitEvent({
      eventName: "report.generation_started",
      conversationId,
      sessionId,
      traceId,
      mode: "fit-analysis",
      outcome: "success",
      metadata: {
        completedReportCount: parsedRequest.data.completedReportCount,
        language: parsedRequest.data.language,
      },
    }),
  );

  const provider = getRoleFitModelProvider();
  const approvedEvidence = await loadApprovedEvidence(parsedRequest.data.roleText);
  const roleItems = getRoleAnalysisItems(validation.roleDraft);
  const modelResult = await provider.generateReport({
    roleText: parsedRequest.data.roleText,
    language: parsedRequest.data.language,
    task: "analysis",
    maxOutputTokens: policy.maxOutputTokens,
    runtimeState: JSON.stringify({ validation, roleItems }),
    approvedEvidence: approvedEvidence.promptContext,
  });

  if (!modelResult.ok) {
    after(() =>
      logRoleFitEvent({
        eventName: "report.failed",
        conversationId,
        sessionId,
        traceId,
        mode: "fit-analysis",
        outcome: "failure",
        durationMs: Date.now() - startedAt,
        metadata: {
          error: modelResult.error,
          provider: modelResult.provider,
          safeMessageKey: modelResult.safeMessageKey,
          diagnostic: modelResult.detail,
        },
      }),
    );

    return NextResponse.json(
      {
        state: "model-unavailable",
        provider: modelResult.provider,
        model: modelResult.model,
        error: modelResult.error,
        safeMessageKey: modelResult.safeMessageKey,
        safeMessage: "I couldn't generate the report this time. This is a service issue, not a problem with the details you entered. Please try again later.",
        detail: modelResult.detail,
      },
      { status: modelResult.error === "missing-configuration" ? 503 : 502 },
    );
  }

  const composition = composeReportUIPayload({
    analysis: modelResult.analysis,
    roleDraft: validation.roleDraft,
    evidence: approvedEvidence,
    language: parsedRequest.data.language,
  });

  if (!composition.ok) {
    after(() =>
      logRoleFitEvent({
        eventName: "report.failed",
        conversationId,
        sessionId,
        traceId,
        mode: "fit-analysis",
        outcome: "failure",
        durationMs: Date.now() - startedAt,
        metadata: {
          error: "invalid-output",
          provider: modelResult.provider,
          safeMessageKey: "model.google_ai_studio_invalid_report_payload",
          diagnostic: composition.diagnostic,
        },
      }),
    );

    return NextResponse.json(
      {
        state: "model-unavailable",
        provider: modelResult.provider,
        model: modelResult.model,
        error: "invalid-output",
        safeMessageKey: "model.google_ai_studio_invalid_report_payload",
        safeMessage: "I couldn't generate the report this time. This is a service issue, not a problem with the details you entered. Please try again later.",
        detail: composition.diagnostic,
      },
      { status: 502 },
    );
  }

  const report = composition.report;

  const eligibility = evaluateReportEligibility({
    session: {
      status: "active",
      completedReportCount: parsedRequest.data.completedReportCount,
    },
    approval: {
      approved: parsedRequest.data.approved,
    },
    evidenceState: "ready",
    report,
  });

  after(async () => {
    const reportId = report.reportId;
    const title = validation.roleDraft.title?.originalValue ?? "";
    await Promise.all([
      logRoleFitEvent({
        eventName: "report.completed",
        conversationId,
        sessionId,
        reportId,
        traceId,
        mode: "fit-analysis",
        outcome: eligibility.state === "ready" ? "success" : "failure",
        durationMs: Date.now() - startedAt,
        metadata: {
          provider: modelResult.provider,
          model: modelResult.model,
          fitMode: report.overallFitVisual.mode,
          evidenceConfidence: report.evidenceConfidence.level,
        },
      }),
      logRoleFitReportSummary({
        conversationId,
        sessionId,
        reportId,
        provider: modelResult.provider,
        model: modelResult.model,
        fitMode: report.overallFitVisual.mode,
        fitLabel: report.overallFitVisual.label,
        evidenceStatus: report.evidenceConfidence.level,
      }),
      logRoleFitSessionSummary({
        conversationId,
        sessionId,
        language: parsedRequest.data.language,
        executiveSummary: "Validated report request completed and a report summary was stored.",
        intentPath: "role-fit",
        lastMode: "fit-analysis",
        lastOutcome: eligibility.state === "ready" ? "success" : "failure",
        roleStatus: validation.parseStatus,
        roleFamily: inferRoleFamily(title),
        companyName: validation.roleDraft.company?.originalValue,
        reportStatus: eligibility.state === "ready" ? "ready" : "failed",
        reportId,
      }),
    ]);
  });

  return NextResponse.json({
    state: "ready",
    provider: modelResult.provider,
    model: modelResult.model,
    eligibility,
    report,
  });
}
