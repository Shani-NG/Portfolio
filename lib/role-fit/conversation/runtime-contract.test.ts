import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, it } from "node:test";

describe("Role Fit runtime conversation contract", () => {
  it("never auto-approves a report after role completion", async () => {
    const route = await readFile(join(process.cwd(), "app", "api", "role-fit", "chat", "route.ts"), "utf8");

    assert.doesNotMatch(route, /autoApproveReport/);
    assert.match(route, /state: "awaiting-report-confirmation"/);
    assert.match(route, /readyForReportAnswer/);
  });

  it("generates a report from chat only after an explicit confirmation", async () => {
    const page = await readFile(join(process.cwd(), "app", "minime", "page.tsx"), "utf8");
    const confirmationGuard = page.indexOf("currentSession.pendingReportConfirmation && isReportConfirmationText(submittedText)");
    const guardedRequest = page.indexOf("await requestReport(currentSession);", confirmationGuard);
    const guardExit = page.indexOf("return;", guardedRequest);

    assert.ok(confirmationGuard >= 0);
    assert.ok(guardedRequest > confirmationGuard);
    assert.ok(guardExit > guardedRequest);
  });

  it("keeps report retries on the saved role without collecting it again", async () => {
    const page = await readFile(join(process.cwd(), "app", "minime", "page.tsx"), "utf8");
    const behavior = await readFile(join(process.cwd(), "lib", "role-fit", "conversation", "behavior.ts"), "utf8");

    assert.match(page, /currentSession\.pendingReportConfirmation && isReportConfirmationText\(submittedText\)/);
    assert.match(page, /await requestReport\(currentSession\)/);
    assert.match(behavior, /generate\(\?:\\s\+\(\?:the\|this\)\)\?\\s\+report/);
    assert.match(behavior, /try\\s\+again/);
  });

  it("automatically reveals the newest chat output", async () => {
    const page = await readFile(join(process.cwd(), "app", "minime", "page.tsx"), "utf8");

    assert.match(page, /chatHistory\.scrollTo\(\{ top: chatHistory\.scrollHeight/);
    assert.match(page, /chatEndRef\.current\?\.scrollIntoView/);
    assert.match(page, /prefers-reduced-motion: reduce/);
  });

  it("keeps collecting role details after Generate Report is requested", async () => {
    const [page, route] = await Promise.all([
      readFile(join(process.cwd(), "app", "minime", "page.tsx"), "utf8"),
      readFile(join(process.cwd(), "app", "api", "role-fit", "chat", "route.ts"), "utf8"),
    ]);

    assert.match(page, /roleCollectionActive: currentSession\.state === "awaiting-role-completion"/);
    assert.match(route, /shouldValidateRoleCollectionMessage\(\{/);
    assert.match(route, /roleCollectionActive: parsedRequest\.data\.roleCollectionActive/);
  });

  it("opens a real file input instead of sending an upload chat message", async () => {
    const page = await readFile(join(process.cwd(), "app", "minime", "page.tsx"), "utf8");

    assert.match(page, /type="file"/);
    assert.match(page, /roleFileInputRef\.current\?\.click\(\)/);
    assert.doesNotMatch(page, /submitLiveMessage\("I want to upload a job description/);
  });

  it("disables conversation submission when the live agent is unavailable", async () => {
    const [page, route] = await Promise.all([
      readFile(join(process.cwd(), "app", "minime", "page.tsx"), "utf8"),
      readFile(join(process.cwd(), "app", "api", "role-fit", "chat", "route.ts"), "utf8"),
    ]);

    assert.match(route, /The Role Fit Agent is not available right now\. Please try again later\./);
    assert.match(page, /disabled=\{isSending \|\| isAgentUnavailable \|\| !roleInput\.trim\(\)\}/);
    assert.match(page, /Role Fit Agent is not available right now\. Please try again later\./);
    assert.doesNotMatch(page, /The live agent needs attention/);
  });

  it("appends input from Home after restoring the active conversation", async () => {
    const page = await readFile(join(process.cwd(), "app", "minime", "page.tsx"), "utf8");
    const restoreIndex = page.indexOf("const restoredSession = restoreRoleFitLiveSession()");
    const consumeIndex = page.indexOf("const pendingInput = consumePendingHomeRoleFitInput()", restoreIndex);
    const submitIndex = page.indexOf("restoredSession);", consumeIndex);

    assert.ok(restoreIndex >= 0);
    assert.ok(consumeIndex > restoreIndex);
    assert.ok(submitIndex > consumeIndex);
  });

  it("restores the persisted report before creating page state", async () => {
    const page = await readFile(join(process.cwd(), "app", "minime", "page.tsx"), "utf8");

    assert.match(page, /useState<RoleFitLiveSession>\(\(\) => restoreRoleFitLiveSession\(\)\)/);
    assert.doesNotMatch(page, /useState<RoleFitLiveSession>\(\(\) => getRoleFitLiveSession\(\)\)/);
  });

  it("renders the narrow report switch from the active report in both directions", async () => {
    const page = await readFile(join(process.cwd(), "app", "minime", "page.tsx"), "utf8");

    assert.match(page, /isNarrowLayout && activeReport/);
    assert.match(page, /activePane === "report" \? "Switch to chat" : "Switch to report"/);
    assert.match(page, /switchPane\(activePane === "report" \? "chat" : "report"\)/);
  });

  it("distinguishes a report service failure from missing role details", async () => {
    const [page, reportRoute] = await Promise.all([
      readFile(join(process.cwd(), "app", "minime", "page.tsx"), "utf8"),
      readFile(join(process.cwd(), "app", "api", "role-fit", "report", "route.ts"), "utf8"),
    ]);

    assert.match(page, /Report not generated/);
    assert.match(page, /A few role details are still missing/);
    assert.match(reportRoute, /Your role details are still here/);
    assert.doesNotMatch(reportRoute, /status: 502/);
  });

  it("keeps chat provider failures as recoverable API responses", async () => {
    const route = await readFile(join(process.cwd(), "app", "api", "role-fit", "chat", "route.ts"), "utf8");
    const providerFailureBranch = route.slice(route.indexOf("if (!modelResult.ok)"));

    assert.match(providerFailureBranch, /state: "recoverable-error"/);
    assert.doesNotMatch(providerFailureBranch, /status: modelResult\.error === "missing-configuration"/);
    assert.doesNotMatch(providerFailureBranch, /status: 502/);
  });

  it("requests English report generation even when the conversation is Hebrew", async () => {
    const page = await readFile(join(process.cwd(), "app", "minime", "page.tsx"), "utf8");

    assert.match(page, /language: "en"/);
    assert.match(page, /The report is ready in English/);
  });
});
