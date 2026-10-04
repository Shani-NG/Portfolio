import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createRoleDraftFromText, looksLikeRoleInput, validateStructuredRoleDraft } from "../server/role-understanding.ts";
import { decideReportRequest, isNewRoleAfterFailedReport, latestRecoverableRoleInput, recoveredRoleMessage, requestReportForConfirmedReply } from "./report-transition.ts";
import type { RoleFitLiveSession } from "./session.ts";

const completeRoleText = [
  "Senior Service Designer",
  "You'll Own",
  "Lead discovery across complex customer journeys.",
  "Design prototypes with product and engineering teams.",
  "How You'll Succeed Here",
  "Strong experience in service design and research.",
  "Portfolio showing clear design outcomes.",
].join("\n");

function session(update: Partial<RoleFitLiveSession> = {}): RoleFitLiveSession {
  return {
    sessionId: "session_test",
    conversationId: "conversation_test",
    createdAt: 1,
    lastActivityAt: 1,
    expiresAt: 1000,
    state: "general-qa",
    messages: [],
    draftInput: "",
    activeRoleDraft: null,
    pendingRoleField: null,
    clarificationAttempts: 0,
    activeLanguage: "en",
    reportPayload: null,
    reportProvider: "",
    reportModel: "",
    completedReportCount: 0,
    pendingReportId: null,
    pendingReportConfirmation: false,
    expandedEvidenceItemIds: null,
    reportAttemptState: null,
    ...update,
  };
}

describe("Role Fit conversation-to-report transition", () => {
  it("recovers the latest likely JD from user messages without trusting model text", () => {
    const messages: RoleFitLiveSession["messages"] = [
      { id: "1", role: "user", content: completeRoleText },
      { id: "2", role: "agent", content: "Generating the role-fit report now." },
      { id: "3", role: "user", content: "YES" },
      { id: "4", role: "user", content: "Can you explain your portfolio?" },
    ];

    assert.equal(latestRecoverableRoleInput(messages), completeRoleText);
    assert.deepEqual(decideReportRequest(session({ messages })), { kind: "recover-role", roleText: completeRoleText });
    assert.deepEqual(decideReportRequest(session({ messages: messages.slice(1) })), { kind: "request-role" });
  });

  it("revalidates the previous user JD when an uncaptured title or YES follows model chat", () => {
    const messages: RoleFitLiveSession["messages"] = [
      { id: "1", role: "user", content: completeRoleText },
      { id: "2", role: "agent", content: "The report is ready to generate." },
    ];
    const lostDraft = session({ messages });
    assert.equal(recoveredRoleMessage(lostDraft, "SENIOR SERVICE DESIGNER"), `${completeRoleText}\n\nTitle: SENIOR SERVICE DESIGNER`);
    assert.equal(recoveredRoleMessage(lostDraft, "YES"), completeRoleText);
    assert.equal(recoveredRoleMessage(lostDraft, "Tell me about Shani's portfolio"), null);
    assert.equal(recoveredRoleMessage(session({ messages: messages.slice(1) }), "YES"), null);
    assert.equal(recoveredRoleMessage(session({ messages, activeRoleDraft: createRoleDraftFromText(completeRoleText) }), "YES"), null);
  });

  it("can recover an extractable JD that the initial intake gate missed", () => {
    const missedRole = [
      "This opening covers complex customer workflows across several product teams and requires design leadership throughout discovery and delivery.",
      "Lead product discovery with customers and stakeholders across enterprise workflows.",
      "Design prototypes with product and engineering teams to test user needs.",
      "Strong experience with UX research and service design in B2B software.",
      "Portfolio showing recent work with clear product outcomes.",
    ].join("\n");
    assert.equal(looksLikeRoleInput(missedRole), false);
    assert.equal(latestRecoverableRoleInput([{ id: "1", role: "user", content: missedRole }]), missedRole);
    assert.equal(recoveredRoleMessage(session({ messages: [{ id: "1", role: "user", content: missedRole }] }), "YES"), missedRole);
  });

  it("never starts generation from a JD paste, an incomplete draft, or missing confirmation", () => {
    const draft = createRoleDraftFromText(completeRoleText);
    const incomplete = createRoleDraftFromText("Senior Service Designer\nYou'll Own\nLead discovery across customer journeys.");

    assert.deepEqual(decideReportRequest(session({ activeRoleDraft: draft })), { kind: "revalidate-role" });
    assert.deepEqual(decideReportRequest(session({ activeRoleDraft: incomplete, pendingReportConfirmation: true })), { kind: "revalidate-role" });
    assert.deepEqual(decideReportRequest(session({ activeRoleDraft: draft, pendingReportConfirmation: true })), { kind: "start-report" });
  });

  it("routes a new JD after report failure back to intake, including an עכשיו prefix", () => {
    const oldDraft = createRoleDraftFromText(completeRoleText);
    const nextRole = `עכשיו אני רוצה לבדוק משרה אחרת:\n${completeRoleText.replace("Senior Service Designer", "Senior Product Designer")}`;
    const failed = session({ state: "recoverable-error", activeRoleDraft: oldDraft, reportAttemptState: { reportId: "report_1", attempts: 1 }, pendingReportConfirmation: true });
    assert.equal(isNewRoleAfterFailedReport(failed, nextRole), true);
    assert.equal(isNewRoleAfterFailedReport(failed, "עכשיו אפשר לנסות שוב?"), false);
    assert.equal(isNewRoleAfterFailedReport(session({ ...failed, state: "general-qa" }), nextRole), true);
    assert.equal(isNewRoleAfterFailedReport(session({ activeRoleDraft: oldDraft }), nextRole), false);
    const validation = validateStructuredRoleDraft({ conversationId: failed.conversationId, traceId: "new_role", roleDraft: createRoleDraftFromText(nextRole), detectedLanguage: "he" });
    assert.equal(validation.parseStatus, "valid-complete");
    assert.equal(validation.roleDraft.title?.originalValue, "Senior Product Designer");
    assert.deepEqual(decideReportRequest(failed), { kind: "start-report" });
    assert.deepEqual(decideReportRequest(session({ ...failed, pendingReportConfirmation: false })), { kind: "revalidate-role" });
  });

  it("does not allow a third request for the same failed report", () => {
    const failed = session({ state: "recoverable-error", activeRoleDraft: createRoleDraftFromText(completeRoleText), reportAttemptState: { reportId: "report_1", attempts: 2 } });
    assert.deepEqual(decideReportRequest(failed), { kind: "retry-exhausted" });
    assert.deepEqual(decideReportRequest(session({ ...failed, state: "general-qa" })), { kind: "retry-exhausted" });
  });

  it("dispatches one mocked report request for YES only after confirmation", async () => {
    const draft = createRoleDraftFromText(completeRoleText);
    const confirmed = session({ activeRoleDraft: draft, pendingReportConfirmation: true, state: "awaiting-report-confirmation" });
    const requests: string[] = [];
    const requestReport = async (current: RoleFitLiveSession) => {
      requests.push(decideReportRequest(current).kind);
    };

    assert.equal(await requestReportForConfirmedReply(confirmed, "YES", requestReport), true);
    assert.deepEqual(requests, ["start-report"]);
    assert.equal(await requestReportForConfirmedReply(session({ activeRoleDraft: draft }), "YES", requestReport), false);
    assert.equal(await requestReportForConfirmedReply(confirmed, "Not yet", requestReport), false);
    assert.deepEqual(requests, ["start-report"]);
  });
});
