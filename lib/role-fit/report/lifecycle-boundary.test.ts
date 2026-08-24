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
    assert.doesNotMatch(noReportBranch, /reportId,\s*\n\s*traceId,/);
  });

  test("uses server-authoritative count and keeps a degraded report visible without consuming client allowance", async () => {
    const page = await readFile(join(projectRoot, "app", "minime", "page.tsx"), "utf8");
    const route = await readFile(join(projectRoot, "app", "api", "role-fit", "report", "route.ts"), "utf8");

    assert.match(route, /getCompletedReportCount\(sessionId\)/);
    assert.doesNotMatch(route, /parsedRequest\.data\.completedReportCount >= policy\.maxReportsPerSession/);
    assert.match(page, /const persisted = result\.persistence === "persisted"/);
    assert.match(page, /typeof result\.completedReportCount === "number"/);
    assert.match(page, /: reportSession\.completedReportCount,/);
    assert.match(page, /The report is available to review, but its persistence is unavailable/);
  });

  test("keeps the two-report public lifecycle independent from internal Job Automation quota", async () => {
    const route = await readFile(join(projectRoot, "app", "api", "role-fit", "report", "route.ts"), "utf8");
    const policy = await readFile(join(projectRoot, "lib", "role-fit", "runtime", "policy.ts"), "utf8");
    const eligibility = await readFile(join(projectRoot, "lib", "role-fit", "server", "eligibility.ts"), "utf8");

    assert.match(route, /getRoleFitPolicy\(\)/);
    assert.match(route, /getCompletedReportCount\(sessionId\)/);
    assert.match(route, /completedReportCount >= policy\.maxReportsPerSession/);
    assert.match(route, /persistCompletedReport\(/);
    assert.doesNotMatch(route, /job-fit\/quota|JOB_EVALUATOR_DAILY_LIMIT|reserveJobEvaluatorSlot/);
    assert.match(policy, /readNumber\("ROLE_FIT_MAX_REPORTS_PER_SESSION", 2\)/);
    assert.match(eligibility, /completedReportCount >= 2/);
  });

  test("treats no-report as a non-error lifecycle result without a completed-report increment", async () => {
    const page = await readFile(join(projectRoot, "app", "minime", "page.tsx"), "utf8");

    assert.match(page, /const isNoReport = result\.state === "no-report"/);
    assert.match(page, /state: isNoReport \? "general-qa" : "recoverable-error"/);
    assert.match(page, /pendingReportConfirmation: isNoReport \? false : !missingField/);
    assert.match(page, /pendingReportId: isNoReport \? null : reportId/);
  });

  test("logs allowlisted composition and repair diagnostics at the existing failure boundary", async () => {
    const route = await readFile(join(projectRoot, "app", "api", "role-fit", "report", "route.ts"), "utf8");
    const originalDiagnostic = route.indexOf("const originalCompositionDiagnostic");
    const repairBranch = route.indexOf("if (!composition.ok && shouldUseModelRepair", originalDiagnostic);
    const failureLog = route.indexOf('console.error("[role-fit-report] report composition failed"', repairBranch);
    const failureLogEnd = route.indexOf("after(() =>", failureLog);
    const failureLogBlock = route.slice(failureLog, failureLogEnd);

    assert.ok(originalDiagnostic >= 0);
    assert.ok(repairBranch > originalDiagnostic);
    assert.ok(failureLog > repairBranch);
    assert.match(route, /repairOutcome = "repair-call-failed"/);
    assert.match(route, /repairOutcome = "repaired-output-still-invalid"/);
    assert.match(failureLogBlock, /createCompositionFailureMetadata/);
    assert.match(failureLogBlock, /originalDiagnostic:/);
    assert.match(failureLogBlock, /repairOutcome,/);
    assert.match(failureLogBlock, /repairFailureCategory,/);
    assert.match(failureLogBlock, /finalDiagnostic:/);
    assert.doesNotMatch(failureLogBlock, /roleText|approvedEvidence|runtimeState|authorization|secret/i);
  });

  test("recovers an unrepresented trusted limitation before requesting a second model analysis", async () => {
    const route = await readFile(join(projectRoot, "app", "api", "role-fit", "report", "route.ts"), "utf8");
    const originalDiagnostic = route.indexOf("const originalCompositionDiagnostic");
    const deterministicRecovery = route.indexOf("getDeterministicLimitationRepresentation", originalDiagnostic);
    const modelRepair = route.indexOf("if (!composition.ok && shouldUseModelRepair", deterministicRecovery);
    const recoveryBlock = route.slice(deterministicRecovery, modelRepair);

    assert.ok(originalDiagnostic >= 0);
    assert.ok(deterministicRecovery > originalDiagnostic);
    assert.ok(modelRepair > deterministicRecovery);
    assert.match(recoveryBlock, /analysis: modelResult\.analysis/);
    assert.match(recoveryBlock, /representedLimitationRoleItemIndexes/);
    assert.match(recoveryBlock, /composition = composeReportUIPayload/);
    assert.doesNotMatch(recoveryBlock, /provider\.generateReport/);
  });
});
