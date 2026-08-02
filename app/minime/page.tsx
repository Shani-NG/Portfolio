"use client";

import { Chip } from "@/components/ui/chip";
import { appendRoleFitMessage, consumePendingHomeRoleFitInput, getRoleFitLiveSession, updateRoleFitLiveSession } from "@/lib/role-fit/client/session";
import { reportUIPayloadSchema, type ReportUIPayload } from "@/lib/role-fit/contracts";
import type { RoleFitLiveSession, RoleFitLiveState } from "@/lib/role-fit/client/session";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./page.module.css";

type RoleFitScreenState = "home" | "conversation" | "missing-details" | "generating" | "error" | "report";
type RoleFitDisplayMode = "live" | RoleFitScreenState;
type FitMode = "strong" | "good" | "partial";
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

const screenOptions: { value: RoleFitDisplayMode; label: string }[] = [
  { value: "live", label: "Live agent" },
  { value: "home", label: "Simulation - initial entry" },
  { value: "conversation", label: "Simulation - conversation started" },
  { value: "missing-details", label: "Simulation - missing job details" },
  { value: "generating", label: "Simulation - generating report" },
  { value: "error", label: "Simulation - report generation failed" },
  { value: "report", label: "Simulation - fit report" },
];

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

const evidenceProjects = [
  {
    title: "C4I - Beyond Clarity",
    desc: "Optimizing data density and visual hierarchy in multi-system command & control platforms. A comprehensive design that translated sheer complexity into a single source of truth.",
    insight: "Redesigned the tactical UI hierarchy, reducing target identification time by 40%.",
    link: "/experience/c4i-beyond-clarity#before-ux-organizational-alignment",
    icon: "verified",
  },
  {
    title: "AI Starts Before the Model",
    desc: "Comprehensive workflow mapping integrating artificial intelligence, focusing on human intent and preparedness prior to model deployment.",
    insight: "Structured a progressive disclosure workflow that mitigated critical decision errors caused by AI hallucinations.",
    link: "/experience/nobody-reads-the-manual#foundation-phase",
    icon: "auto_awesome",
  },
  {
    title: "The Big RED BUTTON",
    desc: "Led end-to-end research and design to minimize critical enterprise system downtime via a rapid disaster-recovery module.",
    insight: "Slashed troubleshooting steps from 12 separate interventions to 3 intuitive actions.",
    link: "/experience/the-big-red-button#translating-infrastructure-into-operational-meaning",
    icon: "terminal",
  },
  {
    title: "Monitoring & Product Intelligence",
    desc: "Built advanced tracking dashboards translating anecdotal user feedback into structured product intelligence metrics for accurate feature prioritization.",
    insight: "Established unified product telemetry views, accelerating cross-functional alignment by 30%.",
    link: "/experience/monitoring-product-intelligence",
    icon: "groups",
  },
  {
    title: "UX from the Heart",
    desc: "A highly critical medical system used in operating theatres, blending rigorous clinical safety compliance with rapid usability.",
    insight: "Engineered a hands-on tactile workflow that avoids cognitive load or distraction for surgeons under high operational pressure.",
    link: "/experience/ux-from-the-heart",
    icon: "health_and_safety",
  },
];

