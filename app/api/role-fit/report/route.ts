import { NextResponse } from "next/server";
import { z } from "zod";
import { getRoleFitModelProvider } from "@/lib/role-fit/model";
import { getRoleFitPolicy } from "@/lib/role-fit/runtime/policy";
import { createRoleValidationResult, evaluateReportEligibility } from "@/lib/role-fit/server/eligibility";

const requestSchema = z
  .object({
    roleText: z.string(),
    approved: z.boolean(),
    completedReportCount: z.union([z.literal(0), z.literal(1), z.literal(2)]).default(0),
    language: z.enum(["he", "en", "mixed"]).default("en"),
  })
  .strict();

function roleField(originalValue: string, sourceId: string) {
  return {
    originalValue,
    sourceRef: {
      sourceId,
      kind: "user-text" as const,
    },
    confidence: "medium" as const,
    confirmed: Boolean(originalValue.trim()),
  };
}

function extractSection(roleText: string, labels: string[]): string {
  const lines = roleText.split(/\r?\n/).map((line) => line.trim());

  for (const label of labels) {
    const match = lines.find((line) => line.toLowerCase().startsWith(`${label.toLowerCase()}:`));
    if (match) return match.slice(label.length + 1).trim();
  }

  return "";
}

function extractList(roleText: string, labels: string[]): string[] {
  const value = extractSection(roleText, labels);
  if (!value) return [];

  return value
    .split(/[;•\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function createRoleDraftFromText(roleText: string) {
  const sourceId = "role_input_current_request";
  const company = extractSection(roleText, ["company", "organization"]);
  const title = extractSection(roleText, ["title", "role"]);
  const description = extractSection(roleText, ["description", "summary"]);
  const responsibilities = extractList(roleText, ["responsibilities", "responsibility"]);
  const requirements = extractList(roleText, ["requirements", "must have", "required"]);

  return {
    company: roleField(company, sourceId),
    title: roleField(title, sourceId),
    description: roleField(description, sourceId),
    responsibilities: responsibilities.map((item) => roleField(item, sourceId)),
    requirements: requirements.map((item) => roleField(item, sourceId)),
    preferredQualifications: [],
  };
}

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

  const traceId = crypto.randomUUID();
  const conversationId = crypto.randomUUID();
  const roleDraft = createRoleDraftFromText(parsedRequest.data.roleText);
  const validation = createRoleValidationResult({
    conversationId,
    traceId,
    roleDraft,
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
