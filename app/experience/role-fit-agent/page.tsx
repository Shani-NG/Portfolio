import Image from "next/image";
import Link from "next/link";
import { MaterialIcon } from "@/components/ui/material-icon";
import styles from "./page.module.css";

const sections = [
  { id: "opportunity", label: "Opportunity" },
  { id: "build-journey", label: "Build Journey" },
  { id: "product-story", label: "Product Story" },
  { id: "technical-architecture", label: "Architecture" },
  { id: "decision-evolution", label: "Decisions" },
  { id: "mvp-scope", label: "MVP Scope" },
  { id: "behind-the-build", label: "Behind the Build" },
] as const;

const journey = [
  {
    number: "01",
    title: "Foundation & Source of Truth",
    items: [
      "Mapped CV, portfolio, project files and evolving PRDs.",
      "Created a repeatable skill for case-study storytelling and content generation.",
      "Resolved conflicts and established a canonical source-of-truth hierarchy.",
    ],
  },
  {
    number: "02",
    title: "Experience & Visual System",
    items: [
      "Started with paper thinking, content grouping and page-level story architecture.",
      "Built the design system, visual references, motion language and reusable patterns.",
      "Created a dedicated design-system page to document tokens and component behavior.",
    ],
  },
  {
    number: "03",
    title: "Product Engineering",
    items: [
      "Connected Figma MCP and used Codex to translate approved design logic into code.",
      "Set up Git-based versioning and a Vercel deployment path.",
      "Validated usability, responsive behavior and design-system consistency before adding AI.",
    ],
  },
  {
    number: "04",
    title: "AI Architecture",
    items: [
      "Defined one user-facing portfolio agent with three internal task modes.",
      "Separated model interpretation from deterministic application control.",
      "Mapped retrieval, validation, report composition, persistence and logging responsibilities.",
    ],
  },
  {
    number: "05",
    title: "Evidence & Report Logic",
    items: [
      "Structured approved CV, profile and case-study knowledge sources.",
      "Connected conclusions to exact portfolio evidence and stable section anchors.",
      "Distinguished demonstrated strengths, transferable capabilities, unknowns and real gaps.",
    ],
  },
  {
    number: "06",
    title: "Implementation & Validation",
    items: [
      "Designed QA scenarios for invalid inputs, injection, timeouts, weak evidence and session limits.",
      "Defined logging, privacy-aware persistence and a human-reviewed learning loop.",
      "Locked the MVP, implementation sequence, fallback plan and scalability path.",
    ],
  },
] as const;

const architectureNodes = [
  {
    type: "External Actor",
    title: "Visitor",
    copy: "Explore · Submit role · Review · Follow up",
    tone: "pink",
  },
  {
    type: "Frontend",
    title: "Portfolio UI",
    copy: "Chat · Report · Evidence links · Contact CTA",
    tone: "neutral",
  },
  {
    type: "Conversation Router",
    title: "Portfolio Agent",
    copy: "Intent routing · Active context · Continuity",
    tone: "pink",
  },
  {
    type: "Application State",
    title: "Session State",
    copy: "Report count · Retries · Confirmation · Timeout",
    tone: "neutral",
  },
  {
    type: "Task Mode 01",
    title: "Role Understanding",
    copy: "Validate · Extract · Structure",
    tone: "pink",
  },
  {
    type: "Task Mode 02",
    title: "Fit Analysis",
    copy: "Retrieve · Match · Classify",
    tone: "green",
  },
  {
    type: "Task Mode 03",
    title: "Report Follow-up",
    copy: "Explain · Clarify · Link evidence",
    tone: "pink",
  },
  {
    type: "Structured Output",
    title: "Report Composer",
    copy: "Validated report JSON",
    tone: "neutral",
  },
] as const;

const services = [
  {
    type: "RAG Sources",
    title: "Knowledge Base",
    copy: "CV · Profile · Case studies · Evidence index",
    tone: "pink",
  },
  {
    type: "Evidence Service",
    title: "Retrieval Layer",
    copy: "Semantic match · Source priority",
    tone: "green",
  },
  {
    type: "Storage",
    title: "Persistence",
    copy: "Reports · Leads · Session metadata",
    tone: "neutral",
  },
  {
    type: "Observability",
    title: "Logging & QA",
    copy: "Events · Failures · Human review",
    tone: "neutral",
  },
] as const;