const fitModes = {
  strong: {
    badgeText: "Strong Fit",
    score: "82",
    confidence: "High",
    summary: "Most core responsibilities are supported by direct or strong semantic evidence from complex systems work.",
    skillsRatio: "9 / 10",
    skillsOffset: 30,
    skills: ["UX Strategy", "AI Integration", "Systems Design", "User Research", "Fast Prototyping", "Team Alignment", "Data Analysis", "Agile Design Ops", "Clinical UX Standards"],
    matchedRatio: "8 / 10",
    coreCoverage: "80%",
    expRequired: "8+ years",
    requirements: [
      {
        label: "Lead UX strategy for complex enterprise systems",
        detail: "Direct evidence from C4I product alignment, research, information architecture, and system-wide UX governance.",
        matchType: "direct",
        confidence: "High",
        projectIndex: 0,
      },
      {
        label: "Integrate AI-enabled workflows into product operations",
        detail: "Strong semantic evidence from pre-model workflow mapping, human oversight, and progressive disclosure decisions.",
        matchType: "semantic",
        confidence: "Medium",
        projectIndex: 1,
      },
      {
        label: "Translate technical architecture into usable operational tools",
        detail: "Direct evidence from system-health, diagnostics, and service-level recovery flows.",
        matchType: "direct",
        confidence: "High",
        projectIndex: 2,
      },
      {
        label: "Align product, engineering, research, and leadership",
        detail: "Direct evidence from design-system alignment, telemetry-based decisions, and cross-functional product rituals.",
        matchType: "direct",
        confidence: "High",
        projectIndex: 3,
      },
      {
        label: "Work in regulated or safety-sensitive product contexts",
        detail: "Transferable evidence from mission-critical and medical-system environments, with some domain-specific details still unverified.",
        matchType: "transferable",
        confidence: "Medium",
        projectIndex: 4,
      },
    ],
    strengths: [
      "AI product leadership in complex enterprise & defense domains",
      "End-to-end product strategy, execution, & agentic UX",
      "Cross-functional alignment & executive influence",
      "Experience with regulated & mission-critical environments",
      "User-centered design thinking backed by product metrics",
    ],
    gaps: [
      "Limited direct experience in specific clinical healthcare domains",
      "No exposure to strict hospital EHR integration workflows",
      "Vendor management at massive global scale",
    ],
    ctaText: "Strong Fit - Let's build something great together! (Contact)",
  },
  good: {
    badgeText: "Good Fit",
    score: "64",
    confidence: "Medium",
    summary: "There is meaningful overlap, but several responsibilities rely on transferable evidence rather than direct proof.",
    skillsRatio: "7 / 10",
    skillsOffset: 90,
    skills: ["UX Strategy", "Systems Design", "User Research", "Fast Prototyping", "Team Alignment", "Data Analysis", "Agile Design Ops"],
    matchedRatio: "7 / 10",
    coreCoverage: "65%",
    expRequired: "8+ years",
    requirements: [
      {
        label: "Shape product direction from ambiguous requirements",
        detail: "Strong semantic evidence across C4I and knowledge-management work, especially around turning complexity into structure.",
        matchType: "semantic",
        confidence: "High",
        projectIndex: 0,
      },
      {
        label: "Facilitate research and stakeholder alignment",
        detail: "Direct evidence exists, but the target role may require a different operating cadence or company scale.",
        matchType: "direct",
        confidence: "Medium",
        projectIndex: 3,
      },
      {
        label: "Prototype and validate workflow concepts quickly",
        detail: "Transferable evidence from operational and KMS flows; implementation depth should be clarified in conversation.",
        matchType: "transferable",
        confidence: "Medium",
        projectIndex: 1,
      },
      {
        label: "Own AI product execution end to end",
        detail: "Partial evidence: strong workflow thinking, but the current public portfolio does not fully prove model-side ownership.",
        matchType: "partial",
        confidence: "Low",
        projectIndex: 1,
      },
      {
        label: "Operate inside a highly specific domain stack",
        detail: "Insufficient evidence for the exact stack; related systems experience should not be presented as a direct match.",
        matchType: "insufficient",
        confidence: "Low",
        projectIndex: 2,
      },
    ],
    strengths: [
      "Proven systems strategy across mission-critical products",
      "Strong cross-functional alignment with engineering & research",
      "Solid foundation in user research and rapid prototyping",
      "Track record of shipping in regulated environments",
    ],
    gaps: [
      "Less hands-on depth with non-AI tooling in the target stack",
      "Split between execution and high-level strategy needs clarifying",
      "Direct agentic AI workflow experience still developing",
    ],
    ctaText: "Good Fit - Let's schedule an introductory call! (Contact)",
  },
  partial: {
    badgeText: "Partial Match",
    score: "38",
    confidence: "Low",
    summary: "Relevant capabilities exist, but the available evidence does not cover enough of the role's core requirements.",
    skillsRatio: "5 / 10",
    skillsOffset: 150,
    skills: ["UX Strategy", "Systems Design", "User Research", "Team Alignment", "Fast Prototyping"],
    matchedRatio: "4 / 10",
    coreCoverage: "45%",
    expRequired: "8+ years",
    requirements: [
      {
        label: "Lead strategic UX discovery",
        detail: "Transferable evidence exists across complex systems, but it may not match the exact domain or seniority expectations.",
        matchType: "transferable",
        confidence: "Medium",
        projectIndex: 0,
      },
      {
        label: "Build production-grade AI product systems",
        detail: "Partial evidence only: workflow architecture is visible, but hands-on AI system delivery is not fully proven.",
        matchType: "partial",
        confidence: "Low",
        projectIndex: 1,
      },
      {
        label: "Own frontend implementation",
        detail: "Insufficient evidence. The portfolio supports UX strategy and product translation, not a software-engineering claim.",
        matchType: "insufficient",
        confidence: "Low",
        projectIndex: 2,
      },
      {
        label: "Navigate safety-sensitive product constraints",
        detail: "Transferable evidence from medical and mission-critical work, but role-specific compliance requirements need validation.",
        matchType: "transferable",
        confidence: "Medium",
        projectIndex: 4,
      },
      {
        label: "Run cross-functional workshops and alignment",
        detail: "Direct evidence appears across portfolio work and remains one of the stronger supported areas.",
        matchType: "direct",
        confidence: "High",
        projectIndex: 3,
      },
    ],
    strengths: [
      "Solid strategic UX foundation transferable across domains",
      "Strong team alignment and stakeholder facilitation skills",
      "Fast prototyping capability for early-stage validation",
    ],
    gaps: [
      "Frontend development fluency required vs. close R&D sync unclear",
      "Limited exposure to this product's specific technical domain",
      "First-quarter success metrics not yet clearly defined",
    ],
    ctaText: "Partial Match - Let's talk and explore the potential! (Contact)",
  },
} satisfies Record<FitMode, {
  badgeText: string;
  score: string;
  confidence: "High" | "Medium" | "Low";
  summary: string;
  skillsRatio: string;
  skillsOffset: number;
  skills: string[];
  matchedRatio: string;
  coreCoverage: string;
  expRequired: string;
  requirements: {
    label: string;
    detail: string;
    matchType: MatchType;
    confidence: "High" | "Medium" | "Low";
    projectIndex: number;
  }[];
  strengths: string[];
  gaps: string[];
  ctaText: string;
}>;

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

