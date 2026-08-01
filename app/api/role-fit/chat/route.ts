import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { after, NextResponse } from "next/server";
import { z } from "zod";
import { getRoleFitModelProvider } from "@/lib/role-fit/model";
import { logRoleFitEvent, logRoleFitSessionSummary } from "@/lib/role-fit/runtime/google-sheets-store";
import { getRoleFitPolicy } from "@/lib/role-fit/runtime/policy";
import { inferRoleFamily, isValidRoleClarificationAnswer, looksLikeReportIntent, looksLikeRoleInput, resolveRoleTextForValidation, validateRoleText } from "@/lib/role-fit/server/role-understanding";

const pendingFieldSchema = z.enum(["company", "title", "responsibilities", "requirements"]);

const requestSchema = z
  .object({
    conversationId: z.string(),
    sessionId: z.string().optional(),
    message: z.string().min(1),
    language: z.enum(["he", "en", "mixed"]).default("en"),
    repeatedInput: z.boolean().optional().default(false),
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

function isHebrew(language: "he" | "en" | "mixed") {
  return language === "he" || language === "mixed";
}

function missingFieldQuestion(missingField: string | undefined, language: "he" | "en" | "mixed") {
  if (isHebrew(language)) {
    if (missingField === "title") return "מה שם המשרה?";
    if (missingField === "responsibilities") return "אפשר להוסיף את תחומי האחריות המרכזיים?";
    if (missingField === "requirements") return "אפשר להוסיף את הדרישות או הכישורים המרכזיים?";
    return "איזה פרט מרכזי חסר במשרה?";
  }

  if (missingField === "title") return "What is the role title?";
  if (missingField === "responsibilities") return "Please add the main responsibilities section.";
  if (missingField === "requirements") return "Please add the main requirements or qualifications.";
  return "What key role detail is still missing?";
}

function readyForReportAnswer(input: { title: string; companyName?: string; language: "he" | "en" | "mixed"; repeatedInput: boolean }) {
  if (isHebrew(input.language)) {
    const roleLabel = input.title ? ` עבור "${input.title}"` : "";
    const companyLabel = input.companyName ? ` ב-${input.companyName}` : "";
    return input.repeatedInput
      ? `יש לי כבר מספיק מידע${roleLabel}${companyLabel}. שנמשיך לדוח?`
      : `יש לי את כל מה שאני צריכה כדי לייצר דוח${roleLabel}${companyLabel}. שנמשיך?`;
  }

  const roleLabel = input.title ? ` for "${input.title}"` : "";
  const companyLabel = input.companyName ? ` at ${input.companyName}` : "";
  return input.repeatedInput
    ? `I already have enough role detail${roleLabel}${companyLabel}. Shall I generate the report?`
    : `I have everything I need to generate a report${roleLabel}${companyLabel}. Shall we continue?`;
}

function missingDetailsAnswer(input: { missingField: string | undefined; language: "he" | "en" | "mixed"; repeatedInput: boolean }) {
  const question = missingFieldQuestion(input.missingField, input.language);
  if (isHebrew(input.language)) {
    return input.repeatedInput
      ? `זה נראה אותו טקסט. ${question}`
      : `אני יכולה לנתח את המשרה, אבל חסר פרט אחד. ${question}`;
  }

  return input.repeatedInput
    ? `This appears unchanged. ${question}`
    : `I can analyze this role, but one key detail is still missing. ${question}`;
}

function looksLikeRoleSubmissionSetup(message: string) {
  return /\b(upload|paste|provide|add|send)\b.*\b(job|role|description|jd|details)\b/i.test(message) || /להעלות|להדביק|להזין|לשלוח|משרה|תיאור תפקיד/.test(message);
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
  const hasRoleInput = looksLikeRoleInput(parsedRequest.data.message);
  const roleContext = parsedRequest.data.roleContext;
  const pendingRoleField = roleContext?.pendingField;
  const isFieldClarification = Boolean(roleContext && pendingRoleField && !hasRoleInput);
  const { conversationId, sessionId } = parsedRequest.data;

  if (roleContext && pendingRoleField && isFieldClarification && !isValidRoleClarificationAnswer(pendingRoleField, parsedRequest.data.message)) {
    return NextResponse.json({
      state: "awaiting-role-completion",
      answer: missingDetailsAnswer({
        missingField: pendingRoleField,
        language: parsedRequest.data.language,
        repeatedInput: false,
      }),
      roleText: roleContext.roleText,
      pendingField: pendingRoleField,
      safeMessageKey: "role.invalid_clarification",
    });
  }

  const roleTextForValidation = resolveRoleTextForValidation({
    message: parsedRequest.data.message,
    savedRoleText: roleContext?.roleText,
    pendingField: pendingRoleField,
    hasRoleInput,
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
      answer: isHebrew(parsedRequest.data.language)
        ? "מעולה. אפשר להעלות קובץ או להדביק כאן את טקסט המשרה, ואני אקח את זה משם."
        : "Great. You can upload a file or paste the role text here, and I will take it from there.",
      safeMessageKey: "role.awaiting_input",
    });
  }

  if (!parsedRequest.data.reportContext && (hasReportIntent || hasRoleInput || isFieldClarification)) {
    const validation = validateRoleText({
      conversationId,
      traceId,
      roleText: roleTextForValidation,
      detectedLanguage: parsedRequest.data.language,
    });

    if (validation.parseStatus === "valid-complete") {
      const title = validation.roleDraft.title?.originalValue ?? "";
      const companyName = validation.roleDraft.company?.originalValue;
      const autoApproveReport = isFieldClarification;
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
        answer: autoApproveReport
          ? isHebrew(parsedRequest.data.language)
            ? "תודה, כל הפרטים הנדרשים הושלמו. אני מפיקה את הדוח עכשיו."
            : "Thanks, all required details are complete. I am generating the report now."
          : readyForReportAnswer({
              title,
              companyName,
              language: parsedRequest.data.language,
              repeatedInput: parsedRequest.data.repeatedInput,
            }),
        validation,
        roleText: roleTextForValidation,
        pendingField: null,
        autoApproveReport,
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

    return NextResponse.json({
      state: "awaiting-role-completion",
      answer: missingDetailsAnswer({
        missingField,
        language: parsedRequest.data.language,
        repeatedInput: parsedRequest.data.repeatedInput,
      }),
      validation,
      roleText: roleTextForValidation,
      pendingField: missingField,
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
