"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ContextFab } from "@/components/site/context-fab";
import { MaterialIcon } from "@/components/ui/material-icon";
import styles from "./page.module.css";

type ToolType = "paper" | "figma" | "mcp" | "codex" | "claude" | "gpt" | "gemini" | "google-ai-studio" | "supabase" | "manus" | "vscode" | "terminal" | "git" | "vercel";

const phases: Array<{
  id: string;
  number: string;
  label: string;
  title: string;
  subtitle: string;
  tools: Array<{ label: string; type: ToolType }>;
}> = [
  {
    id: "product-framing",
    number: "01",
    label: "Product framing",
    title: "Frame the Opportunity",
    subtitle: "Define the real decision problem.",
    tools: [{ label: "Paper", type: "paper" }, { label: "Figma", type: "figma" }, { label: "MCP", type: "mcp" }, { label: "Codex", type: "codex" }],
  },
  {
    id: "experience-design",
    number: "02",
    label: "Experience design",
    title: "Design the Experience",
    subtitle: "Make uncertainty clear and actionable.",
    tools: [{ label: "Codex", type: "codex" }, { label: "Claude", type: "claude" }, { label: "GPT", type: "gpt" }],
  },
  {
    id: "evidence-foundation",
    number: "03",
    label: "Knowledge and retrieval",
    title: "Build the Evidence Foundation",
    subtitle: "Define what the system can trust.",
    tools: [{ label: "Codex", type: "codex" }, { label: "Claude", type: "claude" }, { label: "GPT", type: "gpt" }, { label: "Gemini", type: "gemini" }],
  },
  {
    id: "technical-architecture",
    number: "04",
    label: "System architecture",
    title: "Define the Agent Architecture",
    subtitle: "Separate interpretation from product authority.",
    tools: [{ label: "Google AI Studio", type: "google-ai-studio" }, { label: "Gemini", type: "gemini" }, { label: "Supabase", type: "supabase" }],
  },
  {
    id: "product-implementation",
    number: "05",
    label: "Product implementation",
    title: "Implement the Product",
    subtitle: "Protect design intent through delivery.",
    tools: [{ label: "Figma", type: "figma" }, { label: "MCP", type: "mcp" }, { label: "Codex", type: "codex" }, { label: "Manus", type: "manus" }, { label: "VS Code", type: "vscode" }, { label: "Terminal", type: "terminal" }, { label: "Git", type: "git" }, { label: "Vercel", type: "vercel" }, { label: "Supabase", type: "supabase" }],
  },
  {
    id: "validation-and-scale",
    number: "06",
    label: "Quality and scale",
    title: "Validate, Iterate, and Scale",
    subtitle: "Design safe failure and measured growth.",
    tools: [{ label: "Terminal", type: "terminal" }, { label: "Git", type: "git" }, { label: "Vercel", type: "vercel" }, { label: "Google AI Studio", type: "google-ai-studio" }, { label: "Gemini", type: "gemini" }],
  },
];