function detectSessionLanguage(message: string, session: RoleFitLiveSession) {
  if (/[\u0590-\u05ff]/.test(message)) return "he";
  const hadHebrewConversation = session.messages.some((item) => /[\u0590-\u05ff]/.test(item.content));
  return hadHebrewConversation ? "he" : "en";
}

export default function RoleFitPage() {
  const [displayMode, setDisplayMode] = useState<RoleFitDisplayMode>("live");
  const [screenState, setScreenState] = useState<RoleFitScreenState>("home");
  const [fitMode, setFitMode] = useState<FitMode>("strong");
  const [activeProject, setActiveProject] = useState<number | null>(null);
  const [liveSession, setLiveSession] = useState<RoleFitLiveSession>(() => getRoleFitLiveSession());
  const [roleInput, setRoleInput] = useState("");
  const [apiStatusMessage, setApiStatusMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isReportRequestInFlight, setIsReportRequestInFlight] = useState(false);
  const [liveReportState, setLiveReportState] = useState<LiveReportState | null>(null);
  const reportRequestInFlightRef = useRef(false);
  const fit = fitModes[fitMode];
  const selectedProject = activeProject === null ? null : evidenceProjects[activeProject];
  const reportLimitReached = liveSession.completedReportCount >= 2;
  const isLiveMode = displayMode === "live";
  const hasLiveReport = Boolean(liveSession.reportPayload);
  const liveSplitCanvas = liveSession.state === "generating-report" || liveSession.state === "recoverable-error" || liveSession.state === "report-ready";

  const simulationSplitCanvas = screenState === "generating" || screenState === "error" || screenState === "report";
  const splitCanvas = isLiveMode ? liveSplitCanvas : simulationSplitCanvas;
  const hasConversation = isLiveMode ? liveSession.messages.length > 0 || liveSession.state !== "initial" : screenState !== "home";
  const reportActionLabel = reportLimitReached
    ? "Sorry, that is it for now. You are welcome to contact me."
    : isLiveMode && hasLiveReport
      ? "Show report"
    : isLiveMode && liveSession.pendingReportConfirmation
      ? "Generate confirmed report"
      : !isLiveMode && screenState === "report"
      ? "Create a new report"
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
    if (isLiveMode && liveSession.pendingReportConfirmation && isReportConfirmationText(submittedText)) {
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

    const sessionAfterUser = appendLiveMessage({ role: "user", content: submittedText });
    setRoleInput("");
    setIsSending(true);
    setApiStatusMessage("");
    setLiveReportState(null);
    syncLiveSession({
      state: liveSession.reportPayload ? "report-ready" : "general-qa",
      draftInput: "",
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
          language: detectSessionLanguage(submittedText, sessionAfterUser),
          repeatedInput,
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
      const nextSession = syncLiveSession({
        state: nextState,
        activeRoleText: result.roleText ?? liveSession.activeRoleText,
        activeRoleTitle: result.validation?.roleDraft?.title?.originalValue ?? liveSession.activeRoleTitle,
        activeRoleCompany: result.validation?.roleDraft?.company?.originalValue ?? liveSession.activeRoleCompany,
        pendingRoleField: result.pendingField !== undefined ? result.pendingField : liveSession.pendingRoleField,
        pendingReportConfirmation: nextState === "awaiting-report-confirmation",
      });

      if (result.autoApproveReport) {
        await requestReport(nextSession);
      }

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
    if (!isLiveMode) {
      setScreenState("report");
      return;
    }

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

    setActiveProject(null);
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
          language: detectSessionLanguage(reportSession.activeRoleText, reportSession),
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
    if (!isLiveMode || !liveSplitCanvas) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isLiveMode, liveSplitCanvas]);

  const chatMessages = useMemo(() => {
    if (isLiveMode) return liveSession.messages;
    if (screenState === "home") return [];

    const messages = [
      { role: "user", content: "I pasted a Senior UX Strategist role and want to understand the fit." },
      { role: "agent", content: "Received. I am analyzing Shani's documented UX strategy & AI workflow cases against your query." },
    ];

    if (screenState === "missing-details") {
      messages.push({ role: "agent", content: apiStatusMessage || "Please upload a file or paste job details so we can generate a high-quality report." });
    }

    if (screenState === "error") {
      messages.push({ role: "agent", content: apiStatusMessage || "I could not generate a reliable report from the provided input. Please add role requirements, responsibilities, or expected outcomes." });
    }

    return messages;
  }, [apiStatusMessage, isLiveMode, liveSession.messages, screenState]);

  return (
    <main className={isLiveMode && liveSplitCanvas ? `${styles.roleFitPage} ${styles.liveSplitPage}` : styles.roleFitPage}>
      <section className={styles.stateBar} aria-label="Role Fit preview state">
        <select
          id="role-fit-state"
          aria-label="Role Fit preview state"
          value={displayMode}
          onChange={(event) => {
            const nextMode = event.target.value as RoleFitDisplayMode;
            setDisplayMode(nextMode);
            if (nextMode !== "live") setScreenState(nextMode);
          }}
        >
          {screenOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </section>

      {!(isLiveMode && hasLiveReport) ? <button
        className={[styles.stickyReportChip, splitCanvas && styles.canvasActiveAction, isLiveMode && styles.liveReportAction].filter(Boolean).join(" ")}
        aria-label={reportActionLabel}
        type="button"
        disabled={isLiveMode ? reportLimitReached || isReportRequestInFlight : false}
        title={reportActionLabel}
        onClick={() => void requestReport()}
      >
        {isLiveMode ? "Generate Report" : <span className={styles.msi} aria-hidden="true">{screenState === "report" ? "add" : "arrow_forward"}</span>}
      </button> : null}
      {splitCanvas ? (
        <button className={styles.mobileBackChip} type="button" onClick={() => isLiveMode ? syncLiveSession({ state: "general-qa" }) : setScreenState("conversation")}>
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
              <button className={styles.submitBtn} type="button" aria-label="Send message" title="Send message" disabled={isLiveMode && (isSending || !roleInput.trim())} onClick={() => isLiveMode ? void submitLiveMessage() : setScreenState("conversation")}>
                <span className={styles.msi} aria-hidden="true">arrow_forward</span>
              </button>
            </div>
          </div>

          <div className={styles.chipsRow}>
            <Chip className={styles.chipItem} disabled={isLiveMode && isSending} icon="upload_file" kind="action" onClick={() => isLiveMode ? void submitLiveMessage("I want to upload a job description for validation.") : setScreenState("conversation")} title="Upload a job description" tone="primary">
              <span className={styles.fullChipLabel}>Upload a job description</span><span className={styles.shortChipLabel} aria-hidden="true">Upload</span>
            </Chip>
            <Chip className={styles.chipItem} disabled={isLiveMode && isSending} icon="content_paste" kind="action" onClick={() => isLiveMode ? void submitLiveMessage("I want to paste job details for validation.") : setScreenState("conversation")} title="Paste job details" tone="primary">
              <span className={styles.fullChipLabel}>Paste job details</span><span className={styles.shortChipLabel} aria-hidden="true">Paste</span>
            </Chip>
            <Chip className={styles.chipItem} disabled={isLiveMode && isSending} icon="travel_explore" kind="action" onClick={() => isLiveMode ? void submitLiveMessage("Explore my experience") : setScreenState("conversation")} title="Explore my experience" tone="primary">
              <span className={styles.fullChipLabel}>Explore my experience</span><span className={styles.shortChipLabel} aria-hidden="true">Explore</span>
            </Chip>
          </div>
        </section>
      ) : (
        <section className={isLiveMode && liveSplitCanvas ? `${styles.agentViewContainer} ${styles.liveSplitWorkspace}` : styles.agentViewContainer} id="role-fit-workspace" aria-label="Role Fit workspace">
          <div className={`${styles.chatPane} ${splitCanvas ? styles.compactHiddenChat : styles.fullWidth}`}>
            <div className={styles.chatHistory}>
              {chatMessages.map((message, index) => (
                <div className={`${styles.chatBubble} ${message.role === "user" ? styles.userBubble : styles.agentBubble}`} key={`${message.role}-${index}`}>
                  {message.content}
                </div>
              ))}
              {isLiveMode && isSending ? (
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
                <button className={styles.submitBtn} type="button" aria-label="Send message" title="Send message" disabled={isLiveMode && (isSending || !roleInput.trim())} onClick={() => isLiveMode ? void submitLiveMessage() : requestReport()}>
                  <span className={styles.msi} aria-hidden="true">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          {splitCanvas ? (
            <aside className={styles.canvasPane} aria-label="Role Fit report canvas">
              {(isLiveMode ? liveSession.state === "generating-report" : screenState === "generating") ? (
                <div className={styles.generatingState} id="role-fit-generating" role={isLiveMode ? "status" : undefined} aria-live={isLiveMode ? "polite" : undefined}>
                  <div className={styles.generatingBars} aria-hidden="true">
                    <div className={styles.genBar} />
                    <div className={styles.genBar} />
                    <div className={styles.genBar} />
                  </div>
                  <p>Analyzing job requirements & matching Evidence Cards...</p>
                </div>
              ) : (isLiveMode ? liveSession.state === "recoverable-error" : screenState === "error") ? (
                <div className={styles.errorState} id="role-fit-error" role={isLiveMode ? "alert" : undefined}>
                  <span className={styles.msi} aria-hidden="true">error</span>
                  <h2>{isLiveMode ? "The live agent needs attention" : "Report could not be generated"}</h2>
                  <p>{apiStatusMessage || (isLiveMode ? "The session is preserved. Please continue in the chat or try again." : "The job description does not include enough role requirements or responsibility context for an evidence-based fit report.")}</p>
                </div>
              ) : isLiveMode ? (
                <LiveReportCanvas
                  liveReportState={{
                    report: liveReportState?.report ?? (liveSession.reportPayload as ReportUIPayload | null) ?? undefined,
                    provider: liveReportState?.provider ?? liveSession.reportProvider,
                    model: liveReportState?.model ?? liveSession.reportModel,
                  }}
                />
              ) : (
                <RoleFitReport fitMode={fitMode} setFitMode={setFitMode} fit={fit} selectedProject={selectedProject} activeProject={activeProject} setActiveProject={setActiveProject} />
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

function RoleFitReport({
  fitMode,
  setFitMode,
  fit,
  selectedProject,
  activeProject,
  setActiveProject,
}: {
  fitMode: FitMode;
  setFitMode: (mode: FitMode) => void;
  fit: (typeof fitModes)[FitMode];
  selectedProject: (typeof evidenceProjects)[number] | null;
  activeProject: number | null;
  setActiveProject: (index: number) => void;
}) {
  const reportToneClass = fitMode === "strong" ? styles.fitStrong : fitMode === "good" ? styles.fitGood : styles.fitPartial;

  return (
    <div className={`${styles.reportShell} ${reportToneClass}`} id="role-fit-report">
      <header className={styles.reportHeader}>
        <div>
          <div className={styles.reportBrand}>
            <div className={styles.avatar}>S</div>
            <h1>Shani Nakash-Gomel - Smart Role Fit</h1>
          </div>
          <p>Smart Role Fit engine linking real job requirements directly to verified portfolio case studies</p>
        </div>

        <div className={styles.fitModeControl} aria-label="Fit mode">
          {(["strong", "good", "partial"] as const).map((mode) => (
            <Chip className={styles.fitButton} key={mode} kind="action" onClick={() => setFitMode(mode)} selected={fitMode === mode} tone={mode === "strong" ? "success" : mode === "good" ? "secondary" : "warning"}>
              {fitModes[mode].badgeText}
            </Chip>
          ))}
        </div>
      </header>

      <div className={styles.reportGrid}>
        <section className={`${styles.bentoCard} ${styles.roleSnapshot}`} id="analyzed-job-profile">
          <div className={styles.snapshotTop}>
            <div>
              <span className={styles.reportEyebrow}>Analyzed Job Profile</span>
              <h2>Senior UX Strategist</h2>
              <p><span className={styles.msi} aria-hidden="true">business</span> Google Cloud Group</p>
            </div>
            <Chip className={styles.fitBadge} kind="info">{fit.badgeText}</Chip>
          </div>
          <p className={styles.fitSummary}>{fit.summary}</p>
          <div className={styles.statsGrid}>
            <Stat icon="speed" label="Estimated Fit Score" value={fit.score} />
            <Stat icon="verified" label="Evidence Coverage" value={fit.matchedRatio} />
            <Stat icon="psychology" label="Core Skills Coverage" value={fit.coreCoverage} />
            <Stat icon="fact_check" label="Evidence Confidence" value={fit.confidence} />
          </div>
        </section>

        <section className={`${styles.bentoCard} ${styles.skillsCard}`} id="skills-match">
          <div className={styles.progressWrap}>
            <svg viewBox="0 0 112 112" aria-hidden="true">
              <circle cx="56" cy="56" r="48" stroke="var(--rf-border)" strokeWidth="8" fill="transparent" />
              <circle className={styles.progressCircle} cx="56" cy="56" r="48" stroke="var(--rf-fit-color)" strokeWidth="8" fill="transparent" strokeDasharray="301.59" strokeDashoffset={fit.skillsOffset} />
            </svg>
            <div>
              <strong>{fit.skillsRatio}</strong>
              <span>Skills Match</span>
            </div>
          </div>
          <h3>Core Matching Skills</h3>
          <div className={styles.skillsList}>
            {fit.skills.map((skill) => <Chip className={styles.skillChip} kind="info" key={skill}>{skill}</Chip>)}
          </div>
        </section>

        <section className={`${styles.bentoCard} ${styles.evidenceSection}`} id="requirements-evidence">
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.reportEyebrow}>Requirements & Evidence Mapping</span>
              <h3>Top 5 Requirements & Responsibilities vs Portfolio Projects</h3>
            </div>
            <Chip className={styles.guidanceChip} icon="touch_app" kind="info">Tap a requirement to see the matching proof</Chip>
          </div>

          <div className={styles.evidenceGrid}>
            <div className={styles.requirementsList}>
              {fit.requirements.map((requirement) => {
                const project = evidenceProjects[requirement.projectIndex];
                const isActive = activeProject === requirement.projectIndex;
                return (
                  <div className={styles.requirementDisclosure} key={requirement.label}>
                    <button className={isActive ? `${styles.requirementItem} ${styles.activeRequirement}` : styles.requirementItem} type="button" aria-expanded={isActive} onClick={() => setActiveProject(requirement.projectIndex)}>
                      <span className={styles.msi} aria-hidden="true">{project.icon}</span>
                      <span>
                        <strong>{requirement.label}</strong>
                        <small>{requirement.detail}</small>
                        <Chip className={styles.matchChip} kind="info" tone={matchTones[requirement.matchType]}>
                          {matchLabels[requirement.matchType]} - {requirement.confidence} confidence
                        </Chip>
                      </span>
                      <span className={styles.msi} aria-hidden="true">{isActive ? "expand_more" : "chevron_right"}</span>
                    </button>
                    {isActive ? (
                      <div className={styles.inlineProjectPanel}>
                        <ProjectEvidencePanel project={project} />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className={styles.projectPanel}>
              {selectedProject ? (
                <ProjectEvidencePanel project={selectedProject} />
              ) : (
                <div className={styles.emptyProjectState}>
                  <div className={styles.skeletonHint}>
                    <span />
                    <span />
                    <span />
                    <span />
                    <div><span className={styles.msi} aria-hidden="true">touch_app</span></div>
                  </div>
                  <p>Pick a requirement to see it in action</p>
                  <small>Its matching case study will show up right here.</small>
                </div>
              )}
            </div>
          </div>
        </section>

        <ListCard id="top-strengths" icon="check_circle" title="Top Strengths" items={fit.strengths} tone="strength" />
        <ListCard id="key-gaps" icon="warning" title="Key Gaps" items={fit.gaps} tone="gap" />

        <section className={styles.ctaSection} id="role-fit-contact">
          <p>This report is generated based on semantic analysis of job requirements and verified candidate evidence.</p>
          <a href="/contact" className={styles.ctaButton}>
            <span className={styles.msi} aria-hidden="true">chat_bubble</span>
            <span>{fit.ctaText}</span>
          </a>
        </section>
      </div>
    </div>
  );
}

function ProjectEvidencePanel({ project }: { project: (typeof evidenceProjects)[number] }) {
  return (
    <div className={styles.projectContent}>
      <div>
        <div className={styles.verifiedLabel}><span className={styles.msi} aria-hidden="true">folder_open</span> Verified Portfolio Evidence</div>
        <h4>{project.title}</h4>
        <p>{project.desc}</p>
        <div className={styles.insightBox}>
          <strong>Strategic Decision Made:</strong>
          <span>{project.insight}</span>
        </div>
      </div>
      <a href={project.link} className={styles.projectLink}>
        <span>Go to Full Portfolio Project</span>
        <span className={styles.msi} aria-hidden="true">arrow_forward</span>
      </a>
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
