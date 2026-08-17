import { z } from "zod";
import type { ReportUIPayload } from "../contracts/index.ts";
import { createLeadId, createReportId } from "../identifiers.ts";
import {
  appendContactLeadPersistenceRow,
  isRoleFitRuntimeStoreConfigured,
} from "../runtime/google-sheets-store.ts";
import {
  getPersistedRoleFitCompletedReportCount,
  persistRoleFitCompletedReport,
} from "./supabase-report-store.ts";

const allowedSourceContexts = ["direct-contact-page", "role-fit-report-cta", "portfolio-cta", "unknown"] as const;
const reportFitResults = ["Strong", "Good", "Partial", "Insufficient Evidence", "Out of Scope"] as const;

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

export type ReportPersistenceResult =
  | { ok: true; persisted: true; duplicate?: boolean; completedReportCount: number }
  | { ok: false; reason: "missing-config" | "request-failed" | "invalid-response" | "invalid-payload" | "limit-reached"; completedReportCount?: number };

type ContactPersistenceResult =
  | { ok: true }
  | { ok: false; reason: "missing-store" | "store-failed" | "invalid-payload" };

export { createLeadId, createReportId } from "../identifiers.ts";

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

function logPersistenceFailure(target: "report" | "lead", id: string, category: string) {
  console.warn("[task-e-persistence]", {
    target,
    id,
    category,
    timestamp: formatSheetDate(),
  });
}

export async function getCompletedReportCount(sessionId: string) {
  return getPersistedRoleFitCompletedReportCount(sessionId);
}

export async function persistCompletedReport(
  report: ReportUIPayload,
  options: { roleFamily?: string; sessionId: string },
): Promise<ReportPersistenceResult> {
  const row = buildReportPersistenceRow(report, options);
  const reportJson = JSON.parse(row.report_json_summary) as unknown;
  if (typeof reportJson !== "object" || reportJson === null || Array.isArray(reportJson)) {
    logPersistenceFailure("report", report.reportId, "invalid-payload");
    return { ok: false, reason: "invalid-payload" };
  }

  const persistence = await persistRoleFitCompletedReport({
    reportId: report.reportId,
    sessionId: options.sessionId,
    roleTitle: row.role_title,
    companyName: row.company,
    roleFamily: row.role_family,
    locationOrWorkModel: row.location_or_work_model,
    fitLabel: row.fit_result as "Strong" | "Good" | "Partial",
    schemaVersion: report.schemaVersion,
    evidenceProjectsUsed: evidenceProjects(report),
    contactCtaClicked: false,
    reportJson: reportJson as Record<string, unknown>,
  });

  if (!persistence.ok) {
    logPersistenceFailure("report", report.reportId, persistence.reason);
    return persistence;
  }

  return {
    ok: true,
    persisted: true,
    ...(persistence.outcome === "duplicate" ? { duplicate: true } : {}),
    completedReportCount: persistence.completedReportCount,
  };
}

export async function persistContactLead(input: unknown): Promise<ContactPersistenceResult> {
  const parsed = contactLeadRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid-payload" };

  const row = buildContactLeadRow(parsed.data);
  if (!isRoleFitRuntimeStoreConfigured()) {
    logPersistenceFailure("lead", row.lead_id, "missing-store");
    return { ok: false, reason: "missing-store" };
  }

  try {
    const ok = await appendContactLeadPersistenceRow(row);
    if (ok) return { ok: true };
    logPersistenceFailure("lead", row.lead_id, "store-failed");
    return { ok: false, reason: "store-failed" };
  } catch {
    logPersistenceFailure("lead", row.lead_id, "store-failed");
    return { ok: false, reason: "store-failed" };
  }
}
