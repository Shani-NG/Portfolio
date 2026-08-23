import assert from "node:assert/strict";
import test from "node:test";
import type { ReportUIPayload } from "../contracts/index.ts";
import { evidenceClusterTitle, evidenceConfidenceAccessibilityLabel, evidenceProjectTitles } from "./evidence-card-display.ts";

type EvidenceCluster = ReportUIPayload["evidencePanel"]["clusters"][number];

function cluster(overrides: Partial<EvidenceCluster> = {}): EvidenceCluster {
  return {
    clusterId: "evidence-c4i-01",
    title: "C4I evidence",
    summary: "Approved evidence.",
    supportedItemIds: ["item-1"],
    evidenceIds: ["c4i:e-c4i-01"],
    project: { slug: "c4i-beyond-clarity", title: "C4I - Beyond Clarity" },
    destination: {
      mode: "anchor",
      href: "/experience/c4i-beyond-clarity#before-ux-organizational-alignment",
      anchorId: "before-ux-organizational-alignment",
      dedupeKey: "/experience/c4i-beyond-clarity#before-ux-organizational-alignment",
    },
    reliability: "high",
    ...overrides,
  };
}

test("collapsed evidence labels show unique project titles in preserved order", () => {
  const c4i = cluster();
  const repeatedC4i = cluster({ clusterId: "evidence-c4i-02", evidenceIds: ["c4i:e-c4i-02"] });
  const monitoring = cluster({
    clusterId: "evidence-monitoring-01",
    evidenceIds: ["monitoring:e-mpi-01"],
    title: "Monitoring evidence",
    project: { slug: "monitoring-product-intelligence", title: "Monitoring and Product Intelligence" },
    destination: {
      mode: "anchor",
      href: "/experience/monitoring-product-intelligence#scenario-mapping",
      anchorId: "scenario-mapping",
      dedupeKey: "/experience/monitoring-product-intelligence#scenario-mapping",
    },
  });

  assert.deepEqual(evidenceProjectTitles([c4i, repeatedC4i, monitoring]), ["C4I - Beyond Clarity", "Monitoring and Product Intelligence"]);
});

test("single-project evidence headings show the anchor section without repeating the project", () => {
  assert.equal(evidenceClusterTitle(cluster(), false), "Before UX: organizational alignment.");
});

test("multi-project evidence headings identify both the anchor section and the project", () => {
  const monitoring = cluster({
    clusterId: "evidence-monitoring-01",
    title: "Monitoring evidence",
    project: { slug: "monitoring-product-intelligence", title: "Monitoring and Product Intelligence" },
    destination: {
      mode: "anchor",
      href: "/experience/monitoring-product-intelligence#scenario-mapping",
      anchorId: "scenario-mapping",
      dedupeKey: "/experience/monitoring-product-intelligence#scenario-mapping",
    },
  });

  assert.equal(
    evidenceClusterTitle(monitoring, true),
    "Scenario mapping turned usage into measurable intent | Monitoring and Product Intelligence",
  );
});

test("confidence remains available to assistive technology without adding visible status text", () => {
  assert.equal(
    evidenceConfidenceAccessibilityLabel(["C4I - Beyond Clarity"], "high"),
    "C4I - Beyond Clarity. high evidence confidence.",
  );
});