function ToolGlyph({ type }: { type: ToolType }) {
  if (type === "claude" || type === "gpt" || type === "supabase" || type === "manus" || type === "vscode") {
    const mark = { claude: "C", gpt: "GPT", supabase: "S", manus: "M", vscode: "VS" }[type];
    return <span className={styles.toolMark} aria-hidden="true">{mark}</span>;
  }

  if (type === "figma") {
    return <svg aria-hidden="true" className={styles.toolSvg} viewBox="0 0 24 24"><circle cx="14.5" cy="5" r="3" fill="currentColor" opacity=".82" /><circle cx="14.5" cy="12" r="3" fill="currentColor" opacity=".62" /><path d="M6.5 2h5v6h-2a3 3 0 0 1-3-3V2Zm0 7h5v6h-2a3 3 0 0 1-3-3V9Zm0 7h5v2.5a3 3 0 1 1-5 0V16Z" fill="currentColor" /></svg>;
  }

  if (type === "git") {
    return <svg aria-hidden="true" className={styles.toolSvg} viewBox="0 0 24 24"><circle cx="7" cy="5" r="2" fill="none" stroke="currentColor" strokeWidth="1.7" /><circle cx="17" cy="8" r="2" fill="none" stroke="currentColor" strokeWidth="1.7" /><circle cx="7" cy="19" r="2" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M7 7v10M9 11c5 0 8-1 8-3" fill="none" stroke="currentColor" strokeWidth="1.7" /></svg>;
  }

  if (type === "vercel") {
    return <svg aria-hidden="true" className={styles.toolSvg} viewBox="0 0 24 24"><path d="m12 4 9 16H3L12 4Z" fill="currentColor" /></svg>;
  }

  const icon = { paper: "description", mcp: "hub", codex: "code", gemini: "auto_awesome", "google-ai-studio": "auto_awesome", terminal: "terminal" }[type];
  return <MaterialIcon name={icon} />;
}

function ToolChip({ label, type }: { label: string; type: ToolType }) {
  return <span className={styles.toolChip}><ToolGlyph type={type} />{label}</span>;
}

function PracticeList({ children }: { children: string[] }) {
  return <ul className={styles.practiceList}>{children.map((item) => <li key={item}>{item}</li>)}</ul>;
}

function PhaseVisual({ id }: { id: string }) {
  if (id === "product-framing") {
    return <div className={`${styles.artifactCanvas} ${styles.frameFlow}`} aria-label="Hiring friction to trusted journey flow">
      <div className={styles.visualNode}><strong>Hiring friction</strong><small>Relevance stayed hidden.</small></div>
      <div className={`${styles.visualNode} ${styles.accent}`}><strong>Product boundary</strong><small>Evidence before persuasion.</small></div>
      <div className={`${styles.visualNode} ${styles.success}`}><strong>Trusted journey</strong><small>Analysis supports decisions.</small></div>
    </div>;
  }

  if (id === "evidence-foundation") {
    return <div className={`${styles.artifactCanvas} ${styles.evidenceFlow}`} aria-label="Approved evidence flow">
      <div className={styles.visualNode}><strong>Approved sources</strong><small>CV · Profile · Projects</small></div>
      <span className={styles.flowArrow}>→</span>
      <div className={`${styles.visualNode} ${styles.accent}`}><strong>Evidence reference</strong><small>Stable ID and context</small></div>
      <span className={styles.flowArrow}>→</span>
      <div className={`${styles.visualNode} ${styles.success}`}><strong>Report claim</strong><small>Verified destination</small></div>
    </div>;
  }

  if (id === "technical-architecture") {
    return <div className={`${styles.artifactCanvas} ${styles.runtimeStack}`} aria-label="RoleFit technical architecture">
      <div className={styles.runtimeTop}>
        <div className={styles.visualNode}><strong>Portfolio UI</strong><small>Chat · Report · Links</small></div>
        <div className={`${styles.visualNode} ${styles.accent}`}><strong>Portfolio Agent</strong><small>Intent · Context · Continuity</small></div>
        <div className={styles.visualNode}><strong>Session State</strong><small>Limits · Retries · Approval</small></div>
      </div>
      <div className={styles.runtimeModes}>
        <div className={styles.visualNode}><strong>Role Understanding</strong></div>
        <div className={`${styles.visualNode} ${styles.success}`}><strong>Fit Analysis</strong></div>
        <div className={styles.visualNode}><strong>Report Follow-up</strong></div>
      </div>
      <div className={styles.runtimeAuthority}><strong>Deterministic Orchestration</strong><span>Validation · Eligibility · Retrieval · Safety · Publication</span></div>
    </div>;
  }

  if (id === "product-implementation") {
    return <figure className={styles.reportProof} id="report-preview"><Image alt="Evidence-backed RoleFit report interface." fill sizes="(max-width: 48rem) 100vw, 50vw" src="/assets/case-studies/role-fit-agent/report.png" /></figure>;
  }

  if (id === "validation-and-scale") {
    return <div className={`${styles.artifactCanvas} ${styles.validationFlow}`} aria-label="Validation outcomes">
      <div className={styles.validationCase}><span>● Recover</span><strong>Incomplete role requests one useful detail.</strong></div>
      <div className={styles.validationCase}><span>● Block</span><strong>Weak evidence prevents report publication.</strong></div>
      <div className={styles.validationCase}><span>● Protect</span><strong>Raw role content never enters logs.</strong></div>
    </div>;
  }

  return null;
}

