"use client";

import { Chip } from "@/components/ui/chip";
import { RoleFitLiveReport } from "@/components/role-fit/role-fit-live-report";
import { appendRoleFitMessage, consumePendingHomeRoleFitInput, getRoleFitLiveSession, resetRoleFitAnalysis, restoreRoleFitLiveSession, updateRoleFitLiveSession } from "@/lib/role-fit/client/session";
import { isReportConfirmationText, resolveConversationLanguage } from "@/lib/role-fit/conversation/behavior";
import { reportUIPayloadSchema, type ReportUIPayload } from "@/lib/role-fit/contracts";
import type { RoleFitLiveSession, RoleFitLiveState } from "@/lib/role-fit/client/session";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import styles from "./page.module.css";

type LiveReportState = {
  provider?: string;
  model?: string;
  report?: ReportUIPayload;
};

const reportRequestTimeoutMs = 65_000;

type ReportFailureResult = {
  state?: string;
  safeMessage?: string;
  eligibility?: { reason?: string };
  validation?: { missingFields?: string[] };
};

function reportFailureMessage(result: ReportFailureResult): string {
  if (result.state === "validation-failed") {
    const missingField = result.validation?.missingFields?.[0];
    return missingField
      ? `The saved role is missing ${missingField}. Please add that detail in the chat before retrying.`
      : "The saved role details are incomplete. Please add the requested detail in the chat before retrying.";
  }

  if (result.state === "blocked") {
    return result.eligibility?.reason === "report-limit-reached"
      ? "The report limit for this session has been reached."
      : "The report cannot be generated until the role is complete and approved.";
  }

  return result.safeMessage ?? "I could not complete a reliable evidence-based report. Your role details are preserved, so you can try again.";
}

