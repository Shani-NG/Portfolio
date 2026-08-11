import { z } from "zod";
import type { ReportUIPayload } from "../contracts/index.ts";

const allowedSourceContexts = ["direct-contact-page", "role-fit-report-cta", "portfolio-cta", "unknown"] as const;
const reportFitResults = ["Strong", "Good", "Partial", "Insufficient Evidence", "Out of Scope"] as const;
const idAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const sentReportIds = new Set<string>();

export const contactLeadRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    email: z.string().trim().email().max(254),
    company: z.string().trim().min(1).max(160),
    message: z.string().trim().min(1).max(1200),
    report_id: z.string().trim().regex(/^[A-Z0-9]{1,5}$/).optional().or(z.literal("")).default(""),
    source_context: z.enum(allowedSourceContexts).default("unknown"),
  })
  .strict();

export type ContactLeadRequest = z.infer<typeof contactLeadRequestSchema>;

type PersistenceResult =
  | { ok: true; skipped?: false }
  | { ok: true; skipped: true; reason: "missing-webhook" | "duplicate-report" }
  | { ok: false; reason: "missing-webhook" | "webhook-failed" | "invalid-payload" };

function createShortId(prefix: "R" | "L") {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const suffix = Array.from(bytes, (byte) => idAlphabet[byte % idAlphabet.length]).join("");
  return `${prefix}${suffix}`;
}

export function createReportId() {
  return createShortId("R");
}

export function createLeadId() {
  return createShortId("L");
}

export function formatSheetDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jerusalem",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.day}.${value.month}.${value.year} ${value.hour}:${value.minute}`;
}

function fitResult(report: ReportUIPayload): (typeof reportFitResults)[number] {
  const fit = report.overallFitVisual;
  if (fit.mode === "insufficient") return "Insufficient Evidence";
  if (fit.mode === "out-of-scope") return "Out of Scope";
  if (fit.level === "strong") return "Strong";
  if (fit.level === "good") return "Good";
  return "Partial";
}

function evidenceProjects(report: ReportUIPayload) {
  return [...new Set(report.evidencePanel.clusters.map((cluster) => cluster.project?.title || cluster.title).filter(Boolean))];
}

function locationOrWorkModel(report: ReportUIPayload) {
  return [report.roleSnapshot.workModel, report.roleSnapshot.location].filter(Boolean).join(", ");
}

function shortItemLabel(item: ReportUIPayload["requirementMapping"]["items"][number]) {
  return (item.displayLabel || item.normalizedConcept || item.originalText).slice(0, 96);
}

export function buildReportPersistenceRow(report: ReportUIPayload, options: { roleFamily?: string } = {}) {
  const createdAt = formatSheetDate();
  const projects = evidenceProjects(report);
  const family = options.roleFamily ?? "";
  const summary = {
    report_id: report.reportId,
    generated_at: createdAt,
    role: {
      title: report.roleSnapshot.title,
      company: report.roleSnapshot.company,
      family,
      location_or_work_model: locationOrWorkModel(report),
    },
    result: {
      fit: fitResult(report),
    },
    evidence_projects: projects,
    top_strengths: report.topStrengths.items.map(shortItemLabel),
    key_gaps: report.keyGaps.items.map((item) => ({
      label: shortItemLabel(item),
      type: item.matchType,
    })),
  };

  return {
    report_id: report.reportId,
    created_at: createdAt,
    role_title: report.roleSnapshot.title,
    company: report.roleSnapshot.company,
    role_family: family,
    location_or_work_model: summary.role.location_or_work_model,
    fit_result: summary.result.fit,
    evidence_projects_used: projects.join("; "),
    contact_cta_clicked: "N" as const,
    report_json_summary: JSON.stringify(summary),
  };
}

export function buildContactLeadRow(input: ContactLeadRequest) {
  const leadId = createLeadId();
  return {
    lead_id: leadId,
    created_at: formatSheetDate(),
    name: input.name,
    email: input.email,
    company: input.company ?? "",
    message: input.message,
    report_id: input.report_id ?? "",
    source_context: input.source_context,
  };
}

async function postWebhook(webhookUrl: string, payload: unknown) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(4_000),
  });
  return response.ok;
}

function logPersistenceFailure(target: "report" | "lead", id: string, category: string) {
  console.warn("[task-e-persistence]", {
    target,
    id,
    category,
    timestamp: formatSheetDate(),
  });
}

export async function persistCompletedReport(report: ReportUIPayload, options: { roleFamily?: string } = {}): Promise<PersistenceResult> {
  const webhookUrl = process.env.ROLE_FIT_REPORT_SAVE_WEBHOOK_URL;
  if (!webhookUrl) {
    logPersistenceFailure("report", report.reportId, "missing-webhook");
    return { ok: true, skipped: true, reason: "missing-webhook" };
  }

  if (sentReportIds.has(report.reportId)) {
    return { ok: true, skipped: true, reason: "duplicate-report" };
  }

  try {
    const row = buildReportPersistenceRow(report, options);
    sentReportIds.add(report.reportId);
    const ok = await postWebhook(webhookUrl, {
      payload_type: "role_fit_report_completed",
      sheet: "role_fit_reports",
      row,
    });
    if (ok) return { ok: true };
    logPersistenceFailure("report", report.reportId, "webhook-failed");
    return { ok: false, reason: "webhook-failed" };
  } catch {
    logPersistenceFailure("report", report.reportId, "webhook-failed");
    return { ok: false, reason: "webhook-failed" };
  }
}

export async function persistContactLead(input: unknown): Promise<PersistenceResult> {
  const parsed = contactLeadRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid-payload" };

  const row = buildContactLeadRow(parsed.data);
  const webhookUrl = process.env.CONTACT_LEAD_SAVE_WEBHOOK_URL;
  if (!webhookUrl) {
    logPersistenceFailure("lead", row.lead_id, "missing-webhook");
    return { ok: false, reason: "missing-webhook" };
  }

  try {
    const ok = await postWebhook(webhookUrl, {
      payload_type: "contact_lead_created",
      sheet: "contact_leads",
      row,
    });
    if (ok) return { ok: true };
    logPersistenceFailure("lead", row.lead_id, "webhook-failed");
    return { ok: false, reason: "webhook-failed" };
  } catch {
    logPersistenceFailure("lead", row.lead_id, "webhook-failed");
    return { ok: false, reason: "webhook-failed" };
  }
}
