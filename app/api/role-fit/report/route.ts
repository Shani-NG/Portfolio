import { after, NextResponse } from "next/server";
import { z } from "zod";
import { roleDraftSchema } from "@/lib/role-fit/contracts";
import { getRoleFitModelProvider } from "@/lib/role-fit/model";
import { createReportProviderFailureContract } from "@/lib/role-fit/model/failure-contract";
import { logRoleFitEvent } from "@/lib/role-fit/runtime/supabase-runtime-store";
import { getGoogleAiStudioReportModel, getRoleFitPolicy } from "@/lib/role-fit/runtime/policy";
import { loadApprovedEvidence } from "@/lib/role-fit/knowledge/load-approved-evidence";
import { getCompletedReportCount, persistCompletedReport } from "@/lib/role-fit/persistence/task-e";
import { composeReportUIPayload, getRoleAnalysisItems } from "@/lib/role-fit/report/compose-report";
import { createCompositionFailureMetadata, type CompositionRepairOutcome } from "@/lib/role-fit/report/composition-observability";
import type { RoleFitProviderFailure } from "@/lib/role-fit/model/provider";
import {
  constrainRepairAnalysis,
  getDeterministicLimitationRepresentation,
  shouldUseModelRepair,
} from "@/lib/role-fit/report/repair";
import { evaluateReportEligibility, evidenceStateFromComposedReport } from "@/lib/role-fit/server/eligibility";
import {
  inferRoleFamily,
  resolveEnglishReportTitle,
  serializeRoleDraftForBoundary,
  validateStructuredRoleDraft,
} from "@/lib/role-fit/server/role-understanding";

function toSessionCompletedReportCount(value: number): 0 | 1 | 2 {
  if (value >= 2) return 2;
  if (value === 1) return 1;
  return 0;
}

const requestSchema = z
  .object({
    roleDraft: roleDraftSchema,
    approved: z.boolean(),
    // Retained for client display compatibility only; Supabase is authoritative for eligibility.
    completedReportCount: z.union([z.literal(0), z.literal(1), z.literal(2)]).default(0),
    conversationId: z.string().optional(),
    sessionId: z.string().trim().min(1).max(160),
    reportId: z.string().regex(/^R[A-Z0-9]{4}$/),
    language: z.enum(["he", "en", "mixed"]).default("en"),
  })
  .strict();

const roleFitReportAnalysisMaxOutputTokens = 4_000;

function resolveRoleFitReportAnalysisMaxOutputTokens(policyMaxOutputTokens: number) {
  return Math.max(policyMaxOutputTokens, roleFitReportAnalysisMaxOutputTokens);
}

function safeProviderDiagnostics(failure: RoleFitProviderFailure) {
  const diagnostics = failure.diagnostics;
  if (!diagnostics) return {};

  return {
    ...(diagnostics.attemptPhase ? { attemptPhase: diagnostics.attemptPhase } : {}),
    ...(diagnostics.repairTriggerCategory ? { repairTriggerCategory: diagnostics.repairTriggerCategory } : {}),
    ...(diagnostics.elapsedMs !== undefined ? { providerElapsedMs: diagnostics.elapsedMs } : {}),
    ...(diagnostics.failureCategory ? { failureCategory: diagnostics.failureCategory } : {}),
    ...(diagnostics.finishReason ? { finishReason: diagnostics.finishReason } : {}),
    ...(diagnostics.providerStatus !== undefined ? { providerStatus: diagnostics.providerStatus } : {}),
    ...(diagnostics.retryAfterSeconds !== undefined ? { retryAfterSeconds: diagnostics.retryAfterSeconds } : {}),
    ...(diagnostics.responseBodyPresent !== undefined ? { responseBodyPresent: diagnostics.responseBodyPresent } : {}),
    ...(diagnostics.promptTokenCount !== undefined ? { promptTokenCount: diagnostics.promptTokenCount } : {}),
    ...(diagnostics.outputTokenCount !== undefined ? { outputTokenCount: diagnostics.outputTokenCount } : {}),
    ...(diagnostics.totalTokenCount !== undefined ? { totalTokenCount: diagnostics.totalTokenCount } : {}),
  };
}

