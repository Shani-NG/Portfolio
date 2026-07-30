import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { after, NextResponse } from "next/server";
import { z } from "zod";
import { getRoleFitModelProvider } from "@/lib/role-fit/model";
import { logRoleFitEvent, logRoleFitSessionSummary } from "@/lib/role-fit/runtime/google-sheets-store";
import { getRoleFitPolicy } from "@/lib/role-fit/runtime/policy";
import { inferRoleFamily, looksLikeReportIntent, looksLikeRoleInput, validateRoleText } from "@/lib/role-fit/server/role-understanding";

const requestSchema = z
  .object({
    conversationId: z.string(),
    sessionId: z.string().optional(),
    message: z.string().min(1),
    language: z.enum(["he", "en", "mixed"]).default("en"),
    repeatedInput: z.boolean().optional().default(false),
  })
  .strict();

async function loadApprovedConversationContext() {
  const root = process.cwd();
  const files = [
    "PORTFOLIO_IMPLEMENTATION/role-fit-agent/docs/canonical/General_Profile_Knowledge.md",
    "PORTFOLIO_IMPLEMENTATION/role-fit-agent/docs/canonical/Portfolio_Knowledge_Index.md",
  ];
  const contents = await Promise.all(
    files.map(async (file) => {
      const content = await readFile(join(root, file), "utf8");
      return content.slice(0, 12000);
    }),
  );

  return contents.join("\n\n---\n\n");
}

function missingFieldQuestion(missingField: string | undefined) {
  if (missingField === "title") return "What is the role title?";
  if (missingField === "responsibilities") return "Please add the main responsibilities section.";
  if (missingField === "requirements") return "Please add the main requirements section.";
  return "What key role detail is still missing?";
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
  const { conversationId, sessionId } = parsedRequest.data;

  if (hasReportIntent || hasRoleInput) {
    const validation = validateRoleText({
      conversationId,
      traceId,
      roleText: parsedRequest.data.message,
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
        answer: parsedRequest.data.repeatedInput
          ? "The role details are already complete. Confirm report generation when you are ready."
          : "I found enough role detail. Please confirm if you want me to generate an evidence-based Role Fit report.",
        validation,
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
      answer: parsedRequest.data.repeatedInput
        ? `This appears unchanged. ${missingFieldQuestion(missingField)}`
        : `I can analyze this role, but one key detail is still missing. ${missingFieldQuestion(missingField)}`,
      validation,
      safeMessageKey: "role.missing_required_fields",
    });
  }

  const provider = getRoleFitModelProvider();
  const approvedContext = await loadApprovedConversationContext();
  const modelResult = await provider.generateChat({
    message: parsedRequest.data.message,
    language: parsedRequest.data.language,
    maxOutputTokens: Math.min(policy.maxOutputTokens, 350),
    approvedContext,
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