const decisions = [
  {
    decision: "Agent structure",
    initial: "Several visible agents for different tasks.",
    final:
      "One unified user-facing agent with three governed internal task modes.",
  },
  {
    decision: "Role-fit output",
    initial: "A numeric compatibility score.",
    final:
      "A qualitative report that separates demonstrated strengths, transferable capabilities, unknowns and genuine gaps.",
  },
  {
    decision: "System authority",
    initial: "The model controls the full workflow.",
    final:
      "The application controls validation, eligibility, limits, persistence, safety and publication.",
  },
  {
    decision: "Evidence strategy",
    initial: "General answers based on portfolio text.",
    final:
      "Every important conclusion links to approved evidence and a stable case-study anchor.",
  },
  {
    decision: "Stored role information",
    initial: "Persist the original job description.",
    final:
      "Do not store raw job-description text; retain only approved derived analysis and structured report data.",
  },
] as const;

const metrics = [
  ["1", "Unified user-facing agent"],
  ["3", "Internal task modes"],
  ["5+", "Structured knowledge sources"],
  ["14+", "Architecture and build documents"],
  ["4", "Working days for the MVP package"],
] as const;

export default function RoleFitAgentCaseStudyPage() {
  return (
    <main className={styles.page}>
      <section
        id="overview"
        className={`${styles.section} ${styles.hero}`}
        aria-labelledby="role-fit-agent-title"
      >
        <div className={`${styles.wrap} ${styles.heroGrid}`}>
          <div>
            <p className={styles.eyebrow}>
              <MaterialIcon name="auto_awesome" />
              AI Product Case Study
            </p>

            <h1 id="role-fit-agent-title" className={styles.display}>
              Role Fit <span>Agent</span>
            </h1>

            <p className={styles.lede}>
              I designed, built and operationalized an evidence-based AI
              portfolio experience that turns static work into a transparent
              professional conversation.
            </p>

            <div className={styles.heroMeta} aria-label="Project roles">
              <span>Lead UX Strategist</span>
              <span>AI Product Architect</span>
              <span>Conversation Designer</span>
              <span>4-Day MVP</span>
            </div>
          </div>

          <figure className={styles.heroVisual}>
            <div className={styles.reportVisual}>
              <Image
                alt="Evidence-based Role Fit report interface"
                fill
                priority
                sizes="(max-width: 64rem) 100vw, 48vw"
                src="/assets/case-studies/role-fit-agent/report.png"
              />
            </div>
            <figcaption>
              Evidence-based role-fit report interface.
            </figcaption>
          </figure>
        </div>
      </section>

      <nav className={styles.anchorNav} aria-label="Case study sections">
        <div className={styles.wrap}>
          {sections.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.label}
            </a>
          ))}
        </div>
      </nav>

      <section
        id="opportunity"
        className={styles.section}
        aria-labelledby="opportunity-title"
      >
        <div className={`${styles.wrap} ${styles.split}`}>
          <div>
            <p className={styles.eyebrow}>
              <MaterialIcon name="visibility" />
              The Opportunity
            </p>
            <h2 id="opportunity-title" className={styles.sectionTitle}>
              A portfolio can show the work. It rarely explains the fit.
            </h2>
          </div>

          <div>
            <p className={styles.bodyCopy}>
              Recruiters and design leaders must scan multiple projects,
              interpret unfamiliar domains, infer transferable capabilities and
              decide which evidence matters. The opportunity was not to build
              another résumé chatbot. It was to create a decision-support
              experience that could answer one practical question:
            </p>

            <blockquote className={styles.quote}>
              What can this candidate bring to this role—and what evidence
              supports that conclusion?
            </blockquote>
          </div>
        </div>
      </section>

      <section
        id="build-journey"
        className={styles.section}
        aria-labelledby="build-journey-title"
      >
        <div className={styles.wrap}>
          <p className={styles.eyebrow}>
            <MaterialIcon name="route" />
            The Build Journey
          </p>

          <h2 id="build-journey-title" className={styles.sectionTitle}>
            Six layers turned one idea into a working AI product.
          </h2>

          <p className={styles.lede}>
            The project was not a linear website build. It was a system of
            connected decisions across content, experience, engineering,
            knowledge and AI runtime design.
          </p>

          <div className={styles.journey}>
            {journey.map((phase, index) => (
              <details key={phase.number} open={index === 0}>
                <summary>
                  <span className={styles.phaseNumber}>{phase.number}</span>
                  <span>{phase.title}</span>
                  <MaterialIcon name="add" />
                </summary>

                <div className={styles.phaseBody}>
                  {phase.items.map((item) => (
                    <div className={styles.check} key={item}>
                      <MaterialIcon name="check_circle" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section
        id="product-story"
        className={styles.section}
        aria-labelledby="product-story-title"
      >
        <div className={styles.wrap}>
          <p className={styles.eyebrow}>
            <MaterialIcon name="conversion_path" />
            Product Story
          </p>

          <h2 id="product-story-title" className={styles.sectionTitle}>
            One continuous path—from curiosity to evidence.
          </h2>

          <p className={styles.productStory}>
            The experience begins with open{" "}
            <strong>portfolio exploration</strong>, allowing visitors to browse
            the work or ask questions without committing to a structured flow.
            When a role becomes relevant, they can{" "}
            <strong>submit a job description</strong> by pasting or uploading
            it. The system then <strong>validates the input</strong> and
            presents a concise role snapshot for confirmation before any
            judgment is made. Once approved, it{" "}
            <strong>analyzes the role against verified portfolio evidence</strong>{" "}
            and generates a qualitative report that distinguishes strengths,
            transferable capabilities, unknowns and genuine gaps. The visitor
            can then <strong>continue the conversation</strong>, inspect the
            supporting case studies and move naturally toward contact.
          </p>
        </div>
      </section>

      <section
  id="technical-architecture"
  className={styles.section}
  aria-labelledby="technical-architecture-title"
>
  <div className={styles.wrap}>
    <header className={styles.architectureHeader}>
      <div>
        <p className={styles.eyebrow}>
          <MaterialIcon name="account_tree" />
          Technical System Architecture
        </p>

        <h2
          id="technical-architecture-title"
          className={styles.sectionTitle}
        >
          One agent. Three task modes. Deterministic control.
        </h2>
      </div>

      <p className={styles.bodyCopy}>
        A single conversational experience is supported by governed task
        modes, structured evidence retrieval, runtime controls and persistent
        system services.
      </p>
    </header>

    <div
      className={styles.diagram}
      aria-label="Role Fit Agent technical architecture"
    >
      <div className={styles.diagramInner}>
        <span className={`${styles.diagramLayerLabel} ${styles.layerExperience}`}>
          Experience
        </span>
        <span className={`${styles.diagramLayerLabel} ${styles.layerConversation}`}>
          Conversation
        </span>
        <span className={`${styles.diagramLayerLabel} ${styles.layerModes}`}>
          Task Modes
        </span>
        <span className={`${styles.diagramLayerLabel} ${styles.layerRuntime}`}>
          Runtime Control
        </span>
        <span className={`${styles.diagramLayerLabel} ${styles.layerServices}`}>
          System Services
        </span>

        <svg
          className={styles.connectors}
          viewBox="0 0 1160 736"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
<path
  className={styles.agentConnector}
  d="M580 135 L580 153"
/>

<path
  className={styles.appConnector}
  d="M395 205 L468 205"
/>

<path
  className={styles.appConnector}
  d="M690 205 L812 205"
/>

<path
  className={styles.agentConnector}
  d="M580 257 L580 290 L255 290 L255 313"
/>

<path
  className={styles.evidenceConnector}
  d="M580 257 L580 290 L464 290 L464 313"
/>

<path
  className={styles.agentConnector}
  d="M580 257 L580 290 L742 290 L742 313"
/>

<path
  className={styles.appConnector}
  d="M860 365 L874 365"
/>

<path
  className={styles.agentConnector}
  d="M255 417 L255 470 L505 470 L505 500"
/>

<path
  className={styles.evidenceConnector}
  d="M464 417 L464 470 L540 470 L540 500"
/>

<path
  className={styles.agentConnector}
  d="M742 417 L742 470 L655 470 L655 500"
/>

<path
  className={styles.appConnector}
  d="M992 417 L992 470 L690 470 L690 500"
/>

<path
  className={styles.agentConnector}
  d="M505 630 L505 646 L255 646 L255 653"
/>

<path
  className={styles.evidenceConnector}
  d="M540 630 L540 646 L464 646 L464 653"
/>

<path
  className={styles.appConnector}
  d="M620 630 L620 646 L742 646 L742 653"
/>

<path
  className={styles.appConnector}
  d="M655 630 L655 646 L992 646 L992 653"
/>

        </svg>

        <article
  className={`${styles.diagramNode} ${styles.visitorNode} ${styles.pinkNode}`}
  data-tooltip="External Actor — Explore · Submit role · Review · Follow up"
  tabIndex={0}
>
  <h3>Visitor</h3>
</article>

       <article
  className={`${styles.diagramNode} ${styles.uiNode} ${styles.neutralNode}`}
  data-tooltip="Frontend — Chat · Report · Evidence links · Contact CTA"
  tabIndex={0}
>
  <h3>Portfolio UI</h3>
</article>

        <article
  className={`${styles.diagramNode} ${styles.agentNode} ${styles.pinkNode}`}
  data-tooltip="Conversation Router — Intent routing · Active context · Continuity"
  tabIndex={0}
>
  <h3>Portfolio Agent</h3>
</article>

       <article
  className={`${styles.diagramNode} ${styles.sessionNode} ${styles.neutralNode}`}
  data-tooltip="Application State — Report count · Retries · Confirmation · Timeout"
  tabIndex={0}
>
  <h3>Session State</h3>
</article>
<article
  className={`${styles.diagramNode} ${styles.roleNode} ${styles.pinkNode}`}
  data-tooltip="Task Mode 01 — Validate · Extract · Structure"
  tabIndex={0}
>
  <h3>Role Understanding</h3>
</article>

   <article
  className={`${styles.diagramNode} ${styles.fitNode} ${styles.greenNode}`}
  data-tooltip="Task Mode 02 — Retrieve · Match · Classify"
  tabIndex={0}
>
  <h3>Fit Analysis</h3>
</article>

<article
  className={`${styles.diagramNode} ${styles.followNode} ${styles.pinkNode}`}
  data-tooltip="Task Mode 03 — Explain · Clarify · Link evidence"
  tabIndex={0}
>
  <h3>Report Follow-up</h3>
</article>

<article
  className={`${styles.diagramNode} ${styles.reportNode} ${styles.neutralNode}`}
  data-tooltip="Structured Output — Validated JSON"
  tabIndex={0}
>
  <h3>Report Composer</h3>
</article>

<article className={`${styles.diagramNode} ${styles.orchestratorNode}`}>
  <span>Application Authority</span>
  <h3>Deterministic Orchestration Layer</h3>

  <div className={styles.runtimeGrid}>
    <span>Validation</span>
    <span>Eligibility</span>
    <span>Retrieval</span>
    <span>Limits</span>
    <span>Safety</span>
    <span>Publication</span>
  </div>
</article>

<article
  className={`${styles.diagramNode} ${styles.knowledgeNode} ${styles.pinkNode}`}
  data-tooltip="RAG Sources — CV · Profile · Case studies · Evidence index"
  tabIndex={0}
>
  <h3>Knowledge Base</h3>
</article>

<article
  className={`${styles.diagramNode} ${styles.retrievalNode} ${styles.greenNode}`}
  data-tooltip="Evidence Service — Semantic match · Source priority"
  tabIndex={0}
>
  <h3>Retrieval Layer</h3>
</article>

<article
  className={`${styles.diagramNode} ${styles.storageNode} ${styles.neutralNode}`}
  data-tooltip="Storage — Reports · Leads · Session metadata"
  tabIndex={0}
>
  <h3>Persistence</h3>
</article>

<article
  className={`${styles.diagramNode} ${styles.loggingNode} ${styles.neutralNode}`}
  data-tooltip="Observability — Events · Failures · Human review"
  tabIndex={0}
>
  <h3>Logging &amp; QA</h3>
</article>      </div>
    </div>

    <div className={styles.diagramLegend} aria-label="Diagram legend">
      <span>
        <i className={styles.agentLegend} />
        Agent flow
      </span>
      <span>
        <i className={styles.evidenceLegend} />
        Evidence flow
      </span>
      <span>
        <i className={styles.appLegend} />
        Application flow
      </span>
    </div>

    <p className={styles.diagramNote}>
      <strong>
        The model interprets and synthesizes; the application remains
        authoritative.
      </strong>{" "}
      Workflow, eligibility, limits, persistence and publication are
      controlled outside the model.
    </p>
  </div>
</section>
      <section
        id="decision-evolution"
        className={styles.section}
        aria-labelledby="decision-evolution-title"
      >
        <div className={styles.wrap}>
          <p className={styles.eyebrow}>
            <MaterialIcon name="compare_arrows" />
            Decision Evolution
          </p>

          <h2 id="decision-evolution-title" className={styles.sectionTitle}>
            The product became stronger when the system boundaries became
            clearer.
          </h2>

          <div className={styles.decisionTableWrap}>
            <table className={styles.decisionTable}>
              <thead>
                <tr>
                  <th>Design Decision</th>
                  <th>Initial Direction</th>
                  <th>Final Product Decision</th>
                </tr>
              </thead>
              <tbody>
                {decisions.map((item) => (
                  <tr key={item.decision}>
                    <td>{item.decision}</td>
                    <td>{item.initial}</td>
                    <td>{item.final}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section
        id="mvp-scope"
        className={styles.section}
        aria-labelledby="mvp-scope-title"
      >
        <div className={styles.wrap}>
          <p className={styles.eyebrow}>
            <MaterialIcon name="deployed_code" />
            MVP Scope
          </p>

          <h2 id="mvp-scope-title" className={styles.sectionTitle}>
            A complete product story—without over-engineering the first
            implementation.
          </h2>

          <div className={styles.scopeGrid}>
            <article className={styles.card}>
              <MaterialIcon name="check_circle" />
              <h3>Must Have</h3>
              <p>
                Portfolio exploration, agent conversation, role validation,
                qualitative report, evidence links, follow-up and contact CTA.
              </p>
            </article>

            <article className={styles.card}>
              <MaterialIcon name="add_circle" />
              <h3>Should Have</h3>
              <p>
                Structured report persistence, session continuity, lightweight
                logging and browser-based export.
              </p>
            </article>

            <article className={styles.card}>
              <MaterialIcon name="schedule" />
              <h3>Deferred</h3>
              <p>
                Recruiter accounts, autonomous learning, complex ranking, CRM
                automation and enterprise permissions.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section
        id="behind-the-build"
        className={styles.section}
        aria-labelledby="behind-the-build-title"
      >
        <div className={styles.wrap}>
          <p className={styles.eyebrow}>
            <MaterialIcon name="analytics" />
            Behind the Build
          </p>

          <h2 id="behind-the-build-title" className={styles.sectionTitle}>
            A complete AI product package—not a chatbot prototype.
          </h2>

          <div className={styles.metrics}>
            {metrics.map(([value, label]) => (
              <article className={styles.metric} key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="live-experience"
        className={styles.section}
        aria-labelledby="live-experience-title"
      >
        <div className={`${styles.wrap} ${styles.cta}`}>
          <div>
            <p className={styles.eyebrow}>
              <MaterialIcon name="play_circle" />
              Explore the Experience
            </p>

            <h2 id="live-experience-title" className={styles.sectionTitle}>
              See how a role becomes an evidence-backed professional
              conversation.
            </h2>

            <p className={styles.lede}>
              Launch the live experience, inspect the reasoning trail and
              follow each conclusion back to documented portfolio work.
            </p>
          </div>

          <Link className={styles.button} href="/minime">
            Launch Role Fit
            <MaterialIcon name="arrow_forward" />
          </Link>
        </div>
      </section>
    </main>
  );
}
