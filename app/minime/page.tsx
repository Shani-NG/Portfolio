"use client";

import { Chip } from "@/components/ui/chip";
import { RoleFitLiveReport } from "@/components/role-fit/role-fit-live-report";
import { appendRoleFitMessage, consumePendingHomeRoleFitInput, resetRoleFitAnalysis, restoreRoleFitLiveSession, updateRoleFitLiveSession } from "@/lib/role-fit/client/session";
import { createPublicReportContext } from "@/lib/role-fit/conversation/active-report";
import {
  genericRecoverableErrorAnswer,
  isHebrewLanguage,
  isReportConfirmationText,
  missingDetailsAnswer,
  reportLimitAnswer,
  reportLoadingAnswer,
  reportReadyAnswer,
  reportRetryableFailureAnswer,
  resolveConversationLanguage,
  roleFileErrorAnswer,
  roleSubmissionSetupAnswer,
} from "@/lib/role-fit/conversation/behavior";
import { reportUIPayloadSchema, type ReportUIPayload } from "@/lib/role-fit/contracts";
import { createReportId } from "@/lib/role-fit/identifiers";
import type { RoleFitLiveSession, RoleFitLiveState } from "@/lib/role-fit/client/session";
import { hasRoleDraftContent } from "@/lib/role-fit/server/role-understanding";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import styles from "./page.module.css";

type LiveReportState = {
  provider?: string;
  model?: string;
  report?: ReportUIPayload;
};

type ErrorContext = "conversation" | "report" | "validation" | null;

const reportRequestTimeoutMs = 150_000;
const maxRoleFileBytes = 64 * 1024;
const approvedRoleFileExtensions = new Set(["txt", "md", "csv"]);

type ReportFailureResult = {
  state?: string;
  safeMessage?: string;
  retryable?: boolean;
  eligibility?: { reason?: string };
  validation?: { missingFields?: string[] };
};

function reportFailureMessage(result: ReportFailureResult, language: RoleFitLiveSession["activeLanguage"]): string {
  const useHebrew = isHebrewLanguage(language);

  if (result.retryable) {
    return reportRetryableFailureAnswer(language);
  }

  if (result.state === "validation-failed") {
    const missingField = result.validation?.missingFields?.[0];
    return missingField
      ? missingDetailsAnswer({ missingField: missingField as "company" | "title" | "responsibilities" | "requirements", language, repeatedInput: true })
      : useHebrew
        ? "פרטי המשרה עדיין אינם שלמים. אפשר להוסיף בשיחה את הפרט שביקשתי ואז לנסות שוב."
        : "The role details are still incomplete. You can add the requested detail in the chat and then try again.";
  }

  if (result.state === "blocked") {
    return result.eligibility?.reason === "report-limit-reached"
      ? reportLimitAnswer(language)
      : useHebrew
        ? "אפשר להכין את בדיקת ההתאמה רק לאחר שפרטי המשרה שלמים ומאושרים. אפשר לחזור לשיחה ולהשלים את הפרט החסר."
        : "I can prepare the fit review only after the role details are complete and confirmed. You can return to the chat and add the missing detail.";
  }

  if (result.state === "no-report") {
    return result.eligibility?.reason === "insufficient-evidence"
      ? useHebrew
        ? "לא נוצר דוח מלא משום שאין כרגע מספיק מידע מאושר כדי לקבוע את ההתאמה בצורה אחראית."
        : "A completed fit review was not created because there is not enough approved information to assess the role responsibly."
      : useHebrew
        ? "לא נוצר דוח משום שהתפקיד נמצא מחוץ לטווח שאפשר לבדוק באמצעות המידע המאושר בפורטפוליו."
        : "A fit review was not created because this role is outside what the approved portfolio information can assess.";
  }

  return result.safeMessage ?? genericRecoverableErrorAnswer(language);
}

function reportSuccessMessage(language: RoleFitLiveSession["activeLanguage"]) {
  return reportReadyAnswer(language);
}

