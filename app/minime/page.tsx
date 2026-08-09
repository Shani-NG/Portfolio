"use client";

import { Chip } from "@/components/ui/chip";
import { appendRoleFitMessage, consumePendingHomeRoleFitInput, getRoleFitLiveSession, updateRoleFitLiveSession } from "@/lib/role-fit/client/session";
import { resolveConversationLanguage } from "@/lib/role-fit/conversation/behavior";
import { reportUIPayloadSchema, type ReportUIPayload } from "@/lib/role-fit/contracts";
import type { RoleFitLiveSession, RoleFitLiveState } from "@/lib/role-fit/client/session";
import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

type MatchType =
  | "direct"
  | "semantic"
  | "transferable"
  | "partial"
  | "insufficient"
  | "insufficient-evidence"
  | "real-gap";

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

const matchLabels: Record<MatchType, string> = {
  direct: "Direct evidence",
  semantic: "Strong semantic match",
  transferable: "Transferable match",
  partial: "Partial evidence",
  insufficient: "Insufficient evidence",
    "insufficient-evidence": "Insufficient evidence",
  "real-gap": "Real gap",
};

const matchTones: Record<MatchType, "success" | "secondary" | "warning"> = {
  direct: "success",
  semantic: "success",
  transferable: "secondary",
  partial: "warning",
  insufficient: "warning",
  "insufficient-evidence": "warning",
"real-gap": "warning",
};

function normalizeRepeatedInput(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function isReportConfirmationText(value: string) {
  return /^(yes|yep|sure|ok|okay|go ahead|generate|continue|confirm|great|nice|sounds good|יופי|כן|יאללה|אפשר|קדימה|מעולה|בסדר|מאשרת|תמשיכי|נמשיך)$/i.test(value.trim());
}

export default function RoleFitPage() {
  const [liveSession, setLiveSession] = useState<RoleFitLiveSession>(() => getRoleFitLiveSession());
  const [roleInput, setRoleInput] = useState("");
  const [apiStatusMessage, setApiStatusMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isReportRequestInFlight, setIsReportRequestInFlight] = useState(false);
  const [liveReportState, setLiveReportState] = useState<LiveReportState | null>(null);
  const reportRequestInFlightRef = useRef(false);
  const reportLimitReached = liveSession.completedReportCount >= 2;
  const hasLiveReport = Boolean(liveSession.reportPayload);
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
        title: "The role title is still missing. Please enter the job title so I can complete the role details.",
        responsibilities: "The role responsibilities are still missing. Please paste the main responsibilities or expected outcomes.",
        requirements: "The role requirements are still missing. Please paste the required skills, experience, or qualifications.",
      } as const;
      const guidance = reportSession.pendingRoleField
        ? missingFieldGuidance[reportSession.pendingRoleField]
        : reportSession.activeRoleText.trim()
          ? "I still need complete role details and your confirmation before generating the report. Please add the role title, responsibilities, and requirements; include the company when available."
          : "To generate a report, paste the job description or upload its details here. I need the role title, responsibilities, and requirements; include the company when available.";
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
    if (!liveSplitCanvas) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [liveSplitCanvas]);

  const chatMessages = liveSession.messages;

  return (
    <main className={liveSplitCanvas ? `${styles.roleFitPage} ${styles.liveSplitPage}` : styles.roleFitPage}>
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
      {splitCanvas ? (
        <button className={styles.mobileBackChip} type="button" onClick={() => syncLiveSession({ state: "general-qa" })}>
          <span className={styles.msi} aria-hidden="true">arrow_back</span>
          Back to chat
        </button>
      ) : null}

      {!hasConversation ? (
        <section className={styles.heroSection} id="role-fit-agent" aria-labelledby="role-fit-title">
          <h1 id="role-fit-title">Ask My Agent</h1>
          <p>Ask about my background, test a job description, or explore my case studies.</p>

          <div className={styles.chatBoxContainer}>
            <textarea
              placeholder="Paste role details using labels: Company:, Title:, Description:, Responsibilities:, Requirements:"
              aria-label="Role Fit message"
              value={roleInput}
              onChange={(event) => setRoleInput(event.target.value)}
            />
            <div className={styles.chatBoxToolbar}>
              <button className={styles.iconToolBtn} type="button" title="Upload Job Description" aria-label="Upload Job Description">
                <span className={styles.msi} aria-hidden="true">add</span>
              </button>
              <button className={styles.submitBtn} type="button" aria-label="Send message" title="Send message" disabled={isSending || !roleInput.trim()} onClick={() => void submitLiveMessage()}>
                <span className={styles.msi} aria-hidden="true">arrow_forward</span>
              </button>
            </div>
          </div>

          <div className={styles.chipsRow}>
            <Chip className={styles.chipItem} disabled={isSending} icon="upload_file" kind="action" onClick={() => void submitLiveMessage("I want to upload a job description for validation.")} title="Upload a job description" tone="primary">
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
          <div className={`${styles.chatPane} ${splitCanvas ? styles.compactHiddenChat : styles.fullWidth}`}>
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
                <button className={styles.iconToolBtn} type="button" title="Upload Job Description" aria-label="Upload Job Description">
                  <span className={styles.msi} aria-hidden="true">add</span>
                </button>
                <button className={styles.submitBtn} type="button" aria-label="Send message" title="Send message" disabled={isSending || !roleInput.trim()} onClick={() => void submitLiveMessage()}>
                  <span className={styles.msi} aria-hidden="true">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          {splitCanvas ? (
            <aside className={styles.canvasPane} aria-label="Role Fit report canvas">
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
                <LiveReportCanvas
                  liveReportState={{
                    report: liveReportState?.report ?? (liveSession.reportPayload as ReportUIPayload | null) ?? undefined,
                    provider: liveReportState?.provider ?? liveSession.reportProvider,
                    model: liveReportState?.model ?? liveSession.reportModel,
                  }}
                />
              )}
            </aside>
          ) : null}
        </section>
      )}
    </main>
  );
}

