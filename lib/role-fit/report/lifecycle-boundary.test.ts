import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, test } from "node:test";

const projectRoot = process.cwd();

describe("Role Fit report lifecycle boundary", () => {
  test("keeps the public loading presentation timed and presentation-only", async () => {
    const [page, progress] = await Promise.all([
      readFile(join(projectRoot, "app", "minime", "page.tsx"), "utf8"),
      readFile(join(projectRoot, "components", "role-fit", "role-fit-report-progress.tsx"), "utf8"),
    ]);

    assert.match(progress, /const stageTransitionDelays = \[3500, 7500, 11500, 15500\] as const/);
    assert.equal((progress.match(/window\.setTimeout/g) ?? []).length, 1);
    assert.doesNotMatch(progress, /setInterval/);
    assert.match(progress, /setStageIndex\(index \+ 1\)/);
    assert.match(progress, /Making sure nothing is missed/);
    assert.match(page, /type ReportPresentationState = "normal" \| "success-bridge"/);
    assert.match(page, /window\.setTimeout\(\(\) => \{/);
    assert.match(page, /\}, 650\)/);
    assert.match(page, /liveSession\.state === "generating-report"/);
    assert.match(page, /liveSession\.state === "recoverable-error" && !activeReport/);
    assert.match(page, /activeReport && reportPresentationState === "success-bridge"/);
    assert.match(page, /<RoleFitLiveReport/);
  });

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
    assert.match(page, /The fit review is available now, but it was not saved in the session/);
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

  test("uses a local RoleFit report-analysis output budget without changing shared runtime policy", async () => {
    const route = await readFile(join(projectRoot, "app", "api", "role-fit", "report", "route.ts"), "utf8");
    const policy = await readFile(join(projectRoot, "lib", "role-fit", "runtime", "policy.ts"), "utf8");
    const jobFitEvaluator = await readFile(join(projectRoot, "lib", "job-fit", "evaluate.ts"), "utf8");

    assert.match(route, /const roleFitReportAnalysisMaxOutputTokens = 4_000/);
    assert.match(route, /resolveRoleFitReportAnalysisMaxOutputTokens\(policy\.maxOutputTokens\)/);
    assert.match(route, /maxOutputTokens: reportAnalysisMaxOutputTokens/);
    assert.match(policy, /maxOutputTokens: readNumber\("ROLE_FIT_MAX_OUTPUT_TOKENS", 2500\)/);
    assert.match(jobFitEvaluator, /maxOutputTokens: 2_500/);
  });

  test("keeps retryable provider failures before persistence while preserving the pending role flow", async () => {
    const page = await readFile(join(projectRoot, "app", "minime", "page.tsx"), "utf8");
    const route = await readFile(join(projectRoot, "app", "api", "role-fit", "report", "route.ts"), "utf8");
    const providerFailure = route.indexOf("createReportProviderFailureContract(failedModelResult)");
    const persistence = route.indexOf("const persistence = await persistCompletedReport");
    const failedRequestBranch = page.slice(
      page.indexOf('if (!response.ok || result.state !== "ready")'),
      page.indexOf("const parsedReport = reportUIPayloadSchema.safeParse"),
    );

    assert.ok(providerFailure >= 0);
    assert.ok(persistence > providerFailure);
    assert.match(route, /return NextResponse\.json\(failureContract\.body, \{ status: failureContract\.status \}\)/);
    assert.match(failedRequestBranch, /state: isNoReport \? "general-qa" : "recoverable-error"/);
    assert.match(failedRequestBranch, /pendingReportId: isNoReport \? null : reportId/);
    assert.match(failedRequestBranch, /pendingReportConfirmation: isNoReport \? false : !missingField/);
    assert.doesNotMatch(failedRequestBranch, /activeRoleDraft\s*:/);
    assert.doesNotMatch(failedRequestBranch, /completedReportCount\s*:/);
  });

  test("keeps report-limit blocks distinct from retryable provider failures", async () => {
    const [page, route] = await Promise.all([
      readFile(join(projectRoot, "app", "minime", "page.tsx"), "utf8"),
      readFile(join(projectRoot, "app", "api", "role-fit", "report", "route.ts"), "utf8"),
    ]);
    const serverLimitBlock = route.slice(
      route.indexOf("if (completedReportCount >= policy.maxReportsPerSession)"),
      route.indexOf("if (!parsedRequest.data.approved)"),
    );

    assert.match(serverLimitBlock, /eventName: "report\.limit_blocked"/);
    assert.match(serverLimitBlock, /status: 429/);
    assert.match(serverLimitBlock, /state: "blocked"/);
    assert.doesNotMatch(serverLimitBlock, /provider\.generateReport|model generation failed|retryable/);
    assert.doesNotMatch(page, /completedReportCount >= 2/);
    assert.match(page, /reportRetryableFailureAnswer\(language\)/);
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
