import { isReportConfirmationText } from "../conversation/behavior.ts";
import { looksLikeRoleInput, validateStructuredRoleDraft } from "../server/role-understanding.ts";
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
    if (message?.role === "user" && looksLikeRoleInput(message.content)) return message.content;
  }
  return null;
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