function LiveReportCanvas({ liveReportState }: { liveReportState: LiveReportState | null }) {
  const report = liveReportState?.report;
  const [openRequirementIds, setOpenRequirementIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!report) {
      setOpenRequirementIds(new Set());
      return;
    }

    const defaultRequirementId =
      report.requirementMapping.items.find((item) =>
        item.clusterIds.includes(report.evidencePanel.defaultClusterId ?? ""),
      )?.itemId ?? report.requirementMapping.items[0]?.itemId;

    setOpenRequirementIds(defaultRequirementId ? new Set([defaultRequirementId]) : new Set());
  }, [report?.reportId]);

  if (!report) {
    return (
      <div className={`${styles.reportShell} ${styles.liveReportCanvas}`} id="role-fit-live-report">
        <section className={`${styles.bentoCard} ${styles.roleSnapshot}`}>
          <span className={styles.reportEyebrow}>Role Fit Report</span>
          <h2>Report unavailable</h2>
          <p className={styles.fitSummary}>
            The report response is ready, but no display payload was returned.
          </p>
        </section>
      </div>
    );
  }

  const fitLevel =
    report.overallFitVisual.mode === "fit"
      ? report.overallFitVisual.level
      : "partial";

  const reportToneClass =
    fitLevel === "strong"
      ? styles.fitStrong
      : fitLevel === "good"
        ? styles.fitGood
        : styles.fitPartial;

  const confidenceLabel = report.evidenceConfidence.level.replaceAll("-", " ");

  const skills = report.skillsMatch.items;
  const requirements = report.requirementMapping.items;
  const evidenceClusters = report.evidencePanel.clusters;

  const strengths = report.topStrengths.items;
  const gaps = report.keyGaps.items;

  const skillsCoverageLabel = (() => {
    const coverage = report.skillsMatch.visualCoverage;

    if (coverage.mode === "qualitative") {
      return coverage.label;
    }

    if (coverage.mode === "traceable-count") {
      return `${coverage.matchedCount}/${coverage.totalCount}`;
    }

    return "Evidence-based";
  })();

  function findClusterForItem(clusterIds: string[]) {
    return (
      evidenceClusters.find((cluster) => clusterIds.includes(cluster.clusterId)) ??
      null
    );
  }

  const fitValue = report.overallFitVisual.mode === "fit" ? report.overallFitVisual.fitVisualValue : 0;
  const progressOffset = 327 - (327 * Math.min(100, Math.max(0, fitValue))) / 100;
  const fitIllustration = fitLevel === "strong" ? "account_tree" : fitLevel === "good" ? "schema" : "alt_route";
  const additionalSkillCount = Math.max(0, skills.length - 5);
  const visibleSkills = skills.slice(0, 5);
  const remainingSkills = skills.slice(5).map((skill) => skill.displayLabel || skill.originalText).join(" · ");
  const locationValue = [report.roleSnapshot.location, report.roleSnapshot.workModel].filter(Boolean).join(" · ") || "Not specified";
  const experienceValue = report.roleSnapshot.yearsOfExperience
    ? `${report.roleSnapshot.yearsOfExperience}+ years`
    : report.roleSnapshot.seniority || "Not specified";

  return (
    <div
      className={`${styles.reportShell} ${styles.liveReportCanvas} ${reportToneClass}`}
      dir={report.language === "he" ? "rtl" : "ltr"}
      id="role-fit-live-report"
    >
      <header className={styles.reportHeader}>
        <div className={styles.reportIdentity}>
          <div className={styles.reportBrand}>
            <div className={styles.avatar}>S</div>
            <div>
              <h1>Shani Nakash-Gomel - Smart Role Fit</h1>
              <p>A concise role-fit report grounded in verified portfolio evidence.</p>
            </div>
          </div>
        </div>
        <div className={styles.fitLevelChips} aria-label={`Fit level: ${report.overallFitVisual.label}`}>
          {(["strong", "good", "partial"] as const).map((level) => (
            <span
              aria-current={fitLevel === level ? "true" : undefined}
              className={`${styles.fitLevelChip} ${fitLevel === level ? styles.fitLevelSelected : ""}`}
              key={level}
              title={level}
            >
              {level}
            </span>
          ))}
        </div>
      </header>

      <div className={styles.reportGrid}>
        <section
          className={`${styles.bentoCard} ${styles.roleSnapshot}`}
          id="live-analyzed-job-profile"
          aria-label="Live Role Fit report"
        >
          <div className={styles.snapshotTop}>
            <div className={styles.snapshotCopy}>
              <span className={styles.reportEyebrow}>Analyzed Job Profile</span>
              <h2>{report.roleSnapshot.title}</h2>
              <p>
                <span className={styles.msi} aria-hidden="true">
                  business
                </span>{" "}
                {report.roleSnapshot.company}
              </p>
            </div>

          </div>

          <p className={styles.fitSummary}>
            {report.overallFitVisual.rationale}
          </p>

          <div className={styles.statsGrid}>
            <Stat
              icon="business"
              label="Company"
              value={report.roleSnapshot.company}
            />
            <Stat
              icon="workspace_premium"
              label="Required experience"
              value={experienceValue}
            />
            <Stat
              icon="location_on"
              label="Location & work model"
              value={locationValue}
            />
            <Stat
              icon="verified"
              label="Evidence confidence"
              value={confidenceLabel}
            />
          </div>
        </section>

        <section
          className={`${styles.bentoCard} ${styles.skillsCard}`}
          id="live-skills-match"
        >
          <div className={styles.progressWrap} aria-label={`${report.overallFitVisual.label}: ${skillsCoverageLabel}`}>
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle cx="60" cy="60" r="52" className={styles.progressTrack} />
              <circle
                cx="60"
                cy="60"
                r="52"
                className={styles.progressCircle}
                strokeDasharray="327"
                strokeDashoffset={progressOffset}
              />
            </svg>
            <div className={styles.fitIllustration} aria-hidden="true">
              <span className={styles.msi}>{fitIllustration}</span>
              <i />
              <i />
            </div>
          </div>
          <h3>Core Matching Skills</h3>
          <p className={styles.skillsSubtitle}>The strongest capabilities supporting this fit.</p>

          <div className={styles.skillsList}>
            {visibleSkills.map((skill) => (
              <Chip className={styles.skillChip} kind="info" key={skill.itemId}>
                {skill.displayLabel || skill.originalText}
              </Chip>
            ))}
            {additionalSkillCount ? <span className={styles.moreSkillsChip} title={remainingSkills}>+{additionalSkillCount} more</span> : null}
          </div>
        </section>

        <section
          className={`${styles.bentoCard} ${styles.evidenceSection}`}
          id="live-requirements-evidence"
        >
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.reportEyebrow}>
                Requirements & Evidence Mapping
              </span>
              <h3>Evidence Behind the Match</h3>
            </div>

            <Chip
              className={styles.guidanceChip}
              icon="touch_app"
              kind="info"
            >
              Tap a requirement to view its portfolio evidence
            </Chip>
          </div>

          <div className={styles.requirementsList}>
              {requirements.map((requirement) => {
                const cluster = findClusterForItem(requirement.clusterIds);
                const isOpen = openRequirementIds.has(requirement.itemId);

                return (
                  <article
                    className={`${styles.requirementDisclosure} ${isOpen ? styles.activeRequirement : ""}`}
                    key={requirement.itemId}
                  >
                    <button
                      className={styles.requirementItem}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`evidence-${requirement.itemId}`}
                      onClick={() => {
                        setOpenRequirementIds((current) => {
                          const next = new Set(current);
                          if (next.has(requirement.itemId)) next.delete(requirement.itemId);
                          else next.add(requirement.itemId);
                          return next;
                        });
                      }}
                    >
                      <span className={styles.requirementIcon} aria-hidden="true">
                        <span className={styles.msi}>
                        {requirement.impact === "gap"
                          ? "warning"
                          : requirement.matchType === "direct"
                            ? "verified"
                            : "link"}
                        </span>
                      </span>

                      <span className={styles.requirementCopy}>
                        <strong title={requirement.displayLabel || requirement.originalText}>
                          {requirement.displayLabel || requirement.originalText}
                        </strong>

                        <small title={requirement.shortRationale}>{requirement.shortRationale}</small>

                        <Chip
                          className={styles.matchChip}
                          kind="info"
                          tone={matchTones[requirement.matchType]}
                        >
                          {matchLabels[requirement.matchType]} ·{" "}
                          {requirement.evidenceConfidence.replaceAll("-", " ")}
                        </Chip>
                      </span>

                      <span className={`${styles.msi} ${styles.requirementChevron}`} aria-hidden="true">
                        expand_more
                      </span>
                    </button>

                    <div className={styles.requirementPanelWrap} id={`evidence-${requirement.itemId}`} aria-hidden={!isOpen}>
                      <div className={styles.requirementPanelInner}>
                        {cluster ? <LiveEvidencePanel cluster={cluster} /> : (
                          <div className={styles.noEvidenceState}>
                            <span className={styles.msi} aria-hidden="true">search_off</span>
                            <strong>No verified portfolio evidence found</strong>
                            <p>This requirement is not supported by the approved portfolio evidence.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
        </section>

        <ListCard
          id="live-top-strengths"
          icon="check_circle"
          title="Top Strengths"
          items={strengths}
          tone="strength"
        />

        <ListCard
          id="live-key-gaps"
          icon="warning"
          title="Key Gaps"
          items={gaps}
          tone="gap"
          emptyTitle="No material gaps detected"
          emptyBody="Based on the submitted role and available evidence."
        />

        <section className={styles.ctaSection} id="live-role-fit-contact">
          <p>{report.disclaimer.text}</p>

          {report.contactCta.enabled && report.contactCta.href ? (
          <a href={report.contactCta.href} className={styles.ctaButton}>
            <span className={styles.msi} aria-hidden="true">
              mail
            </span>
            <span>{report.contactCta.label}</span>
          </a>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function LiveEvidencePanel({
  cluster,
}: {
  cluster: ReportUIPayload["evidencePanel"]["clusters"][number];
}) {
  const hasLink = cluster.destination.mode !== "no-link";

  return (
    <div className={styles.projectContent}>
      <div>
        <div className={styles.verifiedLabel}>
          <span className={styles.msi} aria-hidden="true">
            folder_open
          </span>
          Verified Portfolio Evidence
        </div>

        <h4>{cluster.project?.title || cluster.title}</h4>
        <p>{cluster.summary}</p>

      </div>

      {hasLink ? (
        <a
          href={cluster.destination.mode === "no-link" ? "#" : cluster.destination.href}
          className={styles.projectLink}
        >
          <span>
            View Case Study
          </span>

          <span className={styles.msi} aria-hidden="true">
            arrow_forward
          </span>
        </a>
      ) : (
        <p className={`${styles.projectLink} ${styles.sourceLabel}`}>
          Source: {cluster.title}
        </p>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className={styles.statCard}>
      <div><span className={styles.msi} aria-hidden="true">{icon}</span></div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

type ReportListItem = string | Pick<ReportUIPayload["requirementMapping"]["items"][number], "displayLabel" | "originalText" | "shortRationale">;

function ListCard({
  id,
  icon,
  title,
  items,
  tone,
  emptyTitle,
  emptyBody,
}: {
  id: string;
  icon: string;
  title: string;
  items: ReportListItem[];
  tone: "strength" | "gap";
  emptyTitle?: string;
  emptyBody?: string;
}) {
  const hasItems = items.length > 0;

  return (
    <section className={`${styles.bentoCard} ${styles.listCard}`} id={id}>
      <h3 className={tone === "strength" ? styles.strengthTitle : styles.gapTitle}>
        <span className={styles.msi} aria-hidden="true">{icon}</span>
        {title}
      </h3>
      {hasItems ? (
        <ul>
        {items.map((item) => {
          const label = typeof item === "string" ? item : item.displayLabel || item.originalText;
          const rationale = typeof item === "string" ? "" : item.shortRationale;

          return (
          <li key={`${label}-${rationale}`}>
            <span className={styles.msi} aria-hidden="true">{tone === "strength" ? "check_circle" : "error"}</span>
            <span>
              <strong>{label}</strong>
              {rationale ? <small>{rationale}</small> : null}
            </span>
          </li>
          );
        })}
      </ul>
      ) : (
        <div className={styles.emptyGapState}>
          <strong>{emptyTitle ?? "No items to show"}</strong>
          {emptyBody ? <p>{emptyBody}</p> : null}
        </div>
      )}
    </section>
  );
}
