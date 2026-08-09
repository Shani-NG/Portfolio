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
    const confirmationGuard = page.indexOf("liveSession.pendingReportConfirmation && isReportConfirmationText(submittedText)");
    const guardedRequest = page.indexOf("await requestReport();", confirmationGuard);
    const guardExit = page.indexOf("return;", guardedRequest);

    assert.ok(confirmationGuard >= 0);
    assert.ok(guardedRequest > confirmationGuard);
    assert.ok(guardExit > guardedRequest);
  });
});
