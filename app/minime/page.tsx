"use client";

import { Chip } from "@/components/ui/chip";
import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

type RoleFitScreenState = "home" | "conversation" | "missing-details" | "generating" | "error" | "report";
type FitMode = "strong" | "good" | "partial";
type MatchType = "direct" | "semantic" | "transferable" | "partial" | "insufficient";

const screenOptions: { value: RoleFitScreenState; label: string }[] = [
  { value: "home", label: "Initial entry" },
  { value: "conversation", label: "Conversation started" },
  { value: "missing-details", label: "Missing job details" },
  { value: "generating", label: "Generating report" },
  { value: "error", label: "Report generation failed" },
  { value: "report", label: "Fit report" },
];

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
};

const matchTones: Record<MatchType, "success" | "secondary" | "warning"> = {
  direct: "success",
  semantic: "success",
  transferable: "secondary",
  partial: "warning",
  insufficient: "warning",
};

export default function RoleFitPage() {
  const [screenState, setScreenState] = useState<RoleFitScreenState>("home");
  const [fitMode, setFitMode] = useState<FitMode>("strong");
  const [activeProject, setActiveProject] = useState<number | null>(null);
  const [reportRequestCount, setReportRequestCount] = useState(0);
  const fit = fitModes[fitMode];
  const selectedProject = activeProject === null ? null : evidenceProjects[activeProject];
  const reportLimitReached = reportRequestCount >= 2;

  const splitCanvas = screenState === "generating" || screenState === "error" || screenState === "report";
  const hasConversation = screenState !== "home";
  const reportActionLabel = reportLimitReached
    ? "Sorry, that is it for now. You are welcome to contact me."
    : screenState === "report"
      ? "Create a new report"
      : "Generate report";

  useEffect(() => {
    if (screenState !== "generating") return undefined;

    const timeoutId = window.setTimeout(() => {
      setScreenState("report");
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, [screenState]);

  function requestReport() {
    if (reportLimitReached) return;

    setActiveProject(null);
    setReportRequestCount((count) => count + 1);
    setScreenState("generating");
  }

  const chatMessages = useMemo(() => {
    if (screenState === "home") return [];

    const messages = [
      { role: "user", content: "I pasted a Senior UX Strategist role and want to understand the fit." },
      { role: "agent", content: "Received. I am analyzing Shani's documented UX strategy & AI workflow cases against your query." },
    ];

    if (screenState === "missing-details") {
      messages.push({ role: "agent", content: "Please upload a file or paste job details so we can generate a high-quality report." });
    }

    if (screenState === "error") {
      messages.push({ role: "agent", content: "I could not generate a reliable report from the provided input. Please add role requirements, responsibilities, or expected outcomes." });
    }

    return messages;
  }, [screenState]);

  return (
    <main className={styles.roleFitPage}>
      <section className={styles.stateBar} aria-label="Role Fit preview state">
        <select id="role-fit-state" aria-label="Role Fit preview state" value={screenState} onChange={(event) => setScreenState(event.target.value as RoleFitScreenState)}>
          {screenOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </section>

      <button
        className={splitCanvas ? `${styles.stickyReportChip} ${styles.canvasActiveAction}` : styles.stickyReportChip}
        aria-label={reportActionLabel}
        type="button"
        disabled={reportLimitReached}
        title={reportActionLabel}
        onClick={requestReport}
      >
        <span className={styles.msi} aria-hidden="true">{screenState === "report" ? "add" : "arrow_forward"}</span>
      </button>
      {splitCanvas ? (
        <button className={styles.mobileBackChip} type="button" onClick={() => setScreenState("conversation")}>
          <span className={styles.msi} aria-hidden="true">arrow_back</span>
          Back to chat
        </button>
      ) : null}

      {!hasConversation ? (
        <section className={styles.heroSection} id="role-fit-agent" aria-labelledby="role-fit-title">
          <h1 id="role-fit-title">Ask My Agent</h1>
          <p>Ask about my background, test a job description, or explore my case studies.</p>

          <div className={styles.chatBoxContainer}>
            <textarea placeholder="Ask me anything about my experience or choose a starting point to begin the conversation..." aria-label="Role Fit message" />
            <div className={styles.chatBoxToolbar}>
              <button className={styles.iconToolBtn} type="button" title="Upload Job Description" aria-label="Upload Job Description">
                <span className={styles.msi} aria-hidden="true">add</span>
              </button>
              <button className={styles.submitBtn} type="button" onClick={() => setScreenState("conversation")}>
                <span>Send</span>
                <span className={styles.msi} aria-hidden="true">arrow_forward</span>
              </button>
            </div>
          </div>

          <div className={styles.chipsRow}>
            <Chip className={styles.chipItem} icon="upload_file" kind="action" onClick={() => setScreenState("conversation")} tone="primary">
              Upload a job description
            </Chip>
            <Chip className={styles.chipItem} icon="content_paste" kind="action" onClick={() => setScreenState("conversation")} tone="primary">
              Paste job details
            </Chip>
            <Chip className={styles.chipItem} icon="travel_explore" kind="action" onClick={() => setScreenState("conversation")} tone="primary">
              Explore my experience
            </Chip>
          </div>
        </section>
      ) : (
        <section className={styles.agentViewContainer} id="role-fit-workspace" aria-label="Role Fit workspace">
          <div className={`${styles.chatPane} ${splitCanvas ? styles.compactHiddenChat : styles.fullWidth}`}>
            <div className={styles.chatHistory}>
              {chatMessages.map((message, index) => (
                <div className={`${styles.chatBubble} ${message.role === "user" ? styles.userBubble : styles.agentBubble}`} key={`${message.role}-${index}`}>
                  {message.content}
                </div>
              ))}
            </div>

            <div className={styles.chatBoxContainer}>
              <textarea placeholder="Ask a follow-up question..." aria-label="Role Fit follow-up" />
              <div className={styles.chatBoxToolbar}>
                <button className={styles.iconToolBtn} type="button" title="Upload Job Description" aria-label="Upload Job Description">
                  <span className={styles.msi} aria-hidden="true">add</span>
                </button>
                <button className={styles.submitBtn} type="button">
                  <span>Send</span>
                  <span className={styles.msi} aria-hidden="true">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          {splitCanvas ? (
            <aside className={styles.canvasPane} aria-label="Role Fit report canvas">
              {screenState === "generating" ? (
                <div className={styles.generatingState} id="role-fit-generating">
                  <div className={styles.generatingBars} aria-hidden="true">
                    <div className={styles.genBar} />
                    <div className={styles.genBar} />
                    <div className={styles.genBar} />
                  </div>
                  <p>Analyzing job requirements & matching Evidence Cards...</p>
                </div>
              ) : screenState === "error" ? (
                <div className={styles.errorState} id="role-fit-error">
                  <span className={styles.msi} aria-hidden="true">error</span>
                  <h2>Report could not be generated</h2>
                  <p>The job description does not include enough role requirements or responsibility context for an evidence-based fit report.</p>
                </div>
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
          <a href="https://wa.me/972545934509" className={styles.ctaButton}>
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

function ListCard({ id, icon, title, items, tone }: { id: string; icon: string; title: string; items: string[]; tone: "strength" | "gap" }) {
  return (
    <section className={`${styles.bentoCard} ${styles.listCard}`} id={id}>
      <h3 className={tone === "strength" ? styles.strengthTitle : styles.gapTitle}>
        <span className={styles.msi} aria-hidden="true">{icon}</span>
        {title}
      </h3>
      <ul>
        {items.map((item) => (
          <li key={item}>
            <span className={styles.msi} aria-hidden="true">{tone === "strength" ? "check_circle" : "error"}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
