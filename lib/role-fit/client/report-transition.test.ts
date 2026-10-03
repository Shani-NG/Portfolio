import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createRoleDraftFromText } from "../server/role-understanding.ts";
import { decideReportRequest, latestRecoverableRoleInput, requestReportForConfirmedReply } from "./report-transition.ts";
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

  it("never starts generation from a JD paste, an incomplete draft, or missing confirmation", () => {
    const draft = createRoleDraftFromText(completeRoleText);
    const incomplete = createRoleDraftFromText("Senior Service Designer\nYou'll Own\nLead discovery across customer journeys.");

    assert.deepEqual(decideReportRequest(session({ activeRoleDraft: draft })), { kind: "revalidate-role" });
    assert.deepEqual(decideReportRequest(session({ activeRoleDraft: incomplete, pendingReportConfirmation: true })), { kind: "revalidate-role" });
    assert.deepEqual(decideReportRequest(session({ activeRoleDraft: draft, pendingReportConfirmation: true })), { kind: "start-report" });
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
