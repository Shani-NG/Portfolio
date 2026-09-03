import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ReportUIPayload } from "../contracts/index.ts";
import { compareActiveReportRole, createPublicReportContext, guardReportLifecycleClaim } from "./active-report.ts";

const reportItem: ReportUIPayload["requirementMapping"]["items"][number] = {
  itemId: "requirement_internal_1",
  originalText: "Lead complex product discovery",
  displayLabel: "Product discovery",
  normalizedConcept: "product discovery",
  source: "requirement",
  importance: "core",
  matchType: "direct",
  impact: "strength",
  evidenceConfidence: "high",
  shortRationale: "The C4I case study demonstrates this capability.",
  clusterIds: ["cluster_internal_1"],
};

const report: ReportUIPayload = {
  schemaVersion: "1.0",
  reportId: "RKFZJ",
  createdAt: "2026-09-03T12:00:00.000Z",
  language: "en",
  state: "ready",
  roleSnapshot: { company: "Acme, Inc.", title: "Senior UX Strategist" },
  overallFitVisual: {
    mode: "fit",
    level: "good",
    fitVisualValue: 65,
    illustrationKey: "fit-good",
    colorToken: "fit.good",
    label: "Good fit",
    rationale: "The role aligns with approved complex-system evidence.",
  },
  evidenceConfidence: { level: "high", rationale: "The evidence is direct." },
  skillsMatch: { items: [reportItem], visualCoverage: { mode: "qualitative", label: "Strong coverage" } },
  requirementMapping: { items: [reportItem], defaultSelectedItemId: reportItem.itemId },
  evidencePanel: {
    clusters: [{
      clusterId: "cluster_internal_1",
      title: "C4I case study",
      summary: "Evidence of complex-system product discovery.",
      supportedItemIds: [reportItem.itemId],
      evidenceIds: ["evidence_internal_1"],
      project: { slug: "c4i-beyond-clarity", title: "C4I — Beyond Clarity" },
      destination: {
        mode: "anchor",
        href: "/projects/c4i-beyond-clarity#discovery",
        anchorId: "discovery",
        dedupeKey: "destination_internal_1",
      },
      reliability: "high",
    }],
    defaultClusterId: "cluster_internal_1",
  },
  topStrengths: { items: [reportItem] },
  keyGaps: { items: [] },
  disclaimer: { copyKey: "report.disclaimer.v1", text: "This is a qualitative assessment." },
  contactCta: {
    variant: "good",
    label: "Contact Shani",
    href: "/contact?source=role-fit-report-cta&report_id=RKFZJ",
    enabled: true,
  },
};

describe("active RoleFit report boundary", () => {
  it("recognizes the same company and title despite case, whitespace, and punctuation", () => {
    assert.equal(compareActiveReportRole(
      { company: "Acme, Inc.", title: "Senior UX Strategist" },
      { company: "  ACME INC  ", title: "senior-ux strategist" },
    ), "same-role");
  });

  it("does not depend on the immediately previous chat message or Home entry source", () => {
    for (const unrelatedPreviousMessage of ["Hi", "שלום", "Started from Home"]) {
      assert.equal(unrelatedPreviousMessage.length > 0, true);
      assert.equal(compareActiveReportRole(
        { company: "Acme", title: "Senior UX Strategist" },
        { company: "Acme", title: "Senior UX Strategist" },
      ), "same-role");
    }
  });

  it("distinguishes a genuinely different company or title", () => {
    assert.equal(compareActiveReportRole(
      { company: "Acme", title: "Senior UX Strategist" },
      { company: "Cyera", title: "Solution Architect" },
    ), "different-role");
  });

  it("projects semantic report follow-up context without internal identifiers", () => {
    const context = createPublicReportContext(report);
    const serialized = JSON.stringify(context);

    assert.doesNotMatch(serialized, /RKFZJ|reportId|report_id|itemId|clusterId|supportedItemIds|evidenceIds|dedupeKey/);
    assert.equal(context.role.title, "Senior UX Strategist");
    assert.equal(context.overallFit.label, "Good fit");
    assert.equal(context.requirements[0]?.shortRationale, "The C4I case study demonstrates this capability.");
    assert.equal(context.evidence[0]?.summary, "Evidence of complex-system product discovery.");
    assert.deepEqual(context.evidence[0]?.project, { slug: "c4i-beyond-clarity", title: "C4I — Beyond Clarity" });
    assert.deepEqual(context.evidence[0]?.destination, {
      mode: "anchor",
      href: "/projects/c4i-beyond-clarity#discovery",
      anchorId: "discovery",
    });
    assert.equal(context.contact.href, "/contact?source=role-fit-report-cta");
  });

  it("replaces a false completion claim when no authoritative report exists", () => {
    assert.equal(guardReportLifecycleClaim({
      answer: "Your fit report is ready and available now.",
      hasAuthoritativeReport: false,
      language: "en",
    }), "The report hasn’t been generated yet. When it’s ready, it will appear in the report panel.");
    assert.equal(guardReportLifecycleClaim({
      answer: "בדיקת ההתאמה מוכנה וזמינה עכשיו.",
      hasAuthoritativeReport: false,
      language: "he",
    }), "הדוח עדיין לא נוצר. כשהוא יהיה מוכן, הוא יופיע באזור הדוח.");
  });

  it("preserves legitimate report follow-up and honest not-yet-generated answers", () => {
    const followUp = "The report is ready. The strongest evidence comes from the C4I case study.";
    assert.equal(guardReportLifecycleClaim({ answer: followUp, hasAuthoritativeReport: true, language: "en" }), followUp);
    const honestPending = "The report hasn't been generated yet.";
    assert.equal(guardReportLifecycleClaim({ answer: honestPending, hasAuthoritativeReport: false, language: "en" }), honestPending);
  });

  it("removes internal report identifiers from model answers", () => {
    assert.equal(guardReportLifecycleClaim({
      answer: "You can continue with report ID: RKFZJ.",
      hasAuthoritativeReport: true,
      language: "en",
    }), "You can continue with the active report.");
    assert.equal(guardReportLifecycleClaim({
      answer: "אפשר להמשיך עם מזהה הדוח: RKFZJ.",
      hasAuthoritativeReport: true,
      language: "he",
    }), "אפשר להמשיך עם הדוח הפעיל.");
  });
});
