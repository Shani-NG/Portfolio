import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { after, NextResponse } from "next/server";
import { z } from "zod";
import { getRoleFitModelProvider } from "@/lib/role-fit/model";
import {
  clarificationLimitAnswer,
  existingReportAnswer,
  genericRoleTitleAnswer,
  looksLikeNewReportRequest,
  looksLikeRoleSubmissionSetup,
  maxRoleClarificationAttempts,
  missingDetailsAnswer,
  readyForReportAnswer,
  reportLimitAnswer,
  roleSubmissionSetupAnswer,
} from "@/lib/role-fit/conversation/behavior";
import { logRoleFitEvent, logRoleFitSessionSummary } from "@/lib/role-fit/runtime/google-sheets-store";
import { getRoleFitPolicy } from "@/lib/role-fit/runtime/policy";
import {
  applyRoleCorrection,
  detectRoleCorrection,
  inferRoleFamily,
  isNoRoleTitleAnswer,
  isValidRoleClarificationAnswer,
  looksLikeReportIntent,
  resolveRoleTextForValidation,
  shouldValidateRoleCollectionMessage,
  shouldTreatAsRoleClarification,
  validateRoleText,
} from "@/lib/role-fit/server/role-understanding";

const pendingFieldSchema = z.enum(["company", "title", "responsibilities", "requirements"]);

