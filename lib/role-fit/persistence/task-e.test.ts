import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, test } from "node:test";
import type { ReportUIPayload } from "../contracts/index.ts";
import {
  buildContactLeadRow,
  buildReportPersistenceRow,
  contactLeadRequestSchema,
  createLeadId,
  createReportId,
  formatSheetDate,
  persistCompletedReport,
} from "./task-e.ts";

function reportFixture(): ReportUIPayload {
  return {
    schemaVersion: "1.0",
    reportId: "R7K2Q",
    createdAt: "2026-08-11T10:00:00.000Z",
    language: "en",
    state: "ready",
    roleSnapshot: {
      title: "Head of Product Design",
      company: "Sync.me",
      location: "Hadera",
      workModel: "On-site",
    },
    overallFitVisual: {
      mode: "fit",
      level: "good",
      fitVisualValue: 68,
      illustrationKey: "fit-good",
      colorToken: "fit.good",
      label: "Good fit",
      rationale: "Meaningful alignment without numeric scoring.",
    },
    evidenceConfidence: { level: "high", rationale: "Approved evidence was used." },
    skillsMatch: {
      items: [{
        itemId: "skill-1",
        originalText: "RAW_UNIQUE_JD_PHRASE_SHOULD_NOT_PERSIST",
        displayLabel: "Product design leadership",
        normalizedConcept: "Product Design Leadership",
        source: "requirement",
        importance: "must-have",
        matchType: "direct",
        impact: "strength",
        evidenceConfidence: "high",
        shortRationale: "Approved project evidence supports the capability.",
        clusterIds: ["evidence-c4i"],
      }],
      visualCoverage: { mode: "traceable-count", matchedCount: 1, totalCount: 1 },
    },
    requirementMapping: {
      items: [{
        itemId: "item-1",
        originalText: "RAW_UNIQUE_JD_PHRASE_SHOULD_NOT_PERSIST",
        displayLabel: "Design-system thinking",
        normalizedConcept: "Design-system thinking",
        source: "requirement",
        importance: "must-have",
        matchType: "direct",
        impact: "strength",
        evidenceConfidence: "high",
        shortRationale: "Approved project evidence supports the capability.",
        clusterIds: ["evidence-c4i"],
      }],
      defaultSelectedItemId: "item-1",
    },
    evidencePanel: {
      clusters: [{
        clusterId: "evidence-c4i",
        title: "C4I",
        summary: "Approved evidence summary.",
        supportedItemIds: ["item-1"],
        evidenceIds: ["c4i"],
        project: { slug: "c4i-beyond-clarity", title: "C4I" },
        destination: { mode: "project-top", href: "/experience/c4i-beyond-clarity", dedupeKey: "/experience/c4i-beyond-clarity" },
        reliability: "high",
      }],
    },
    topStrengths: {
      items: [{
        itemId: "strength-1",
        originalText: "RAW_UNIQUE_JD_PHRASE_SHOULD_NOT_PERSIST",
        displayLabel: "Cross-functional collaboration",
        source: "requirement",
        importance: "core",
        matchType: "direct",
        impact: "strength",
        evidenceConfidence: "high",
        shortRationale: "Approved project evidence supports the capability.",
        clusterIds: ["evidence-c4i"],
      }],
    },
    keyGaps: {
      items: [{
        itemId: "gap-1",
        originalText: "RAW_UNIQUE_JD_PHRASE_SHOULD_NOT_PERSIST",
        displayLabel: "Consumer mobile product scale",
        source: "requirement",
        importance: "core",
        matchType: "insufficient-evidence",
        impact: "gap",
        evidenceConfidence: "insufficient",
        shortRationale: "Not documented in approved evidence.",
        clusterIds: [],
      }],
    },
    disclaimer: { copyKey: "report.disclaimer.v1", text: "Qualitative evidence-based report." },
    contactCta: { variant: "good", label: "Contact Shani", href: "/contact?source=role-fit-report-cta&report_id=R7K2Q", enabled: true },
  };
}

