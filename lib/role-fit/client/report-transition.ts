import { isReportConfirmationText } from "../conversation/behavior.ts";
import { createRoleDraftFromText, extractStandaloneRoleTitle, looksLikeRoleInput, validateStructuredRoleDraft } from "../server/role-understanding.ts";
import type { RoleFitLiveSession } from "./session.ts";

export type ReportRequestDecision =
  | { kind: "show-existing" }
  | { kind: "recover-role"; roleText: string }
  | { kind: "request-role" }
  | { kind: "revalidate-role" }
  | { kind: "start-report" };

export function latestRecoverableRoleInput(messages: RoleFitLiveSession["messages"]): string | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== "user") continue;
    if (looksLikeRoleInput(message.content)) return message.content;
    if (message.content.length < 240) continue;
    const draft = createRoleDraftFromText(message.content);
    if (draft.responsibilities.length > 0 && draft.requirements.length > 0) return message.content;
  }
  return null;
}

export function recoveredRoleMessage(session: RoleFitLiveSession, submittedText: string): string | null {
  if (session.activeRoleDraft || session.reportPayload) return null;
  const previousRoleText = latestRecoverableRoleInput(session.messages);
  if (!previousRoleText) return null;
  const title = extractStandaloneRoleTitle(submittedText);
  if (title) return `${previousRoleText}\n\nTitle: ${title}`;
  return isReportConfirmationText(submittedText) ? previousRoleText : null;
}

export function decideReportRequest(session: RoleFitLiveSession): ReportRequestDecision {
  if (session.reportPayload) return { kind: "show-existing" };
  if (!session.activeRoleDraft) {
    const roleText = latestRecoverableRoleInput(session.messages);
    return roleText ? { kind: "recover-role", roleText } : { kind: "request-role" };
  }

  const validation = validateStructuredRoleDraft({
    conversationId: session.conversationId,
    traceId: "client_report_preflight",
    roleDraft: session.activeRoleDraft,
    detectedLanguage: session.activeLanguage,
  });
  return session.pendingReportConfirmation && validation.parseStatus === "valid-complete" && validation.missingFields.length === 0
    ? { kind: "start-report" }
    : { kind: "revalidate-role" };
}

export async function requestReportForConfirmedReply(
  session: RoleFitLiveSession,
  reply: string,
  requestReport: (session: RoleFitLiveSession) => Promise<void>,
): Promise<boolean> {
  if (!session.pendingReportConfirmation || !isReportConfirmationText(reply)) return false;
  await requestReport(session);
  return true;
}