function normalizeRepeatedInput(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

export default function RoleFitPage() {
  const [liveSession, setLiveSession] = useState<RoleFitLiveSession>(() => getRoleFitLiveSession());
  const [roleInput, setRoleInput] = useState("");
  const [apiStatusMessage, setApiStatusMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isReportRequestInFlight, setIsReportRequestInFlight] = useState(false);
  const [liveReportState, setLiveReportState] = useState<LiveReportState | null>(null);
  const [activePane, setActivePane] = useState<"chat" | "report">("chat");
  const [isNarrowLayout, setIsNarrowLayout] = useState(false);
  const reportRequestInFlightRef = useRef(false);
  const chatPaneRef = useRef<HTMLDivElement>(null);
  const reportPaneRef = useRef<HTMLElement>(null);
  const roleFileInputRef = useRef<HTMLInputElement>(null);
  const reportLimitReached = liveSession.completedReportCount >= 2;
  const hasLiveReport = Boolean(liveSession.reportPayload);
  const activeReport = liveReportState?.report ?? (liveSession.reportPayload as ReportUIPayload | null) ?? undefined;
  const liveSplitCanvas = liveSession.state === "generating-report" || liveSession.state === "recoverable-error" || liveSession.state === "report-ready";
  const splitCanvas = liveSplitCanvas;
  const hasConversation = liveSession.messages.length > 0 || liveSession.state !== "initial";
  const reportActionLabel = reportLimitReached
    ? "Sorry, that is it for now. You are welcome to contact me."
    : hasLiveReport
      ? "Show report"
    : liveSession.pendingReportConfirmation
      ? "Generate confirmed report"
      : "Generate report";

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

  async function submitLiveMessage(textOverride?: string) {
    const submittedText = (textOverride ?? roleInput).trim();
    if (!submittedText || isSending) return;
    if (liveSession.pendingReportConfirmation && isReportConfirmationText(submittedText)) {
      appendLiveMessage({ role: "user", content: submittedText });
      setRoleInput("");
      await requestReport();
      return;
    }
    const normalizedSubmittedText = normalizeRepeatedInput(submittedText);
    const normalizedActiveRoleText = normalizeRepeatedInput(liveSession.activeRoleText);
    const repeatedInput = Boolean(
      normalizedActiveRoleText &&
      (
        normalizedSubmittedText === normalizedActiveRoleText ||
        (normalizedSubmittedText.length > 80 && normalizedActiveRoleText.includes(normalizedSubmittedText))
      ),
    );
    const messageForAgent = repeatedInput
      ? liveSession.activeRoleText
      : submittedText;
    const activeLanguage = resolveConversationLanguage(submittedText, liveSession.activeLanguage);

    const sessionAfterUser = appendLiveMessage({ role: "user", content: submittedText });
    setRoleInput("");
    setIsSending(true);
    setApiStatusMessage("");
    setLiveReportState(null);
    syncLiveSession({
      state: liveSession.reportPayload ? "report-ready" : "general-qa",
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
          roleCollectionActive: liveSession.state === "awaiting-role-completion" && !liveSession.reportPayload,
          clarificationAttempts: liveSession.clarificationAttempts,
          completedReportCount: liveSession.completedReportCount,
          conversationContext: JSON.stringify(sessionAfterUser.messages.slice(-8)),
          reportContext: liveSession.reportPayload ? JSON.stringify(liveSession.reportPayload).slice(0, 18000) : undefined,
          roleContext: liveSession.activeRoleText
            ? {
                roleText: liveSession.activeRoleText,
                ...(liveSession.pendingRoleField ? { pendingField: liveSession.pendingRoleField } : {}),
              }
            : undefined,
        }),
      });

      const result = await response.json();
      const responseState = (result.state ?? "general-qa") as RoleFitLiveState;
      const nextState = liveSession.reportPayload && responseState === "general-qa" ? "report-ready" : responseState;
      appendLiveMessage({ role: "agent", content: result.answer ?? "I need a little more context before I can answer safely." });
      syncLiveSession({
        state: nextState,
        activeRoleText: result.roleText ?? liveSession.activeRoleText,
        activeRoleTitle: result.validation?.roleDraft?.title?.originalValue ?? liveSession.activeRoleTitle,
        activeRoleCompany: result.validation?.roleDraft?.company?.originalValue ?? liveSession.activeRoleCompany,
        pendingRoleField: result.pendingField !== undefined ? result.pendingField : liveSession.pendingRoleField,
        pendingReportConfirmation: nextState === "awaiting-report-confirmation",
        clarificationAttempts: nextState === "awaiting-role-completion" && !result.clarificationExhausted
          ? liveSession.clarificationAttempts + 1
          : 0,
        activeLanguage,
      });

      if (!response.ok) {
        setApiStatusMessage(result.safeMessageKey ?? "The live conversation service is currently unavailable.");
      }
    } catch {
      appendLiveMessage({ role: "agent", content: "The live conversation service is currently unavailable. Please try again in a moment." });
      syncLiveSession({ state: "recoverable-error", pendingReportConfirmation: false });
    } finally {
      setIsSending(false);
    }
  }

  async function requestReport(sessionOverride?: RoleFitLiveSession) {
    const reportSession = sessionOverride ?? liveSession;

    if (reportRequestInFlightRef.current) return;
    if (reportSession.completedReportCount >= 2) return;
    if (reportSession.reportPayload) {
      syncLiveSession({ state: "report-ready" });
      return;
    }
    if (!reportSession.pendingReportConfirmation || !reportSession.activeRoleText.trim()) {
      const missingFieldGuidance = {
        company: "The company name is still missing. Please enter the company name so I can complete the role details.",
        title: "What is the role title? If there is no title, say so and I will offer a generic category.",
        responsibilities: "The role responsibilities are still missing. Please paste the main responsibilities or expected outcomes.",
        requirements: "The role requirements are still missing. Please paste the required skills, experience, or qualifications.",
      } as const;
      const guidance = reportSession.pendingRoleField
        ? missingFieldGuidance[reportSession.pendingRoleField]
        : reportSession.activeRoleText.trim()
          ? "To create the report, I still need:\n- Role title\n- Main responsibilities\n- Main requirements or qualifications\nYou can add them in one message."
          : "Paste the role details or upload a text file to begin.";
      appendLiveMessage({
        role: "agent",
        content: guidance,
      });
      syncLiveSession({ state: "awaiting-role-completion", pendingReportConfirmation: false });
      return;
    }

    setApiStatusMessage("");
    setLiveReportState(null);
    reportRequestInFlightRef.current = true;
    setIsReportRequestInFlight(true);
    setActivePane("report");
    syncLiveSession({ state: "generating-report" });
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), reportRequestTimeoutMs);

    try {
      const response = await fetch("/api/role-fit/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roleText: reportSession.activeRoleText,
          approved: true,
          completedReportCount: reportSession.completedReportCount,
          conversationId: reportSession.conversationId,
          sessionId: reportSession.sessionId,
          language: reportSession.activeLanguage,
        }),
        signal: controller.signal,
      });

      const result = await response.json().catch(() => ({
        state: "malformed-output",
        safeMessage: "The report service returned an unreadable response. Your role details are preserved, so you can try again.",
      }));

      if (!response.ok || result.state !== "ready") {
        const message = reportFailureMessage(result);
        const missingField = result.validation?.missingFields?.[0] ?? null;
        setApiStatusMessage(message);
        appendLiveMessage({ role: "agent", content: message });
        syncLiveSession({
          state: "recoverable-error",
          pendingRoleField: missingField ?? reportSession.pendingRoleField,
          pendingReportConfirmation: !missingField,
        });
        return;
      }

      const parsedReport = reportUIPayloadSchema.safeParse(result.report ?? result.eligibility?.report);
      if (!parsedReport.success) {
        const message = "The report response was incomplete and was not displayed. Your role details are preserved, so you can try again.";
        setApiStatusMessage(message);
        appendLiveMessage({ role: "agent", content: message });
        syncLiveSession({ state: "recoverable-error", pendingReportConfirmation: true });
        return;
      }

      const report = parsedReport.data;
      setLiveReportState({
        provider: result.provider,
        model: result.model,
        report,
      });
      appendLiveMessage({ role: "agent", content: "הדוח מוכן. אפשר לראות אותו באזור הדוח ולהמשיך לשאול כאן באותה שיחה." });
      syncLiveSession({
        state: "report-ready",
        reportPayload: report,
        reportProvider: result.provider,
        reportModel: result.model,
        completedReportCount: (reportSession.completedReportCount + 1) as 1 | 2,
        pendingRoleField: null,
        pendingReportConfirmation: false,
      });
      setActivePane("report");
    } catch (error) {
      const timedOut = error instanceof Error && error.name === "AbortError";
      const message = timedOut
        ? "Report generation took too long and was stopped safely. Your role details are preserved, so you can try again."
        : "The report service is currently unavailable. Your role details are preserved, so you can try again.";
      setApiStatusMessage(message);
      appendLiveMessage({ role: "agent", content: message });
      syncLiveSession({ state: "recoverable-error", pendingReportConfirmation: true });
    } finally {
      window.clearTimeout(timeoutId);
      reportRequestInFlightRef.current = false;
      setIsReportRequestInFlight(false);
    }
  }

  useEffect(() => {
    const pendingInput = consumePendingHomeRoleFitInput();
    if (!pendingInput) return;

    const submittedText = [pendingInput.text, pendingInput.fileText].filter(Boolean).join("\n\n").trim();
    const uploadPrefix = pendingInput.fileName ? `Uploaded file: ${pendingInput.fileName}` : "";
    void submitLiveMessage([uploadPrefix, submittedText].filter(Boolean).join("\n\n"));
  }, []);

  useEffect(() => {
    const restoredSession = restoreRoleFitLiveSession();
    setLiveSession(restoredSession);
    if (restoredSession.reportPayload) setActivePane("report");
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

    void file.text()
      .then((fileText) => {
        const roleText = fileText.trim();
        if (!roleText) {
          appendLiveMessage({ role: "agent", content: "The selected file is empty. Please choose a text file with the role details." });
          return;
        }
        return submitLiveMessage(`Uploaded file: ${file.name}\n\n${roleText}`);
      })
      .catch(() => {
        appendLiveMessage({ role: "agent", content: "I could not read that file. Please choose a TXT, Markdown, or CSV file." });
      });
  }

  function startNewAnalysis() {
    const nextSession = resetRoleFitAnalysis();
    setLiveSession(nextSession);
    setLiveReportState(null);
    setApiStatusMessage("");
    setRoleInput("");
    setActivePane("chat");
  }

  const chatMessages = liveSession.messages;

  return (
    <main className={liveSplitCanvas ? `${styles.roleFitPage} ${styles.liveSplitPage}` : styles.roleFitPage}>
      <input
        accept=".txt,.md,.csv,text/plain,text/markdown,text/csv"
        aria-label="Upload job description"
        hidden
        onChange={handleRoleFileUpload}
        ref={roleFileInputRef}
        type="file"
      />
      {!hasLiveReport ? <button
        className={[styles.stickyReportChip, splitCanvas && styles.canvasActiveAction, styles.liveReportAction].filter(Boolean).join(" ")}
        aria-label={reportActionLabel}
        type="button"
        disabled={reportLimitReached || isReportRequestInFlight}
        title={reportActionLabel}
        onClick={() => void requestReport()}
      >
        Generate Report
      </button> : null}
      {hasLiveReport && splitCanvas ? (
        <button
          aria-label={activePane === "report" ? "Switch to chat" : "Switch to report"}
          className={styles.paneToggleFab}
          onClick={() => switchPane(activePane === "report" ? "chat" : "report")}
          type="button"
        >
          <span className={styles.msi} aria-hidden="true">{activePane === "report" ? "chat" : "description"}</span>
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
              value={roleInput}
              onChange={(event) => setRoleInput(event.target.value)}
            />
            <div className={styles.chatBoxToolbar}>
              <button className={styles.iconToolBtn} type="button" title="Upload Job Description" aria-label="Upload Job Description" onClick={() => roleFileInputRef.current?.click()}>
                <span className={styles.msi} aria-hidden="true">add</span>
              </button>
              <button className={styles.submitBtn} type="button" aria-label="Send message" title="Send message" disabled={isSending || !roleInput.trim()} onClick={() => void submitLiveMessage()}>
                <span className={styles.msi} aria-hidden="true">arrow_forward</span>
              </button>
            </div>
          </div>

          <div className={styles.chipsRow}>
            <Chip className={styles.chipItem} disabled={isSending} icon="upload_file" kind="action" onClick={() => roleFileInputRef.current?.click()} title="Upload a job description" tone="primary">
              <span className={styles.fullChipLabel}>Upload a job description</span><span className={styles.shortChipLabel} aria-hidden="true">Upload</span>
            </Chip>
            <Chip className={styles.chipItem} disabled={isSending} icon="content_paste" kind="action" onClick={() => void submitLiveMessage("I want to paste job details for validation.")} title="Paste job details" tone="primary">
              <span className={styles.fullChipLabel}>Paste job details</span><span className={styles.shortChipLabel} aria-hidden="true">Paste</span>
            </Chip>
            <Chip className={styles.chipItem} disabled={isSending} icon="travel_explore" kind="action" onClick={() => void submitLiveMessage("Explore my experience")} title="Explore my experience" tone="primary">
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
            <div className={styles.chatHistory}>
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
            </div>

            <div className={styles.chatBoxContainer}>
              <textarea
                placeholder="Paste or refine role details using labels: Company:, Title:, Description:, Responsibilities:, Requirements:"
                aria-label="Role Fit follow-up"
                value={roleInput}
                onChange={(event) => setRoleInput(event.target.value)}
              />
              <div className={styles.chatBoxToolbar}>
                <button className={styles.iconToolBtn} type="button" title="Upload Job Description" aria-label="Upload Job Description" onClick={() => roleFileInputRef.current?.click()}>
                  <span className={styles.msi} aria-hidden="true">add</span>
                </button>
                <button className={styles.submitBtn} type="button" aria-label="Send message" title="Send message" disabled={isSending || !roleInput.trim()} onClick={() => void submitLiveMessage()}>
                  <span className={styles.msi} aria-hidden="true">arrow_forward</span>
                </button>
              </div>
            </div>
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
                  <p>Analyzing job requirements & matching Evidence Cards...</p>
                </div>
              ) : liveSession.state === "recoverable-error" ? (
                <div className={styles.errorState} id="role-fit-error" role="alert">
                  <span className={styles.msi} aria-hidden="true">error</span>
                  <h2>The live agent needs attention</h2>
                  <p>{apiStatusMessage || "The session is preserved. Please continue in the chat or try again."}</p>
                </div>
              ) : (
                activeReport ? <RoleFitLiveReport onStartNewAnalysis={startNewAnalysis} report={activeReport} /> : null
              )}
            </aside>
          ) : null}
        </section>
      )}
    </main>
  );
}