function PhaseContent({ id }: { id: string }) {
  const content = {
    "product-framing": { heading: "Persuasion was not the missing value.", points: ["Framed my portfolio’s target audience.", "Mapped recruiter context and decision pressure.", "Separated user value from AI novelty.", "Scoped one trusted review journey."] },
    "experience-design": { heading: "Conversation states were product states.", points: ["Mapped exploration, intake, and report paths.", "Planned normal, uncertain, and failed states.", "Required validation before report generation.", "Preserved context across evidence navigation."] },
    "evidence-foundation": { heading: "Retrieval quality begins with content governance.", points: ["Mapped CV, profile, and case studies.", "Created one approved evidence hierarchy.", "Connected sources to stable portfolio anchors.", "Required proof for every positive conclusion."] },
    "technical-architecture": { heading: "Simple experiences need governed complexity.", points: ["Separated model reasoning from system authority.", "Kept API keys outside frontend code.", "Protected secrets through server-side environments.", "Kept model providers replaceable."] },
    "product-implementation": { heading: "Tools needed one controlled execution chain.", points: ["Reused design tokens and interface patterns.", "Connected approved design context to code.", "Integrated models behind controlled endpoints.", "Verified responsive behavior before deployment."] },
    "validation-and-scale": { heading: "Quality meant reliable recovery behavior.", points: ["Tested incomplete and incorrect role inputs.", "Tested injection, timeout, and retrieval failures.", "Protected secrets during deployment checks.", "Kept model scaling modular and deliberate."] },
  }[id];

  if (!content) return null;

  const visualIds = new Set(["product-framing", "evidence-foundation", "technical-architecture", "product-implementation", "validation-and-scale"]);
  return <div className={`${styles.phaseDetail} ${visualIds.has(id) ? "" : styles.single}`}>
    <div className={styles.practice}><span className={styles.contentLabel}>Insight</span><h4>{content.heading}</h4><PracticeList>{content.points}</PracticeList></div>
    {visualIds.has(id) ? <div className={styles.artifact}>{PhaseVisual({ id })}</div> : null}
  </div>;
}

function ReportReturnFab() {
  const searchParams = useSearchParams();
  const hasReportSource = searchParams.get("source") === "role-fit-report";

  return hasReportSource ? <ContextFab href="/minime" label="Report" ariaLabel="Back to report" icon="arrow_back" placement="top" variant="report-return" /> : null;
}