describe("Task E Lite persistence helpers", () => {
  test("builds only the approved report row fields without raw JD text", () => {
    const row = buildReportPersistenceRow(reportFixture(), { roleFamily: "product-design" });
    assert.deepEqual(Object.keys(row), [
      "report_id",
      "created_at",
      "role_title",
      "company",
      "role_family",
      "location_or_work_model",
      "fit_result",
      "evidence_projects_used",
      "contact_cta_clicked",
      "report_json_summary",
    ]);
    assert.equal(row.report_id, "R7K2Q");
    assert.equal(row.contact_cta_clicked, "N");
    assert.equal(row.fit_result, "Good");
    assert.equal(row.role_family, "product-design");
    assert.doesNotMatch(JSON.stringify(row), /RAW_UNIQUE_JD_PHRASE_SHOULD_NOT_PERSIST/);
  });

  test("formats IDs and sheet dates according to Task E constraints", () => {
    assert.match(createReportId(), /^R[A-Z0-9]{4}$/);
    assert.match(createLeadId(), /^L[A-Z0-9]{4}$/);
    assert.equal(createReportId().length, 5);
    assert.equal(createLeadId().length, 5);
    assert.equal(formatSheetDate(new Date("2026-08-11T11:36:00.000Z")), "11.08.26 14:36");
  });

  test("validates and builds the approved contact lead fields", () => {
    const parsed = contactLeadRequestSchema.parse({
      name: "Ada",
      email: "ada@example.com",
      company: "Acme",
      message: "Let's talk.",
      report_id: "R7K2Q",
      source_context: "role-fit-report-cta",
    });
    const row = buildContactLeadRow(parsed);
    assert.deepEqual(Object.keys(row), [
      "lead_id",
      "created_at",
      "name",
      "email",
      "company",
      "message",
      "report_id",
      "source_context",
    ]);
    assert.match(row.lead_id, /^L[A-Z0-9]{4}$/);
    assert.equal(row.report_id, "R7K2Q");
    assert.equal(row.source_context, "role-fit-report-cta");
  });

  test("rejects invalid contact payloads server-side", () => {
    assert.equal(contactLeadRequestSchema.safeParse({ name: "", email: "bad", message: "" }).success, false);
    assert.equal(contactLeadRequestSchema.safeParse({ name: "Ada", email: "ada@example.com", company: "", message: "Hello" }).success, false);
    assert.equal(contactLeadRequestSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      company: "Acme",
      message: "Hello",
      report_id: "TOO-LONG",
      source_context: "free-text-source",
    }).success, false);
  });

  test("does not classify a missing report store as durable persistence", async () => {
    const previous = {
      spreadsheetId: process.env.GOOGLE_SHEETS_RUNTIME_SPREADSHEET_ID,
      clientEmail: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      privateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY,
    };
    delete process.env.GOOGLE_SHEETS_RUNTIME_SPREADSHEET_ID;
    delete process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    delete process.env.GOOGLE_SHEETS_PRIVATE_KEY;

    try {
      const result = await persistCompletedReport(reportFixture());
      assert.deepEqual(result, { ok: false, reason: "missing-store" });
    } finally {
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });

  test("marks the in-process report dedupe only after a successful store write", async () => {
    const source = await readFile(join(process.cwd(), "lib", "role-fit", "persistence", "task-e.ts"), "utf8");
    const writeIndex = source.indexOf("const ok = await appendRoleFitReportPersistenceRow(row);");
    const markIndex = source.indexOf("sentReportIds.add(report.reportId);");

    assert.ok(writeIndex >= 0);
    assert.ok(markIndex > writeIndex);
  });

  test("keeps missing contact store as a controlled response instead of a network error", async () => {
    const route = await readFile(join(process.cwd(), "app", "api", "contact", "route.ts"), "utf8");
    const form = await readFile(join(process.cwd(), "app", "contact", "contact-form.tsx"), "utf8");

    assert.match(route, /result\.reason === "invalid-payload" \? 400 : 200/);
    assert.match(form, /!response\.ok \|\| !result\.ok/);
  });
});
