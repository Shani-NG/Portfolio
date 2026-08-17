import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, test } from "node:test";

const projectRoot = process.cwd();

describe("Role Fit report lifecycle boundary", () => {
  test("derives eligibility from the composed report and returns no-report before persistence", async () => {
    const route = await readFile(join(projectRoot, "app", "api", "role-fit", "report", "route.ts"), "utf8");
    const noReportStart = route.indexOf('if (eligibility.state === "no-report")');
    const persistenceStart = route.indexOf("const persistence = await persistCompletedReport");
    const noReportBranch = route.slice(noReportStart, persistenceStart);

    assert.match(route, /evidenceState: evidenceStateFromComposedReport\(report\)/);
    assert.ok(noReportStart >= 0);
    assert.ok(persistenceStart > noReportStart);
    assert.match(noReportBranch, /state: "no-report"/);
    assert.doesNotMatch(noReportBranch, /persistCompletedReport/);
  });

  test("counts only a durably persisted completed report and keeps a degraded report visible", async () => {
    const page = await readFile(join(projectRoot, "app", "minime", "page.tsx"), "utf8");

    assert.match(page, /const persisted = result\.persistence === "persisted"/);
    assert.match(page, /completedReportCount: persisted/);
    assert.match(page, /: reportSession\.completedReportCount,/);
    assert.match(page, /The report is available to review, but its persistence is unavailable/);
  });

  test("treats no-report as a non-error lifecycle result without a completed-report increment", async () => {
    const page = await readFile(join(projectRoot, "app", "minime", "page.tsx"), "utf8");

    assert.match(page, /const isNoReport = result\.state === "no-report"/);
    assert.match(page, /state: isNoReport \? "general-qa" : "recoverable-error"/);
    assert.match(page, /pendingReportConfirmation: isNoReport \? false : !missingField/);
  });
});