const requestSchema = z
  .object({
    conversationId: z.string(),
    sessionId: z.string().optional(),
    message: z.string().min(1),
    language: z.enum(["he", "en", "mixed"]).default("en"),
    repeatedInput: z.boolean().optional().default(false),
    roleCollectionActive: z.boolean().optional().default(false),
    clarificationAttempts: z.number().int().nonnegative().max(10).optional().default(0),
    completedReportCount: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional().default(0),
    conversationContext: z.string().optional(),
    reportContext: z.string().optional(),
    roleContext: z
      .object({
        roleText: z.string(),
        pendingField: pendingFieldSchema.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

async function loadApprovedConversationContext() {
  const files = [
    join(process.cwd(), "PORTFOLIO_IMPLEMENTATION", "role-fit-agent", "docs", "canonical", "General_Profile_Knowledge.md"),
    join(process.cwd(), "PORTFOLIO_IMPLEMENTATION", "role-fit-agent", "docs", "canonical", "Portfolio_Knowledge_Index.md"),
  ];
  const contents = await Promise.all(
    files.map(async (file) => {
      const content = await readFile(file, "utf8");
      return content.slice(0, 12000);
    }),
  );

  return contents.join("\n\n---\n\n");
}

export async function POST(request: Request) {
  const policy = getRoleFitPolicy();
  const parsedRequest = requestSchema.safeParse(await request.json().catch(() => null));

  if (!parsedRequest.success) {
    return NextResponse.json(
      {
        state: "recoverable-error",
        answer: "I need a message before I can continue.",
        safeMessageKey: "conversation.invalid_request",
      },
      { status: 400 },
    );
  }

  if (parsedRequest.data.message.length > policy.maxInputChars) {
    return NextResponse.json(
      {
        state: "recoverable-error",
        answer: "This is too much text for one message. Please send the core role description or the most relevant section first.",
        safeMessageKey: "conversation.input_too_long",
      },
      { status: 413 },
    );
  }

  const traceId = crypto.randomUUID();
  const hasReportIntent = looksLikeReportIntent(parsedRequest.data.message);
  const hasRoleInput = shouldValidateRoleCollectionMessage({
    message: parsedRequest.data.message,
    roleCollectionActive: parsedRequest.data.roleCollectionActive,
  });
  const roleContext = parsedRequest.data.roleContext;
  const pendingRoleField = roleContext?.pendingField;
  const isFieldClarification = Boolean(roleContext && shouldTreatAsRoleClarification(pendingRoleField, parsedRequest.data.message));
  const roleCorrection = roleContext && !pendingRoleField
    ? detectRoleCorrection(parsedRequest.data.message)
    : null;
  const isRoleCorrection = Boolean(roleCorrection);
  const { conversationId, sessionId } = parsedRequest.data;

  if (
    parsedRequest.data.completedReportCount >= 2
    && hasReportIntent
    && (!parsedRequest.data.reportContext || looksLikeNewReportRequest(parsedRequest.data.message))
  ) {
    return NextResponse.json({
      state: parsedRequest.data.reportContext ? "report-ready" : "general-qa",
      answer: reportLimitAnswer(parsedRequest.data.language),
      safeMessageKey: "report.limit_reached",
    });
  }

  if (parsedRequest.data.reportContext && parsedRequest.data.repeatedInput && hasRoleInput) {
    return NextResponse.json({
      state: "report-ready",
      answer: existingReportAnswer(parsedRequest.data.language),
      roleText: roleContext?.roleText,
      safeMessageKey: "report.existing_role",
    });
  }

  if (roleContext && pendingRoleField && isFieldClarification && !isValidRoleClarificationAnswer(pendingRoleField, parsedRequest.data.message)) {
    if (pendingRoleField === "title" && isNoRoleTitleAnswer(parsedRequest.data.message)) {
      return NextResponse.json({
        state: "awaiting-role-completion",
        answer: genericRoleTitleAnswer(parsedRequest.data.language),
        roleText: roleContext.roleText,
        pendingField: "title",
        clarificationExhausted: false,
        safeMessageKey: "role.generic_title_category_requested",
      });
    }

    const clarificationExhausted = parsedRequest.data.clarificationAttempts + 1 >= maxRoleClarificationAttempts;
    return NextResponse.json({
      state: "awaiting-role-completion",
      answer: clarificationExhausted
        ? clarificationLimitAnswer(parsedRequest.data.language)
        : missingDetailsAnswer({
            missingField: pendingRoleField,
            language: parsedRequest.data.language,
            repeatedInput: false,
          }),
      roleText: roleContext.roleText,
      pendingField: clarificationExhausted ? null : pendingRoleField,
      clarificationExhausted,
      safeMessageKey: "role.invalid_clarification",
    });
  }

  const roleTextForValidation = roleCorrection && roleContext
    ? applyRoleCorrection(roleContext.roleText, roleCorrection)
    : resolveRoleTextForValidation({
        message: parsedRequest.data.message,
        savedRoleText: roleContext?.roleText,
        pendingField: pendingRoleField,
        hasRoleInput: hasRoleInput && !isFieldClarification,
        hasReportIntent,
      });

  if (roleTextForValidation.length > policy.maxInputChars) {
    return NextResponse.json(
      {
        state: "recoverable-error",
        answer: "The combined role description is too long. Please shorten the role details before continuing.",
        safeMessageKey: "conversation.input_too_long",
      },
      { status: 413 },
    );
  }

  if (!parsedRequest.data.reportContext && !roleContext && !hasRoleInput && looksLikeRoleSubmissionSetup(parsedRequest.data.message)) {
    return NextResponse.json({
      state: "awaiting-role-completion",
      answer: roleSubmissionSetupAnswer(parsedRequest.data.language),
      safeMessageKey: "role.awaiting_input",
    });
  }

  if (hasRoleInput || isFieldClarification || isRoleCorrection || (!parsedRequest.data.reportContext && hasReportIntent)) {
    const validation = validateRoleText({
      conversationId,
      traceId,
      roleText: roleTextForValidation,
      detectedLanguage: parsedRequest.data.language,
    });

    if (validation.parseStatus === "valid-complete") {
      const title = validation.roleDraft.title?.originalValue ?? "";
      const companyName = validation.roleDraft.company?.originalValue;
      after(async () => {
        await Promise.all([
          logRoleFitEvent({
            eventName: "role.classified",
            conversationId,
            sessionId,
            traceId,
            mode: "role-understanding",
            outcome: "success",
            metadata: {
              parseStatus: validation.parseStatus,
              repeatedInput: parsedRequest.data.repeatedInput,
            },
          }),
          logRoleFitSessionSummary({
            conversationId,
            sessionId,
            language: parsedRequest.data.language,
            executiveSummary: "Role input is complete and awaiting explicit report confirmation.",
            intentPath: "role-fit",
            lastMode: "role-understanding",
            lastOutcome: "success",
            roleStatus: validation.parseStatus,
            roleFamily: inferRoleFamily(title),
            companyName,
            reportStatus: "awaiting-confirmation",
          }),
        ]);
      });

      return NextResponse.json({
        state: "awaiting-report-confirmation",
        answer: readyForReportAnswer({
          title,
          companyName,
          language: parsedRequest.data.language,
          repeatedInput: parsedRequest.data.repeatedInput,
        }),
        validation,
        roleText: roleTextForValidation,
        pendingField: null,
        clarificationExhausted: false,
        safeMessageKey: "role.ready_for_confirmation",
      });
    }

    const missingField = validation.missingFields[0];
    after(async () => {
      await Promise.all([
        logRoleFitEvent({
          eventName: "role.clarification_requested",
          conversationId,
          sessionId,
          traceId,
          mode: "role-understanding",
          outcome: "partial",
          metadata: {
            parseStatus: validation.parseStatus,
            missingField,
            repeatedInput: parsedRequest.data.repeatedInput,
          },
        }),
        logRoleFitSessionSummary({
          conversationId,
          sessionId,
          language: parsedRequest.data.language,
          executiveSummary: "Role input is incomplete; one focused clarification was requested.",
          intentPath: "role-fit",
          lastMode: "role-understanding",
          lastOutcome: "partial",
          roleStatus: validation.parseStatus,
          roleFamily: inferRoleFamily(validation.roleDraft.title?.originalValue ?? ""),
          companyName: validation.roleDraft.company?.originalValue,
          reportStatus: "not-ready",
        }),
      ]);
    });

    const clarificationExhausted = parsedRequest.data.clarificationAttempts + 1 >= maxRoleClarificationAttempts;

    return NextResponse.json({
      state: "awaiting-role-completion",
      answer: clarificationExhausted
        ? clarificationLimitAnswer(parsedRequest.data.language)
        : missingDetailsAnswer({
            missingField,
            missingFields: validation.missingFields,
            language: parsedRequest.data.language,
            repeatedInput: parsedRequest.data.repeatedInput,
          }),
      validation,
      roleText: roleTextForValidation,
      pendingField: clarificationExhausted ? null : missingField,
      clarificationExhausted,
      safeMessageKey: "role.missing_required_fields",
    });
  }

  const provider = getRoleFitModelProvider();
  const approvedContext = await loadApprovedConversationContext();
  const modelResult = await provider.generateChat({
    message: parsedRequest.data.message,
    language: parsedRequest.data.language,
    maxOutputTokens: Math.max(800, Math.min(policy.maxOutputTokens, 1200)),
    approvedContext,
    mode: parsedRequest.data.reportContext ? "report-follow-up" : "general-chat",
    runtimeState: parsedRequest.data.reportContext ? "An existing validated report is active. Answer only about that report." : undefined,
    conversationContext: [parsedRequest.data.conversationContext, parsedRequest.data.reportContext].filter(Boolean).join("\n\n"),
  });

  if (!modelResult.ok) {
    after(() =>
      logRoleFitEvent({
        eventName: "error.occurred",
        conversationId,
        sessionId,
        traceId,
        mode: "portfolio-qa",
        outcome: "failure",
        metadata: {
          error: modelResult.error,
          provider: modelResult.provider,
          safeMessageKey: modelResult.safeMessageKey,
        },
      }),
    );

    return NextResponse.json(
      {
        state: "recoverable-error",
        provider: modelResult.provider,
        model: modelResult.model,
        error: modelResult.error,
        answer: "The live conversation service is not available right now. You can still paste role details, and I will keep the conversation state ready for retry.",
        safeMessageKey: modelResult.safeMessageKey,
        detail: modelResult.detail,
      },
      { status: modelResult.error === "missing-configuration" ? 503 : 502 },
    );
  }

  after(() =>
    logRoleFitSessionSummary({
      conversationId,
      sessionId,
      language: parsedRequest.data.language,
      executiveSummary: "Portfolio question answered without storing conversation text.",
      intentPath: "portfolio-qa",
      lastMode: "portfolio-qa",
      lastOutcome: "success",
      roleStatus: "not-active",
      reportStatus: "not-requested",
    }),
  );

  return NextResponse.json({
    state: "general-qa",
    provider: modelResult.provider,
    model: modelResult.model,
    answer: modelResult.answer,
  });
}
