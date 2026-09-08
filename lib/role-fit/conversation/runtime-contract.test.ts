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
    const guardedRequest = page.indexOf("await requestReport(sessionAfterUser);", confirmationGuard);
    const guardExit = page.indexOf("return;", guardedRequest);

    assert.ok(confirmationGuard >= 0);
    assert.ok(guardedRequest > confirmationGuard);
    assert.ok(guardExit > guardedRequest);
  });

  it("keeps report retries on the saved role without collecting it again", async () => {
    const page = await readFile(join(process.cwd(), "app", "minime", "page.tsx"), "utf8");
    const behavior = await readFile(join(process.cwd(), "lib", "role-fit", "conversation", "behavior.ts"), "utf8");

    assert.match(page, /currentSession\.pendingReportConfirmation && isReportConfirmationText\(submittedText\)/);
    assert.match(page, /await requestReport\(sessionAfterUser\)/);
    assert.match(behavior, /generate\(\?:\\s\+\(\?:the\|this\)\)\?\\s\+report/);
    assert.match(behavior, /try\\s\+again/);
    assert.match(page, /reportAttemptRef/);
    assert.match(page, /pendingReportConfirmation: canOfferRetry/);
    assert.match(page, /reportRetryExhaustedAnswer/);
  });

  it("clears only active-report state when a returned role starts a new analysis", async () => {
    const page = await readFile(join(process.cwd(), "app", "minime", "page.tsx"), "utf8");
    const transition = page.slice(
      page.indexOf("const beginsRoleAnalysis"),
      page.indexOf("if (!response.ok)", page.indexOf("const beginsRoleAnalysis")),
    );

    assert.match(transition, /awaiting-role-completion/);
    assert.match(transition, /awaiting-report-confirmation/);
    assert.match(transition, /reportPayload: null/);
    assert.match(transition, /reportProvider: ""/);
    assert.match(transition, /reportModel: ""/);
    assert.match(transition, /expandedEvidenceItemIds: null/);
    assert.match(transition, /pendingReportId: null/);
    assert.match(transition, /reportAttemptState: null/);
    assert.match(transition, /activeRoleDraft: returnedRoleDraft/);
    assert.doesNotMatch(transition, /resetRoleFitAnalysis/);
    assert.doesNotMatch(transition, /sessionId:|conversationId:|completedReportCount:|messages:/);
  });

  it("allows one direct report retry and disables an immediate third attempt", async () => {
    const page = await readFile(join(process.cwd(), "app", "minime", "page.tsx"), "utf8");

    assert.match(page, /currentSession\.pendingReportConfirmation && isReportConfirmationText\(submittedText\)[\s\S]*await requestReport\(sessionAfterUser\)/);
    assert.match(page, /reportAttemptNumber === 1/);
    assert.match(page, /pendingReportConfirmation: canOfferRetry/);
    assert.match(page, /reportAttemptState: null/);
    assert.doesNotMatch(page, /\/api\/role-fit\/chat[\s\S]{0,500}retry the report/);
  });

  it("blocks explicit report mutation before role correction or model follow-up", async () => {
    const [route, behavior] = await Promise.all([
      readFile(join(process.cwd(), "app", "api", "role-fit", "chat", "route.ts"), "utf8"),
      readFile(join(process.cwd(), "lib", "role-fit", "conversation", "behavior.ts"), "utf8"),
    ]);
    const guard = route.indexOf("looksLikeReportMutationRequest(parsedRequest.data.message)");
    const correction = route.indexOf("detectRoleCorrection(parsedRequest.data.message)");
    const modelCall = route.indexOf("provider.generateChat");

    assert.ok(guard >= 0);
    assert.ok(correction > guard);
    assert.ok(modelCall > guard);
    assert.match(route.slice(guard, correction), /state: "report-ready"/);
    assert.match(route.slice(guard, correction), /safeMessageKey: "report\.immutable"/);
    assert.match(behavior, /looksLikeReportMutationRequest/);
    assert.match(route, /generated report is active and immutable/);
    assert.match(route, /Do not claim to edit, update, change, fix, or correct/);
  });

  it("automatically reveals the newest chat output", async () => {
    const page = await readFile(join(process.cwd(), "app", "minime", "page.tsx"), "utf8");

    assert.match(page, /chatHistory\.scrollTo\(\{ top: chatHistory\.scrollHeight/);
    assert.match(page, /if \(activePane === "chat"\) scrollChatToEnd\(\)/);
    assert.match(page, /if \(nextPane === "chat"\) scrollChatToEnd\(\)/);
    assert.match(page, /prefers-reduced-motion: reduce/);
  });

  it("keeps narrow Chat bounded while leaving Report scrolling outside that state", async () => {
    const css = await readFile(join(process.cwd(), "app", "minime", "page.module.css"), "utf8");
    const narrowChat = css.slice(css.indexOf(".liveSplitWorkspace.narrowChatWorkspace"), css.indexOf(".narrowPaneInactive"));

    assert.match(narrowChat, /height: calc\(100dvh - var\(--site-header-height\)\)/);
    assert.match(narrowChat, /overflow: hidden/);
    assert.match(narrowChat, /\.narrowChatWorkspace \.chatHistory[\s\S]*flex: 1[\s\S]*min-height: 0[\s\S]*overflow-y: auto/);
    assert.match(narrowChat, /\.narrowChatWorkspace \.chatBoxContainer[\s\S]*flex: 0 0 auto/);
    assert.doesNotMatch(narrowChat, /\.canvasPane[\s\S]*position: fixed/);
    assert.match(css, /\.roleFitPage\.narrowChatPage[\s\S]*padding: 0/);
  });

  it("reveals report animation frames only after iframe load", async () => {
    const [progress, css] = await Promise.all([
      readFile(join(process.cwd(), "components", "role-fit", "role-fit-report-progress.tsx"), "utf8"),
      readFile(join(process.cwd(), "components", "role-fit", "role-fit-report-progress.module.css"), "utf8"),
    ]);

    assert.match(progress, /loadedFrames\[index\]/);
    assert.match(progress, /onLoad=\{\(\) => setLoadedFrames/);
    assert.match(css, /\.backgroundCircle[\s\S]*background: #000000/);
    assert.match(css, /\.visualFrame[\s\S]*opacity: 0/);
    assert.match(css, /\.activeFrame[\s\S]*opacity: 1/);
    assert.doesNotMatch(css, /margin-block-start: calc\(4\.5rem \+ 5\.462rem\)/);
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

  it("stores a first-message standalone title before collecting the remaining role details", async () => {
    const route = await readFile(join(process.cwd(), "app", "api", "role-fit", "chat", "route.ts"), "utf8");
    const recognition = route.indexOf("extractStandaloneRoleTitle(parsedRequest.data.message)");
    const structuredTitle = route.indexOf('mergeRoleDraftClarification(createEmptyRoleDraft(), "title", standaloneRoleTitle)');
    const validation = route.indexOf("validateStructuredRoleDraft({", structuredTitle);

    assert.ok(recognition >= 0);
    assert.ok(structuredTitle > recognition);
    assert.ok(validation > structuredTitle);
    assert.match(route, /state: "awaiting-role-completion"/);
    assert.match(route, /roleDraft: validation\.roleDraft/);
  });

  it("keeps title clarification grounded in the existing role draft when the previous title was not captured", async () => {
    const route = await readFile(join(process.cwd(), "app", "api", "role-fit", "chat", "route.ts"), "utf8");
    const branch = route.slice(
      route.indexOf('pendingRoleField === "title" && referencesPreviouslyProvidedTitle'),
      route.indexOf('pendingRoleField === "title" && isNoRoleTitleAnswer'),
    );

    assert.match(route, /referencesPreviouslyProvidedTitle\(parsedRequest\.data\.message\)/);
    assert.match(branch, /previouslyProvidedTitleAnswer\(parsedRequest\.data\.language\)/);
    assert.match(branch, /roleDraft: roleContext\.roleDraft/);
    assert.match(branch, /pendingField: "title"/);
    assert.doesNotMatch(branch, /createRoleDraftFromText|conversationContext/);
  });

  it("keeps a rejected title in role collection until the corrected title reaches report confirmation", async () => {
    const route = await readFile(join(process.cwd(), "app", "api", "role-fit", "chat", "route.ts"), "utf8");
    const rejectionBranch = route.slice(
      route.indexOf("if (roleContext && isTitleRejection)"),
      route.indexOf("if (roleContext && pendingRoleField && isFieldClarification"),
    );
    const clarificationFlow = route.slice(
      route.indexOf("currentRoleDraft && pendingRoleField && isFieldClarification"),
      route.indexOf("const boundedRoleText"),
    );

    assert.match(route, /isRoleTitleRejection\(parsedRequest\.data\.message\)/);
    assert.match(rejectionBranch, /clearRoleDraftField\(roleContext\.roleDraft, "title"\)/);
    assert.match(rejectionBranch, /state: "awaiting-role-completion"/);
    assert.match(rejectionBranch, /answer:[\s\S]*"What is the exact role title\?"/);
    assert.match(rejectionBranch, /pendingField: "title"/);
    assert.match(rejectionBranch, /safeMessageKey: "role\.title_rejected"/);
    assert.doesNotMatch(rejectionBranch, /readyForReportAnswer|generateReport|requestReport|createRoleDraftFromText/);
    assert.match(clarificationFlow, /mergeRoleDraftClarification\(currentRoleDraft, pendingRoleField, parsedRequest\.data\.message\)/);
    assert.match(route, /state: "awaiting-report-confirmation"/);
  });

  it("opens a real file input instead of sending an upload chat message", async () => {
    const page = await readFile(join(process.cwd(), "app", "minime", "page.tsx"), "utf8");

    assert.match(page, /type="file"/);
    assert.match(page, /roleFileInputRef\.current\?\.click\(\)/);
    assert.doesNotMatch(page, /submitLiveMessage\("I want to upload a job description/);
  });

  it("validates upload type and size before reading file contents", async () => {
    const page = await readFile(join(process.cwd(), "app", "minime", "page.tsx"), "utf8");
    const extensionCheck = page.indexOf("approvedRoleFileExtensions.has(extension)");
    const sizeCheck = page.indexOf("file.size > maxRoleFileBytes");
    const read = page.indexOf("void file.text()");

    assert.ok(extensionCheck >= 0);
    assert.ok(sizeCheck > extensionCheck);
    assert.ok(read > sizeCheck);
  });

  it("bounds conversation and report context before model execution", async () => {
    const [page, route] = await Promise.all([
      readFile(join(process.cwd(), "app", "minime", "page.tsx"), "utf8"),
      readFile(join(process.cwd(), "app", "api", "role-fit", "chat", "route.ts"), "utf8"),
    ]);

    assert.match(page, /conversationContext:[^\n]+\.slice\(-12000\)/);
    assert.match(route, /conversationContext: z\.string\(\)\.max\(12_000\)/);
    assert.match(route, /reportContext: z\.string\(\)\.max\(18_000\)/);
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

  it("renders the narrow report switch for every split workspace state, including report recovery", async () => {
    const page = await readFile(join(process.cwd(), "app", "minime", "page.tsx"), "utf8");

    assert.match(page, /isNarrowLayout && splitCanvas/);
    assert.match(page, /activePane === "report" \? "Switch to chat" : "Switch to report"/);
    assert.match(page, /switchPane\(activePane === "report" \? "chat" : "report"\)/);
  });

  it("distinguishes a report service failure from missing role details", async () => {
    const [page, reportRoute] = await Promise.all([
      readFile(join(process.cwd(), "app", "minime", "page.tsx"), "utf8"),
      readFile(join(process.cwd(), "app", "api", "role-fit", "report", "route.ts"), "utf8"),
    ]);

    assert.match(page, /Fit review not created/);
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
    const [page, behavior] = await Promise.all([
      readFile(join(process.cwd(), "app", "minime", "page.tsx"), "utf8"),
      readFile(join(process.cwd(), "lib", "role-fit", "conversation", "behavior.ts"), "utf8"),
    ]);

    assert.match(page, /language: "en"/);
    assert.match(page, /reportReadyAnswer\(language\)/);
    assert.match(behavior, /בדיקת ההתאמה מוכנה באנגלית/);
  });
});
