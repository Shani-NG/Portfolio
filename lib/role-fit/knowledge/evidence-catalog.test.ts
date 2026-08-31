import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, it } from "node:test";
import { resolveApprovedEvidenceDestination } from "./evidence-destinations.ts";
import { loadApprovedEvidence, loadApprovedEvidenceCatalog, parseCanonicalCaseStudyEvidence } from "./load-approved-evidence.ts";

const expectedCounts = {
  "big-red-button": 9,
  c4i: 7,
  epd: 10,
  howtool: 9,
  monitoring: 9,
  "role-fit-agent": 4,
} as const;

describe("validated canonical evidence catalog", () => {
  it("loads every discovered card from all six canonical project sources exactly once", async () => {
    const catalog = await loadApprovedEvidenceCatalog();
    assert.equal(catalog.audit.projects.length, 6);
    assert.deepEqual(catalog.audit.issues, []);
    assert.equal(catalog.sources.filter((source) => source.sourceType === "case-study").length, 48);
    assert.equal(new Set(catalog.sources.map((source) => source.id)).size, catalog.sources.length);

    for (const audit of catalog.audit.projects) {
      assert.equal(audit.discoveredCount, expectedCounts[audit.projectId]);
      assert.equal(audit.acceptedCount, expectedCounts[audit.projectId]);
      assert.equal(audit.excludedCount, 0);
    }
  });

  it("ingests all Big Red Button heading-style claims instead of silently dropping them", async () => {
    const catalog = await loadApprovedEvidenceCatalog();
    const bigRedSources = catalog.sources.filter((source) => source.project?.id === "big-red-button");
    assert.equal(bigRedSources.length, 9);
    assert.ok(bigRedSources.every((source) => source.claim && source.id.startsWith("big-red-button:ev-brb-")));
  });

  it("returns an allowlisted structured exclusion when a discovered card has no claim", () => {
    const parsed = parseCanonicalCaseStudyEvidence({
      id: "c4i",
      label: "C4I",
      file: "fixture.md",
      sourceType: "case-study",
      project: { id: "c4i", slug: "c4i-beyond-clarity", title: "C4I" },
    }, "E-C4I-99 — malformed\nCapabilities: strategy");

    assert.equal(parsed.discoveredCount, 1);
    assert.deepEqual(parsed.cards, []);
    assert.deepEqual(parsed.issues, [{
      code: "evidence-missing-claim",
      projectId: "c4i",
      evidenceId: "c4i:e-c4i-99",
      sourceFile: "fixture.md",
    }]);
  });

  it("uses the canonical Role Fit source and preserves the four approved IDs", async () => {
    const canonicalPath = join(process.cwd(), "PORTFOLIO_IMPLEMENTATION", "role-fit-agent", "docs", "canonical", "Case_Study_Knowledge_Role_Fit_Agent.md");
    assert.match(await readFile(canonicalPath, "utf8"), /E-ROLE-FIT-04/);
    const catalog = await loadApprovedEvidenceCatalog();
    assert.deepEqual(
      catalog.sources.filter((source) => source.project?.id === "role-fit-agent").map((source) => source.id),
      [
        "role-fit-agent:e-role-fit-01",
        "role-fit-agent:e-role-fit-02",
        "role-fit-agent:e-role-fit-03",
        "role-fit-agent:e-role-fit-04",
      ],
    );
  });

  it("gives every accepted public card a valid route or approved anchor destination", async () => {
    const catalog = await loadApprovedEvidenceCatalog();
    for (const source of catalog.sources.filter((candidate) => candidate.sourceType === "case-study")) {
      const destination = resolveApprovedEvidenceDestination({
        sourceId: source.id,
        projectId: source.project?.id,
        exactAnchorId: source.project?.anchorId,
        sectionAnchorId: source.project?.sectionAnchorId,
      });
      assert.notEqual(destination.destination.mode, "no-link", source.id);
    }
  });

  it("preserves the Role Fit anchor and drawer contract", async () => {
    const page = await readFile(join(process.cwd(), "app", "experience", "role-fit-agent", "page.tsx"), "utf8");
    assert.equal((page.match(/"mvp-scope"/g) ?? []).length, 1);
    assert.match(page, /open=\{phase\.id === "technical-architecture"\}/);
    assert.match(page, /searchParams\.get\("source"\) === "role-fit-report"/);
    assert.match(page, /href="\/minime"/);
  });

  it("builds a Big Red Button candidate for a genuinely supported requirement but not for an unrelated clinical requirement", async () => {
    const relevant = await loadApprovedEvidence("safe targeted recovery", [{ originalText: "Reframe failure handling into safe targeted recovery", source: "requirement" }]);
    const unrelated = await loadApprovedEvidence("clinical catheter", [{ originalText: "Design catheter visualization for electrophysiology", source: "requirement" }]);
    assert.ok(relevant.candidatesByRoleItem?.[0]?.candidates.some((candidate) => candidate.sourceId.startsWith("big-red-button:")));
    assert.equal(unrelated.candidatesByRoleItem?.[0]?.candidates.some((candidate) => candidate.sourceId.startsWith("big-red-button:")), false);
  });

  it("builds explicit Hebrew requirement candidates without treating the JD as evidence", async () => {
    const hebrewRequirement = "ניסיון במחקר משתמשים, אסטרטגיית מוצר ועבודה עם מערכות מורכבות";
    const bundle = await loadApprovedEvidence(hebrewRequirement, [{ originalText: hebrewRequirement, source: "requirement" }]);
    assert.ok((bundle.candidatesByRoleItem?.[0]?.candidates.length ?? 0) > 0);
    assert.equal(bundle.sources.some((source) => source.content.includes(hebrewRequirement)), false);
  });

  it("keeps transferable dashboard and data-mapping evidence for a Power BI requirement without inventing a direct claim", async () => {
    const requirement = "Build executive Power BI dashboards and translate operational data into decision-ready insights";
    const bundle = await loadApprovedEvidence(requirement, [{ originalText: requirement, source: "requirement" }]);
    const packedCandidateIds = bundle.promptContext
      .match(/^ROLE_ITEM_CANDIDATE_SOURCE_IDS: (.+)$/m)?.[1]
      ?.split(", ") ?? [];

    assert.ok(packedCandidateIds.includes("c4i:e-c4i-05"));
    assert.ok(packedCandidateIds.includes("c4i:e-c4i-04"));
    assert.match(bundle.promptContext, /dashboard strategy/);
    assert.match(bundle.promptContext, /data mapping/);
    assert.equal(
      bundle.sources.some((source) => source.id !== "cv" && /Power BI/i.test([source.claim, source.capabilities?.join(" ")].filter(Boolean).join(" "))),
      false,
    );
  });

  it("packs a bounded traceable inference index while preserving the complete canonical bundle", async () => {
    const bundle = await loadApprovedEvidence("product strategy", [{ originalText: "Lead product strategy", source: "requirement" }]);
    const compactSourceIds = [...bundle.promptContext.matchAll(/^EVIDENCE_ID: ([^\s|]+)/gm)].map((match) => match[1]);
    const richSourceIds = [...bundle.promptContext.matchAll(/^### APPROVED_SOURCE_ID: ([^\s]+)/gm)].map((match) => match[1]);

    assert.equal(bundle.sources.filter((source) => source.sourceType === "case-study").length, 48);
    assert.ok((bundle.candidatesByRoleItem?.[0]?.candidates.length ?? 0) > 3);
    assert.match(bundle.promptContext, /COMPACT APPROVED EVIDENCE INDEX/);
    assert.match(bundle.promptContext, /SELECTIVE RICH CONTEXT FOR SEMANTIC REASONING AND CV FALLBACK/);
    assert.match(bundle.promptContext, /EVIDENCE_ID: cv/);
    assert.match(bundle.promptContext, /not an authorization boundary/);
    assert.match(bundle.promptContext, /may truthfully support any role item/);
    assert.ok(compactSourceIds.length > 1 && compactSourceIds.length <= 12);
    assert.ok(richSourceIds.length > 0 && richSourceIds.length < compactSourceIds.length);
    for (const sourceId of [...compactSourceIds, ...richSourceIds]) {
      assert.ok(bundle.sources.some((source) => source.id === sourceId), sourceId);
    }
    assert.ok(bundle.promptContext.length < 12_000, `prompt context was ${bundle.promptContext.length} characters`);
  });
});