function normalizeRepeatedInput(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

export default function RoleFitPage() {
  const [liveSession, setLiveSession] = useState<RoleFitLiveSession>(() => restoreRoleFitLiveSession());
  const [roleInput, setRoleInput] = useState("");
  const [apiStatusMessage, setApiStatusMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isReportRequestInFlight, setIsReportRequestInFlight] = useState(false);
  const [liveReportState, setLiveReportState] = useState<LiveReportState | null>(null);
  const [activePane, setActivePane] = useState<"chat" | "report">("chat");
  const [isNarrowLayout, setIsNarrowLayout] = useState(false);
  const [isAgentUnavailable, setIsAgentUnavailable] = useState(false);
  const [errorContext, setErrorContext] = useState<ErrorContext>(null);
  const reportRequestInFlightRef = useRef(false);
  const chatPaneRef = useRef<HTMLDivElement>(null);
  const chatHistoryRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLElement>(null);
  const reportPaneRef = useRef<HTMLElement>(null);
  const roleFileInputRef = useRef<HTMLInputElement>(null);
  const activeReport = liveReportState?.report ?? (liveSession.reportPayload as ReportUIPayload | null) ?? undefined;
  const hasLiveReport = Boolean(activeReport);
  const liveSplitCanvas = liveSession.state === "generating-report"
    || liveSession.state === "report-ready"
    || (liveSession.state === "recoverable-error" && (Boolean(activeReport) || errorContext === "report" || errorContext === "validation"));
  const splitCanvas = liveSplitCanvas;
  const hasConversation = liveSession.messages.length > 0 || liveSession.state !== "initial";
  const reportActionLabel = hasLiveReport
    ? "Show report"
    : liveSession.pendingReportConfirmation
      ? "Generate confirmed report"
      : "Generate report";
  const errorHeading = isHebrewLanguage(liveSession.activeLanguage)
    ? errorContext === "conversation"
      ? "סוכנת RoleFit אינה זמינה כרגע"
      : errorContext === "validation"
        ? "עדיין חסרים כמה פרטים על המשרה"
        : "בדיקת ההתאמה לא נוצרה"
    : errorContext === "conversation"
      ? "Role Fit Agent is unavailable"
      : errorContext === "validation"
        ? "A few role details are still missing"
        : "Fit review not created";
  const pageClassName = liveSplitCanvas
    ? `${styles.roleFitPage} ${styles.liveSplitPage}`
    : hasConversation
      ? `${styles.roleFitPage} ${styles.conversationPage}`
      : styles.roleFitPage;

  function syncLiveSession(update: Partial<RoleFitLiveSession>) {
    const nextSession = updateRoleFitLiveSession(update);
    setLiveSession(nextSession);
    return nextSession;
  }

  function appendLiveMessage(message: { role: "user" | "agent"; content: string }) {
    const nextSession = appendRoleFitMessage(message);
    setLiveSession(nextSession);
    return nextSession;
  }

  async function submitLiveMessage(textOverride?: string, sessionOverride?: RoleFitLiveSession) {
    const currentSession = sessionOverride ?? liveSession;
    const submittedText = (textOverride ?? roleInput).trim();
    if (!submittedText || isSending || isAgentUnavailable) return;
    if (currentSession.pendingReportConfirmation && isReportConfirmationText(submittedText)) {
      appendLiveMessage({ role: "user", content: submittedText });
      setRoleInput("");
      await requestReport(currentSession);
      return;
    }
    const normalizedSubmittedText = normalizeRepeatedInput(submittedText);
    const previousUserMessage = [...currentSession.messages].reverse().find((message) => message.role === "user")?.content ?? "";
    const normalizedPreviousInput = normalizeRepeatedInput(previousUserMessage);
    const repeatedInput = Boolean(
      normalizedPreviousInput &&
      (
        normalizedSubmittedText === normalizedPreviousInput ||
        (normalizedSubmittedText.length > 80 && normalizedPreviousInput.includes(normalizedSubmittedText))
      ),
    );
    const messageForAgent = submittedText;
    const activeLanguage = resolveConversationLanguage(submittedText, currentSession.activeLanguage);
    const parsedActiveReport = currentSession.reportPayload
      ? reportUIPayloadSchema.safeParse(currentSession.reportPayload)
      : null;
    const authoritativeReport = parsedActiveReport?.success ? parsedActiveReport.data : undefined;

    const sessionAfterUser = appendLiveMessage({ role: "user", content: submittedText });
    setRoleInput("");
    setIsSending(true);
    setApiStatusMessage("");
    setLiveReportState(null);
    syncLiveSession({
      state: currentSession.reportPayload ? "report-ready" : "general-qa",
      draftInput: "",
      activeLanguage,
    });

    try {
      const response = await fetch("/api/role-fit/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: sessionAfterUser.conversationId,
          sessionId: sessionAfterUser.sessionId,
          message: messageForAgent,
          language: activeLanguage,
          repeatedInput,
          roleCollectionActive: currentSession.state === "awaiting-role-completion" && !currentSession.reportPayload,
          clarificationAttempts: currentSession.clarificationAttempts,
          completedReportCount: currentSession.completedReportCount,
          conversationContext: JSON.stringify(sessionAfterUser.messages.slice(-8)).slice(-12000),
          reportContext: authoritativeReport ? JSON.stringify(createPublicReportContext(authoritativeReport)).slice(0, 18000) : undefined,
          activeReportRole: authoritativeReport
            ? {
                company: authoritativeReport.roleSnapshot.company,
                title: authoritativeReport.roleSnapshot.title,
              }
            : undefined,
          roleContext: currentSession.activeRoleDraft
            ? {
                roleDraft: currentSession.activeRoleDraft,
                ...(currentSession.pendingRoleField ? { pendingField: currentSession.pendingRoleField } : {}),
              }
            : undefined,
        }),
      });

      const result = await response.json();
      const responseState = (result.state ?? "general-qa") as RoleFitLiveState;
      const startsDifferentRole = result.activeReportDisposition === "different-role";
      const recognizesActiveReport = result.activeReportDisposition === "same-role";
      const retainedReportPayload = startsDifferentRole ? null : currentSession.reportPayload;
      const nextState = retainedReportPayload && responseState === "general-qa" ? "report-ready" : responseState;
      appendLiveMessage({ role: "agent", content: result.answer ?? "I need a little more context before I can answer safely." });
      syncLiveSession({
        state: nextState,
        activeRoleDraft: result.roleDraft ?? result.validation?.roleDraft ?? currentSession.activeRoleDraft,
        pendingRoleField: result.pendingField !== undefined ? result.pendingField : currentSession.pendingRoleField,
        pendingReportConfirmation: nextState === "awaiting-report-confirmation",
        clarificationAttempts: nextState === "awaiting-role-completion" && !result.clarificationExhausted
          ? currentSession.clarificationAttempts + 1
          : 0,
        activeLanguage,
        ...(startsDifferentRole
          ? {
              reportPayload: null,
              reportProvider: "",
              reportModel: "",
              pendingReportId: null,
              expandedEvidenceItemIds: null,
            }
          : {}),
      });
      if (startsDifferentRole) setActivePane("chat");
      if (recognizesActiveReport) setActivePane("report");

      if (!response.ok) {
        setApiStatusMessage(result.answer ?? "The Role Fit Agent is not available right now. Please try again later.");
        setErrorContext("conversation");
        setIsAgentUnavailable(false);
      }
    } catch {
      const message = "The Role Fit Agent is not available right now. Please try again later.";
      appendLiveMessage({ role: "agent", content: message });
      setApiStatusMessage(message);
      setErrorContext("conversation");
      setIsAgentUnavailable(false);
      syncLiveSession({
        state: currentSession.reportPayload ? "report-ready" : "recoverable-error",
        pendingReportConfirmation: false,
      });
    } finally {
      setIsSending(false);
    }
  }

  async function requestReport(sessionOverride?: RoleFitLiveSession) {
    const reportSession = sessionOverride ?? liveSession;

    if (reportRequestInFlightRef.current || isAgentUnavailable) return;
    if (reportSession.reportPayload) {
      syncLiveSession({ state: "report-ready" });
      return;
    }
    if (!reportSession.pendingReportConfirmation || !hasRoleDraftContent(reportSession.activeRoleDraft)) {
      const guidance = reportSession.pendingRoleField
        ? missingDetailsAnswer({
            missingField: reportSession.pendingRoleField,
            language: reportSession.activeLanguage,
            repeatedInput: true,
          })
        : hasRoleDraftContent(reportSession.activeRoleDraft)
          ? missingDetailsAnswer({
              missingField: "title",
              missingFields: ["title", "responsibilities", "requirements"],
              language: reportSession.activeLanguage,
              repeatedInput: true,
            })
          : roleSubmissionSetupAnswer(reportSession.activeLanguage);
      appendLiveMessage({
        role: "agent",
        content: guidance,
      });
      syncLiveSession({ state: "awaiting-role-completion", pendingReportConfirmation: false });
      return;
    }

    setApiStatusMessage("");
    setErrorContext(null);
    setLiveReportState(null);
    const reportId = reportSession.pendingReportId ?? createReportId();
    reportRequestInFlightRef.current = true;
    setIsReportRequestInFlight(true);
    setActivePane("report");
    syncLiveSession({ state: "generating-report", pendingReportId: reportId });
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), reportRequestTimeoutMs);

    try {
      const response = await fetch("/api/role-fit/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roleDraft: reportSession.activeRoleDraft,
          approved: true,
          completedReportCount: reportSession.completedReportCount,
          conversationId: reportSession.conversationId,
          sessionId: reportSession.sessionId,
          reportId,
          language: "en",
        }),
        signal: controller.signal,
      });

      const result = await response.json().catch(() => ({
        state: "malformed-output",
        safeMessage: genericRecoverableErrorAnswer(reportSession.activeLanguage),
      }));

      if (!response.ok || result.state !== "ready") {
        const message = reportFailureMessage(result, reportSession.activeLanguage);
        const missingField = result.validation?.missingFields?.[0] ?? null;
        const isNoReport = result.state === "no-report";
        setApiStatusMessage(message);
        setErrorContext(isNoReport ? null : missingField ? "validation" : "report");
        setIsAgentUnavailable(false);
        appendLiveMessage({ role: "agent", content: message });
        syncLiveSession({
          state: isNoReport ? "general-qa" : "recoverable-error",
          pendingRoleField: isNoReport ? null : missingField ?? reportSession.pendingRoleField,
          pendingReportId: isNoReport ? null : reportId,
          pendingReportConfirmation: isNoReport ? false : !missingField,
        });
        if (isNoReport) setActivePane("chat");
        return;
      }

      const parsedReport = reportUIPayloadSchema.safeParse(result.report ?? result.eligibility?.report);
      if (!parsedReport.success) {
        const message = genericRecoverableErrorAnswer(reportSession.activeLanguage);
        setApiStatusMessage(message);
        setErrorContext("report");
        setIsAgentUnavailable(false);
        appendLiveMessage({ role: "agent", content: message });
        syncLiveSession({ state: "recoverable-error", pendingReportConfirmation: true });
        return;
      }

      const report = parsedReport.data;
      const persisted = result.persistence === "persisted";
      const lifecycleMessage = persisted
        ? reportSuccessMessage(reportSession.activeLanguage)
        : isHebrewLanguage(reportSession.activeLanguage)
          ? "בדיקת ההתאמה זמינה לעיון, אבל לא נשמרה בסשן ולכן לא נספרה כאחד משני הדוחות."
          : "The fit review is available now, but it was not saved in the session and did not count toward the two-report limit.";
      setErrorContext(null);
      setIsAgentUnavailable(false);
      setLiveReportState({
        provider: result.provider,
        model: result.model,
        report,
      });
      if (!persisted) setApiStatusMessage(lifecycleMessage);
      appendLiveMessage({ role: "agent", content: lifecycleMessage });
      syncLiveSession({
        state: "report-ready",
        reportPayload: report,
        reportProvider: result.provider,
        reportModel: result.model,
        completedReportCount: typeof result.completedReportCount === "number"
          ? result.completedReportCount as 0 | 1 | 2
          : persisted
            ? (reportSession.completedReportCount + 1) as 1 | 2
            : reportSession.completedReportCount,
        pendingReportId: persisted ? null : reportId,
        pendingRoleField: null,
        pendingReportConfirmation: false,
        expandedEvidenceItemIds: report.requirementMapping.defaultSelectedItemId
          ? [report.requirementMapping.defaultSelectedItemId]
          : report.requirementMapping.items[0]?.itemId ? [report.requirementMapping.items[0].itemId] : [],
      });
      setActivePane("report");
    } catch (error) {
      const timedOut = error instanceof Error && error.name === "AbortError";
      const message = isHebrewLanguage(reportSession.activeLanguage)
        ? timedOut
          ? "העיבוד נמשך זמן רב מדי ולכן בדיקת ההתאמה לא הושלמה. פרטי המשרה עדיין כאן, ואפשר לנסות שוב."
          : "השירות אינו זמין כרגע ולכן בדיקת ההתאמה לא הושלמה. פרטי המשרה עדיין כאן, ואפשר לנסות שוב מאוחר יותר."
        : timedOut
          ? "The fit review took too long to complete. Your role details are still here, and you can try again."
          : "The service is unavailable, so the fit review was not completed. Your role details are still here, and you can try again later.";
      setApiStatusMessage(message);
      setErrorContext("report");
      setIsAgentUnavailable(false);
      appendLiveMessage({ role: "agent", content: message });
      syncLiveSession({ state: "recoverable-error", pendingReportConfirmation: true });
    } finally {
      window.clearTimeout(timeoutId);
      reportRequestInFlightRef.current = false;
      setIsReportRequestInFlight(false);
    }
  }

  useEffect(() => {
    const restoredSession = restoreRoleFitLiveSession();
    setLiveSession(restoredSession);
    if (restoredSession.reportPayload) setActivePane("report");

    const pendingInput = consumePendingHomeRoleFitInput();
    if (!pendingInput) return;

    const submittedText = [pendingInput.text, pendingInput.fileText].filter(Boolean).join("\n\n").trim();
    const uploadPrefix = pendingInput.fileName ? `Uploaded file: ${pendingInput.fileName}` : "";
    void submitLiveMessage([uploadPrefix, submittedText].filter(Boolean).join("\n\n"), restoredSession);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 70rem)");
    const syncLayout = () => setIsNarrowLayout(media.matches);
    syncLayout();
    media.addEventListener("change", syncLayout);
    return () => media.removeEventListener("change", syncLayout);
  }, []);

  useEffect(() => {
    if (isNarrowLayout && hasLiveReport) setActivePane("report");
  }, [activeReport?.reportId, hasLiveReport, isNarrowLayout]);

  useEffect(() => {
    const scrollBehavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

    window.requestAnimationFrame(() => {
      const chatHistory = chatHistoryRef.current;
      if (chatHistory && chatHistory.scrollHeight > chatHistory.clientHeight) {
        chatHistory.scrollTo({ top: chatHistory.scrollHeight, behavior: scrollBehavior });
        return;
      }

      const page = pageRef.current;
      if (page && page.scrollHeight > page.clientHeight) {
        page.scrollTo({ top: page.scrollHeight, behavior: scrollBehavior });
        return;
      }

      chatEndRef.current?.scrollIntoView({ block: "end", behavior: scrollBehavior });
    });
  }, [liveSession.messages.length, isSending]);

  useEffect(() => {
    if (!liveSplitCanvas || isNarrowLayout) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isNarrowLayout, liveSplitCanvas]);

  function switchPane(nextPane: "chat" | "report") {
    setActivePane(nextPane);
    window.requestAnimationFrame(() => {
      (nextPane === "chat" ? chatPaneRef.current : reportPaneRef.current)?.focus();
    });
  }

  function handleRoleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!approvedRoleFileExtensions.has(extension)) {
      appendLiveMessage({ role: "agent", content: roleFileErrorAnswer("unsupported", liveSession.activeLanguage) });
      return;
    }
    if (file.size > maxRoleFileBytes) {
      appendLiveMessage({ role: "agent", content: roleFileErrorAnswer("too-large", liveSession.activeLanguage) });
      return;
    }

    void file.text()
      .then((fileText) => {
        const roleText = fileText.trim();
        if (!roleText) {
          appendLiveMessage({ role: "agent", content: roleFileErrorAnswer("empty", liveSession.activeLanguage) });
          return;
        }
        return submitLiveMessage(`Uploaded file: ${file.name}\n\n${roleText}`);
      })
      .catch(() => {
        appendLiveMessage({ role: "agent", content: roleFileErrorAnswer("unreadable", liveSession.activeLanguage) });
      });
  }

  function startNewAnalysis() {
    const nextSession = resetRoleFitAnalysis();
    setLiveSession(nextSession);
    setLiveReportState(null);
    setApiStatusMessage("");
    setErrorContext(null);
    setIsAgentUnavailable(false);
    setIsReportRequestInFlight(false);
    reportRequestInFlightRef.current = false;
    setRoleInput("");
    setActivePane("chat");
  }

  const chatMessages = liveSession.messages;

  return (
    <main className={pageClassName} ref={pageRef}>
      <input
        accept=".txt,.md,.csv,text/plain,text/markdown,text/csv"
        aria-label="Upload job description"
        disabled={isAgentUnavailable}
        hidden
        onChange={handleRoleFileUpload}
        ref={roleFileInputRef}
        type="file"
      />
      {!hasLiveReport ? <button
        className={[styles.stickyReportChip, splitCanvas && styles.canvasActiveAction, styles.liveReportAction].filter(Boolean).join(" ")}
        aria-label={reportActionLabel}
        type="button"
        disabled={isReportRequestInFlight || isAgentUnavailable}
        title={reportActionLabel}
        onClick={() => void requestReport()}
      >
        Generate Report
      </button> : null}
      {isNarrowLayout && splitCanvas ? (
        <button
          aria-label={activePane === "report" ? "Switch to chat" : "Switch to report"}
          className={styles.paneToggleFab}
          onClick={() => switchPane(activePane === "report" ? "chat" : "report")}
          type="button"
        >
          <span className={styles.msi} aria-hidden="true">{activePane === "report" ? "arrow_back" : "arrow_forward"}</span>
          <span>{activePane === "report" ? "Chat" : "Report"}</span>
        </button>
      ) : null}

      {!hasConversation ? (
        <section className={styles.heroSection} id="role-fit-agent" aria-labelledby="role-fit-title">
          <h1 id="role-fit-title">Ask My Agent</h1>
          <p>Hi! Ask about my work or check a role.</p>

          <div className={styles.chatBoxContainer}>
            <textarea
              placeholder="Paste role details using labels: Company:, Title:, Description:, Responsibilities:, Requirements:"
              aria-label="Role Fit message"
              disabled={isAgentUnavailable}
              value={roleInput}
              onChange={(event) => setRoleInput(event.target.value)}
            />
            <div className={styles.chatBoxToolbar}>
              <button className={styles.iconToolBtn} disabled={isAgentUnavailable} type="button" title="Upload Job Description" aria-label="Upload Job Description" onClick={() => roleFileInputRef.current?.click()}>
                <span className={styles.msi} aria-hidden="true">add</span>
              </button>
              <button className={styles.submitBtn} type="button" aria-label="Send message" title="Send message" disabled={isSending || isAgentUnavailable || !roleInput.trim()} onClick={() => void submitLiveMessage()}>
                <span className={styles.msi} aria-hidden="true">arrow_forward</span>
              </button>
            </div>
          </div>

          <div className={styles.chipsRow}>
            <Chip className={styles.chipItem} disabled={isSending || isAgentUnavailable} icon="upload_file" kind="action" onClick={() => roleFileInputRef.current?.click()} title="Upload a job description" tone="primary">
              <span className={styles.fullChipLabel}>Upload a job description</span><span className={styles.shortChipLabel} aria-hidden="true">Upload</span>
            </Chip>
            <Chip className={styles.chipItem} disabled={isSending || isAgentUnavailable} icon="content_paste" kind="action" onClick={() => void submitLiveMessage("I want to paste job details for validation.")} title="Paste job details" tone="primary">
              <span className={styles.fullChipLabel}>Paste job details</span><span className={styles.shortChipLabel} aria-hidden="true">Paste</span>
            </Chip>
            <Chip className={styles.chipItem} disabled={isSending || isAgentUnavailable} icon="travel_explore" kind="action" onClick={() => void submitLiveMessage("Explore my experience")} title="Explore my experience" tone="primary">
              <span className={styles.fullChipLabel}>Explore my experience</span><span className={styles.shortChipLabel} aria-hidden="true">Explore</span>
            </Chip>
          </div>
        </section>
      ) : (
        <section className={liveSplitCanvas ? `${styles.agentViewContainer} ${styles.liveSplitWorkspace}` : styles.agentViewContainer} id="role-fit-workspace" aria-label="Role Fit workspace">
          <div
            aria-hidden={isNarrowLayout && splitCanvas && activePane !== "chat"}
            className={`${styles.chatPane} ${splitCanvas ? styles.splitChatPane : styles.fullWidth} ${activePane === "chat" ? styles.narrowPaneActive : styles.narrowPaneInactive}`}
            ref={chatPaneRef}
            tabIndex={-1}
          >
            <div className={styles.chatHistory} ref={chatHistoryRef}>
              {chatMessages.map((message, index) => (
                <div className={`${styles.chatBubble} ${message.role === "user" ? styles.userBubble : styles.agentBubble}`} key={`${message.role}-${index}`}>
                  {message.content}
                </div>
              ))}
              {isSending ? (
                <div className={styles.thinkingIndicator} role="status" aria-label="Agent is thinking">
                  <span aria-hidden="true" />
                </div>
              ) : null}
              <div aria-hidden="true" className={styles.chatEndAnchor} ref={chatEndRef} />
            </div>

            <div className={styles.chatBoxContainer}>
              <textarea
                placeholder="Paste or refine role details using labels: Company:, Title:, Description:, Responsibilities:, Requirements:"
                aria-label="Role Fit follow-up"
                disabled={isAgentUnavailable}
                value={roleInput}
                onChange={(event) => setRoleInput(event.target.value)}
              />
              <div className={styles.chatBoxToolbar}>
                <button className={styles.iconToolBtn} disabled={isAgentUnavailable} type="button" title="Upload Job Description" aria-label="Upload Job Description" onClick={() => roleFileInputRef.current?.click()}>
                  <span className={styles.msi} aria-hidden="true">add</span>
                </button>
                <button className={styles.submitBtn} type="button" aria-label="Send message" title="Send message" disabled={isSending || isAgentUnavailable || !roleInput.trim()} onClick={() => void submitLiveMessage()}>
                  <span className={styles.msi} aria-hidden="true">arrow_forward</span>
                </button>
              </div>
            </div>
            {isAgentUnavailable ? (
              <p className={styles.availabilityNotice} role="status">Role Fit Agent is not available right now. Please try again later.</p>
            ) : null}
          </div>

          {splitCanvas ? (
            <aside
              aria-hidden={isNarrowLayout && activePane !== "report"}
              className={`${styles.canvasPane} ${activePane === "report" ? styles.narrowPaneActive : styles.narrowPaneInactive}`}
              aria-label="Role Fit report canvas"
              ref={reportPaneRef}
              tabIndex={-1}
            >
              {liveSession.state === "generating-report" ? (
                <div className={styles.generatingState} id="role-fit-generating" role="status" aria-live="polite">
                  <div className={styles.generatingBars} aria-hidden="true">
                    <div className={styles.genBar} />
                    <div className={styles.genBar} />
                    <div className={styles.genBar} />
                  </div>
                  <p>{reportLoadingAnswer(liveSession.activeLanguage)}</p>
                </div>
              ) : liveSession.state === "recoverable-error" && !activeReport ? (
                <div className={styles.errorState} id="role-fit-error" role="alert">
                  <span className={styles.msi} aria-hidden="true">error</span>
                  <h2>{errorHeading}</h2>
                  <p>{apiStatusMessage || genericRecoverableErrorAnswer(liveSession.activeLanguage)}</p>
                </div>
              ) : (
                activeReport ? (
                  <RoleFitLiveReport
                    onStartNewAnalysis={startNewAnalysis}
                    onOpenEvidenceItemIdsChange={(expandedEvidenceItemIds) => syncLiveSession({ expandedEvidenceItemIds })}
                    openEvidenceItemIds={liveSession.expandedEvidenceItemIds}
                    report={activeReport}
                  />
                ) : null
              )}
            </aside>
          ) : null}
        </section>
      )}
    </main>
  );
}