export async function POST(request: Request) {
  const policy = getRoleFitPolicy();
  const reportAnalysisMaxOutputTokens = resolveRoleFitReportAnalysisMaxOutputTokens(policy.maxOutputTokens);
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
  const boundedRoleText = serializeRoleDraftForBoundary(parsedRequest.data.roleDraft);

  if (boundedRoleText.length > policy.maxInputChars) {
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

  const persistedCount = await getCompletedReportCount(sessionId);
  if (!persistedCount.ok) {
    after(() =>
      logRoleFitEvent({
        eventName: "report.failed",
        conversationId,
        sessionId,
        traceId,
        mode: "fit-analysis",
        outcome: "partial",
        metadata: { reason: "authoritative-count-unavailable" },
      }),
    );

    return NextResponse.json(
      {
        state: "persistence-unavailable",
        safeMessage: "I couldn't verify the report allowance right now. Your role details are still here. Please try again later.",
      },
      { status: 503 },
    );
  }
  const completedReportCount = persistedCount.completedReportCount;
  const sessionCompletedReportCount = toSessionCompletedReportCount(completedReportCount);

  if (completedReportCount >= policy.maxReportsPerSession) {
    const eligibility = evaluateReportEligibility({
      session: {
        status: "active",
        completedReportCount: sessionCompletedReportCount,
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
          completedReportCount,
          maxReportsPerSession: policy.maxReportsPerSession,
        },
      }),
    );

    return NextResponse.json({ state: "blocked", eligibility, completedReportCount }, { status: 429 });
  }

  if (!parsedRequest.data.approved) {
    const eligibility = evaluateReportEligibility({
      session: {
        status: "active",
        completedReportCount: sessionCompletedReportCount,
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

  const validation = validateStructuredRoleDraft({
    conversationId,
    traceId,
    roleDraft: parsedRequest.data.roleDraft,
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

  const canonicalRoleTitle = validation.roleDraft.title?.originalValue ?? "";
  const reportDisplayTitle = resolveEnglishReportTitle(canonicalRoleTitle);

  after(() =>
    logRoleFitEvent({
      eventName: "report.generation_started",
      conversationId,
      sessionId,
      traceId,
      mode: "fit-analysis",
      outcome: "success",
      metadata: {
        completedReportCount,
        language: parsedRequest.data.language,
      },
    }),
  );

  const roleItems = getRoleAnalysisItems(validation.roleDraft);
  const provider = getRoleFitModelProvider();
  const approvedEvidence = await loadApprovedEvidence(boundedRoleText, roleItems);
  if (approvedEvidence.catalogAudit?.issues.length) {
    console.warn("[role-fit-report] evidence catalog exclusions", {
      traceId,
      issues: approvedEvidence.catalogAudit.issues.map((issue) => ({
        code: issue.code,
        projectId: issue.projectId,
        evidenceId: issue.evidenceId,
      })),
    });
  }
  let modelResult = await provider.generateReport({
    roleText: boundedRoleText,
    language: parsedRequest.data.language,
    task: "analysis",
    modelOverride: getGoogleAiStudioReportModel(),
    maxOutputTokens: reportAnalysisMaxOutputTokens,
    runtimeState: JSON.stringify({ validation, roleItems }),
    approvedEvidence: approvedEvidence.promptContext,
  });

  if (!modelResult.ok) {
    const failedModelResult = modelResult;
    const failureContract = createReportProviderFailureContract(failedModelResult);
    console.error("[role-fit-report] model generation failed", {
      traceId,
      provider: failedModelResult.provider,
      model: failedModelResult.model,
      error: failedModelResult.error,
      providerStatus: failedModelResult.providerStatus,
      retryable: failedModelResult.retryable ?? false,
      retryAfterSeconds: failedModelResult.retryAfterSeconds,
      ...safeProviderDiagnostics(failedModelResult),
      ...(failedModelResult.error === "invalid-output" ? { diagnostic: failedModelResult.detail } : {}),
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
          providerStatus: failedModelResult.providerStatus,
          retryable: failedModelResult.retryable ?? false,
          retryAfterSeconds: failedModelResult.retryAfterSeconds,
          ...safeProviderDiagnostics(failedModelResult),
        },
      }),
    );

    return NextResponse.json(failureContract.body, { status: failureContract.status });
  }

  let composition = composeReportUIPayload({
    analysis: modelResult.analysis,
    roleDraft: validation.roleDraft,
    evidence: approvedEvidence,
    language: parsedRequest.data.language,
    reportId: parsedRequest.data.reportId,
    reportDisplayTitle,
  });
  const originalCompositionDiagnostic = composition.ok ? undefined : composition.diagnostic;
  let repairOutcome: CompositionRepairOutcome = "not-attempted";
  let repairFailureCategory: "missing-configuration" | "provider-error" | "rate-limited" | "invalid-output" | undefined;

  if (!composition.ok) {
    const representedLimitationRoleItemIndexes = getDeterministicLimitationRepresentation({
      analysis: modelResult.analysis,
      diagnostic: composition.diagnostic,
    });
    if (representedLimitationRoleItemIndexes) {
      composition = composeReportUIPayload({
        analysis: modelResult.analysis,
        roleDraft: validation.roleDraft,
        evidence: approvedEvidence,
        language: parsedRequest.data.language,
        reportId: parsedRequest.data.reportId,
        reportDisplayTitle,
        representedLimitationRoleItemIndexes,
      });
    }
  }

  if (!composition.ok && shouldUseModelRepair(composition.diagnostic)) {
    const firstDiagnostic = composition.diagnostic;
    const repairResult = await provider.generateReport({
      roleText: boundedRoleText,
      language: parsedRequest.data.language,
      task: "analysis",
      maxOutputTokens: reportAnalysisMaxOutputTokens,
      runtimeState: JSON.stringify({
        validation,
        roleItems,
        repair: {
          previousCompositionDiagnostic: firstDiagnostic,
          instruction: "Correct the reported inconsistency while preserving the role items and using only approved evidence IDs.",
        },
      }),
      approvedEvidence: approvedEvidence.promptContext,
      diagnosticAttemptPhase: "composition-repair",
    });

    if (repairResult.ok) {
      const constrainedRepairAnalysis = constrainRepairAnalysis({
        original: modelResult.analysis,
        repaired: repairResult.analysis,
        diagnostic: firstDiagnostic,
      });
      modelResult = { ...repairResult, analysis: constrainedRepairAnalysis };
      composition = composeReportUIPayload({
        analysis: constrainedRepairAnalysis,
        roleDraft: validation.roleDraft,
        evidence: approvedEvidence,
        language: parsedRequest.data.language,
        reportId: parsedRequest.data.reportId,
        reportDisplayTitle,
      });
      if (!composition.ok) repairOutcome = "repaired-output-still-invalid";
    } else {
      repairOutcome = "repair-call-failed";
      repairFailureCategory = repairResult.error;
    }
  }

  if (!composition.ok) {
    console.error("[role-fit-report] report composition failed", createCompositionFailureMetadata({
      traceId,
      provider: modelResult.provider,
      model: modelResult.model,
      originalDiagnostic: originalCompositionDiagnostic ?? composition.diagnostic,
      repairOutcome,
      repairFailureCategory,
      finalDiagnostic: composition.diagnostic,
    }));
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
      completedReportCount: sessionCompletedReportCount,
    },
    approval: {
      approved: parsedRequest.data.approved,
    },
    evidenceState: evidenceStateFromComposedReport(report),
    report,
  });
  const reportId = report.reportId;
  const roleFamily = inferRoleFamily(canonicalRoleTitle);

  if (eligibility.state === "no-report") {
    after(() => {
      const eventName = eligibility.reason === "insufficient-evidence"
        ? "report.insufficient_evidence"
        : "report.no_meaningful_fit";
      return logRoleFitEvent({
        eventName,
        conversationId,
        sessionId,
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
      });
    });

    return NextResponse.json({
      state: "no-report",
      provider: modelResult.provider,
      model: modelResult.model,
      eligibility,
      completedReportCount,
    });
  }

  const persistence = await persistCompletedReport(report, { roleFamily, sessionId });

  if (!persistence.ok && persistence.reason === "limit-reached") {
    const limitEligibility = evaluateReportEligibility({
      session: {
        status: "active",
        completedReportCount: toSessionCompletedReportCount(persistence.completedReportCount ?? policy.maxReportsPerSession),
      },
      approval: { approved: parsedRequest.data.approved },
      evidenceState: "ready",
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
          completedReportCount: persistence.completedReportCount ?? policy.maxReportsPerSession,
          maxReportsPerSession: policy.maxReportsPerSession,
        },
      }),
    );
    return NextResponse.json(
      { state: "blocked", eligibility: limitEligibility, completedReportCount: persistence.completedReportCount ?? policy.maxReportsPerSession },
      { status: 429 },
    );
  }

  after(() => {
    const persistenceState = persistence.ok ? "persisted" : "degraded";
    return logRoleFitEvent({
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
    });
  });

  return NextResponse.json({
    state: "ready",
    provider: modelResult.provider,
    model: modelResult.model,
    eligibility,
    report,
    persistence: persistence.ok ? "persisted" : "degraded",
    completedReportCount: persistence.ok ? persistence.completedReportCount : completedReportCount,
  });
}