export default function RoleFitAgentCaseStudyPage() {
  useEffect(() => {
    const openAnchoredDrawer = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      window.requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
    };

    openAnchoredDrawer();
    const firstFrame = window.requestAnimationFrame(openAnchoredDrawer);
    const hydrationTimer = window.setTimeout(openAnchoredDrawer, 120);
    window.addEventListener("hashchange", openAnchoredDrawer);
    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.clearTimeout(hydrationTimer);
      window.removeEventListener("hashchange", openAnchoredDrawer);
    };
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = document.querySelectorAll<HTMLElement>(`.${styles.reveal}`);
    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add(styles.revealed));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add(styles.revealed);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -8% 0px" });
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <main className={styles.page} id="top">
      <section className={`${styles.section} ${styles.hero}`} id="overview" aria-labelledby="hero-title">
        <Image className={styles.heroBackground} alt="" aria-hidden="true" fill priority sizes="100vw" src="/assets/project-role-fit-agent.png" />
        <div className={`${styles.wrap} ${styles.heroGrid}`}>
          <div className={`${styles.heroCopy} ${styles.reveal}`}>
            <p className={styles.eyebrow}><MaterialIcon name="auto_awesome" />AI Product Case Study</p>
            <p className={styles.heroProblem}>A portfolio shows the work.<br />It rarely explains the fit.</p>
            <h1 className={styles.display} id="hero-title">RoleFit makes <span>the fit inspectable.</span></h1>
            <p className={styles.heroSubtitle}>An evidence-grounded agent for role-specific portfolio evaluation.</p>
            <div className={styles.roleList} aria-label="Project roles">
              <span>Lead UX Strategist</span><span>AI Product Architect</span><span>Conversation Designer</span><span>Product Builder</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="opportunity" aria-labelledby="opportunity-title">
        <div className={`${styles.wrap} ${styles.problemLayout}`}>
          <div className={styles.reveal}><p className={styles.eyebrow}><MaterialIcon name="hub" />The Opportunity</p><h2 className={styles.sectionTitle} id="opportunity-title">A portfolio can show the work. It rarely explains the fit.</h2></div>
          <div className={`${styles.problemCopy} ${styles.reveal}`}><p>Recruiters and design leaders must scan multiple projects, interpret unfamiliar domains, infer transferable capabilities and decide which evidence matters. The opportunity was not to build another résumé chatbot. It was to create a decision-support experience that could answer one practical question:</p><blockquote>What can this candidate bring to this role—and what evidence supports that conclusion?</blockquote></div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.productSection}`} id="product-story" aria-labelledby="product-title">
        <div className={styles.wrap}>
          <div className={`${styles.productIntro} ${styles.reveal}`}><p className={styles.eyebrow}><MaterialIcon name="account_tree" />The Product</p><h2 className={styles.sectionTitle} id="product-title">One product.<span>Three connected solutions.</span></h2><p className={styles.sectionSubtitle}>Each layer resolves a different trust problem.</p><p className={styles.productBody}>RoleFit turns portfolio exploration into evidence-backed role review.</p></div>
          <div className={styles.layers}>
            <article className={`${styles.layer} ${styles.reveal}`} id="role-agent"><span className={styles.layerIcon}><MaterialIcon name="auto_awesome" /></span><p>Role Agent</p><h3>Understand the role first.</h3><div>The agent validates context before analysis. RAG retrieves only approved portfolio knowledge.</div></article>
            <article className={`${styles.layer} ${styles.reveal}`} id="fit-report"><span className={styles.layerIcon}><MaterialIcon name="map" /></span><p>Fit Report</p><h3>Explain professional relevance.</h3><div>The report maps role requirements to capabilities. It avoids misleading numeric scores.</div></article>
            <article className={`${styles.layer} ${styles.reveal}`} id="evidence-layer"><span className={styles.layerIcon}><MaterialIcon name="fact_check" /></span><p>Evidence Layer</p><h3>Make every claim inspectable.</h3><div>Conclusions link to exact portfolio evidence. Navigation preserves the reviewer’s context.</div></article>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.processSection}`} id="build-journey" aria-labelledby="process-title">
        <div className={styles.wrap}>
          <div className={`${styles.processHeading} ${styles.reveal}`}><div><p className={styles.eyebrow}><MaterialIcon name="route" />The Process</p><h2 className={styles.sectionTitle} id="process-title">From hiring friction to a governed AI product.</h2></div><p className={styles.sectionSubtitle}>Each stage resolved a different product risk.</p></div>
          <div className={styles.phaseList}>
            {phases.map((phase) => <details className={`${styles.phase} ${styles.reveal}`} id={phase.id} key={phase.id} open={phase.id === "technical-architecture"}>
              <summary id={phase.id === "product-framing" ? "mvp-scope" : undefined}>
                <span className={styles.phaseNumber}>{phase.number}</span>
                <span className={styles.phaseTitle}><small>{phase.label}</small><h3>{phase.title}</h3><p>{phase.subtitle}</p></span>
                <span className={styles.summaryTools} aria-label="Tools used">{phase.tools.map((tool) => <ToolChip key={tool.label} {...tool} />)}</span>
                <span className={styles.phaseAction} aria-hidden="true"><MaterialIcon name="add" /></span>
              </summary>
              <div className={styles.phasePanel}><PhaseContent id={phase.id} /></div>
            </details>)}
          </div>
          <div className={`${styles.decisionEvolution} ${styles.reveal}`} id="decision-evolution">
            <p className={styles.eyebrow}><MaterialIcon name="route" />Decision Evolution</p><h3>The product improved through clarified boundaries.</h3>
            <div className={styles.decisionRows}>
              <div><strong>Agent structure</strong><span>Several visible agents</span><MaterialIcon name="arrow_forward" /><span>One agent with governed modes</span></div>
              <div><strong>Fit output</strong><span>Numeric compatibility score</span><MaterialIcon name="arrow_forward" /><span>Qualitative evidence-backed report</span></div>
              <div><strong>System authority</strong><span>Model controls workflow</span><MaterialIcon name="arrow_forward" /><span>Application controls deterministic rules</span></div>
              <div><strong>Evidence strategy</strong><span>Broad portfolio summaries</span><MaterialIcon name="arrow_forward" /><span>Approved evidence with stable anchors</span></div>
              <div><strong>Role storage</strong><span>Persist raw role descriptions</span><MaterialIcon name="arrow_forward" /><span>Retain minimal derived structures</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.outcomeSection}`} id="behind-the-build" aria-labelledby="outcome-title">
        <div className={styles.wrap}>
          <div className={styles.outcomeGrid}>
            <div className={styles.reveal}><p className={styles.eyebrow}><MaterialIcon name="check_circle" />What This Work Proved</p><h2 className={styles.sectionTitle} id="outcome-title">A portfolio became an inspectable decision system.</h2><p className={styles.sectionSubtitle}>RoleFit connects interpretation, evidence, and human judgment.</p></div>
            <div className={`${styles.outcomePoints} ${styles.reveal}`}>
              <article><MaterialIcon name="check_circle" /><div><strong>Product judgment shaped the scope.</strong><span>The product started from recruiter friction.</span></div></article>
              <article><MaterialIcon name="check_circle" /><div><strong>UX shaped agent behavior.</strong><span>Language, states, and recovery stayed intentional.</span></div></article>
              <article><MaterialIcon name="check_circle" /><div><strong>Evidence constrained generation.</strong><span>Every positive conclusion required approved proof.</span></div></article>
              <article><MaterialIcon name="check_circle" /><div><strong>Architecture enabled measured scale.</strong><span>Logical separation avoided premature deployment complexity.</span></div></article>
            </div>
          </div>
          <div className={`${styles.ctaPanel} ${styles.reveal}`} id="live-experience"><div><h3>Explore RoleFit</h3><p>Submit a role. Inspect the evidence. Continue the conversation.</p><div className={styles.buildMetrics} aria-label="Behind the Build metrics"><article><strong>1</strong><span>Unified user-facing agent</span></article><article><strong>3</strong><span>Internal task modes</span></article><article><strong>5+</strong><span>Structured knowledge sources</span></article><article><strong>14+</strong><span>Architecture and build documents</span></article><article><strong>4</strong><span>Working days for the MVP package</span></article></div></div><Link className={styles.button} href="/minime">Launch the agent <MaterialIcon name="arrow_forward" /></Link></div>
        </div>
      </section>

      <Suspense fallback={null}>
        <ReportReturnFab />
      </Suspense>
      <ContextFab href="/design-system" label="Next Case Study" icon="arrow_forward" />
    </main>
  );
}
