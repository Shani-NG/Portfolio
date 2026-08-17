import { after, NextResponse } from "next/server";
import { z } from "zod";
import { getRoleFitModelProvider } from "@/lib/role-fit/model";
import { logRoleFitEvent, logRoleFitReportSummary, logRoleFitSessionSummary } from "@/lib/role-fit/runtime/google-sheets-store";
import { getRoleFitPolicy } from "@/lib/role-fit/runtime/policy";
import { loadApprovedEvidence } from "@/lib/role-fit/knowledge/load-approved-evidence";
import { persistCompletedReport } from "@/lib/role-fit/persistence/task-e";
import { composeReportUIPayload, getRoleAnalysisItems } from "@/lib/role-fit/report/compose-report";
import { evaluateReportEligibility, evidenceStateFromComposedReport } from "@/lib/role-fit/server/eligibility";
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
  let modelResult = await provider.generateReport({
    roleText: parsedRequest.data.roleText,
    language: parsedRequest.data.language,
    task: "analysis",
    maxOutputTokens: policy.maxOutputTokens,
    runtimeState: JSON.stringify({ validation, roleItems }),
    approvedEvidence: approvedEvidence.promptContext,
  });

  if (!modelResult.ok) {
    const failedModelResult = modelResult;
    console.error("[role-fit-report] model generation failed", {
      traceId,
      provider: failedModelResult.provider,
      model: failedModelResult.model,
      error: failedModelResult.error,
      detail: failedModelResult.detail,
    });
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
          error: failedModelResult.error,
          provider: failedModelResult.provider,
          safeMessageKey: failedModelResult.safeMessageKey,
          diagnostic: failedModelResult.detail,
        },
      }),
    );

    return NextResponse.json(
      {
        state: "model-unavailable",
        provider: failedModelResult.provider,
        model: failedModelResult.model,
        error: failedModelResult.error,
        safeMessageKey: failedModelResult.safeMessageKey,
        safeMessage: "I couldn't generate the report this time. Your role details are still here. Please try again later.",
        detail: failedModelResult.detail,
      },
      { status: 503 },
    );
  }

  let composition = composeReportUIPayload({
    analysis: modelResult.analysis,
    roleDraft: validation.roleDraft,
    evidence: approvedEvidence,
    language: parsedRequest.data.language,
  });

  if (!composition.ok) {
    const firstDiagnostic = composition.diagnostic;
    const repairResult = await provider.generateReport({
      roleText: parsedRequest.data.roleText,
      language: parsedRequest.data.language,
      task: "analysis",
      maxOutputTokens: policy.maxOutputTokens,
      runtimeState: JSON.stringify({
        validation,
        roleItems,
        repair: {
          previousCompositionDiagnostic: firstDiagnostic,
          instruction: "Correct the reported inconsistency while preserving the role items and using only approved evidence IDs.",
        },
      }),
      approvedEvidence: approvedEvidence.promptContext,
    });

    if (repairResult.ok) {
      modelResult = repairResult;
      composition = composeReportUIPayload({
        analysis: repairResult.analysis,
        roleDraft: validation.roleDraft,
        evidence: approvedEvidence,
        language: parsedRequest.data.language,
      });
    }
  }

  if (!composition.ok) {
    console.error("[role-fit-report] report composition failed", {
      traceId,
      provider: modelResult.provider,
      model: modelResult.model,
      diagnostic: composition.diagnostic,
    });
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
        safeMessage: "I couldn't generate the report this time. Your role details are still here. Please try again later.",
        detail: composition.diagnostic,
      },
      { status: 503 },
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
    evidenceState: evidenceStateFromComposedReport(report),
    report,
  });
  const reportId = report.reportId;
  const title = validation.roleDraft.title?.originalValue ?? "";
  const roleFamily = inferRoleFamily(title);

  if (eligibility.state === "no-report") {
    after(async () => {
      const eventName = eligibility.reason === "insufficient-evidence"
        ? "report.insufficient_evidence"
        : "report.no_meaningful_fit";
      await Promise.all([
        logRoleFitEvent({
          eventName,
          conversationId,
          sessionId,
          reportId,
          traceId,
          mode: "fit-analysis",
          outcome: "success",
          durationMs: Date.now() - startedAt,
          metadata: {
            provider: modelResult.provider,
            model: modelResult.model,
            fitMode: report.overallFitVisual.mode,
            evidenceConfidence: report.evidenceConfidence.level,
          },
        }),
        logRoleFitSessionSummary({
          conversationId,
          sessionId,
          language: parsedRequest.data.language,
          executiveSummary: "Validated role input produced a no-report outcome and was not persisted as a completed report.",
          intentPath: "role-fit",
          lastMode: "fit-analysis",
          lastOutcome: "success",
          roleStatus: validation.parseStatus,
          roleFamily,
          companyName: validation.roleDraft.company?.originalValue,
          reportStatus: "no-report",
        }),
      ]);
    });

    return NextResponse.json({
      state: "no-report",
      provider: modelResult.provider,
      model: modelResult.model,
      eligibility,
    });
  }

  const persistence = await persistCompletedReport(report, { roleFamily });

  after(async () => {
    const persistenceState = persistence.ok ? "persisted" : "degraded";
    await Promise.all([
      logRoleFitEvent({
        eventName: "report.completed",
        conversationId,
        sessionId,
        reportId,
        traceId,
        mode: "fit-analysis",
        outcome: persistence.ok ? "success" : "partial",
        durationMs: Date.now() - startedAt,
        metadata: {
          provider: modelResult.provider,
          model: modelResult.model,
          fitMode: report.overallFitVisual.mode,
          evidenceConfidence: report.evidenceConfidence.level,
          persistenceState,
          ...(persistence.ok ? {} : { persistenceReason: persistence.reason }),
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
        executiveSummary: persistence.ok
          ? "Validated report request completed and a report summary was stored."
          : "Validated report request completed, but report persistence was unavailable.",
        intentPath: "role-fit",
        lastMode: "fit-analysis",
        lastOutcome: persistence.ok ? "success" : "partial",
        roleStatus: validation.parseStatus,
        roleFamily,
        companyName: validation.roleDraft.company?.originalValue,
        reportStatus: persistence.ok ? "ready" : "persistence-degraded",
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
    persistence: persistence.ok ? "persisted" : "degraded",
  });
}
