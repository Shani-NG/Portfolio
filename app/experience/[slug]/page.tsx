import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageCompare } from "@/components/experience/image-compare";
import { KmsProcessGallery } from "@/components/experience/kms-process-gallery";
import { ContextFab } from "@/components/site/context-fab";
import { Eyebrow } from "@/components/ui/eyebrow";
import { MaterialIcon } from "@/components/ui/material-icon";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { bigRedButtonCaseStudy, c4iCaseStudy, epdCaseStudy, kmsCaseStudy, projectCards } from "@/lib/portfolio-content";
import { projects } from "@/lib/navigation";
import { BigRedControlToggle } from "./big-red-control-toggle";
import styles from "./page.module.css";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.href.split("/").at(-1) }));
}

function EvidenceVisual({ label }: { label: string }) {
  return (
    <div className={styles.visual} aria-label={`${label} visual placeholder`} role="img">
      <span />
      <span />
      <span />
      <strong>{label}</strong>
    </div>
  );
}

type BigRedSection = (typeof bigRedButtonCaseStudy.sections)[number];

const snapshotIcons = ["person_outline", "directions_boat", "groups", "monitor_heart"] as const;

const sectionIcons: Record<BigRedSection["id"], string> = {
  "the-reset-was-not-the-solution": "warning_amber",
  "translating-infrastructure-into-operational-meaning": "account_tree",
  "smart-recovery-fix-what-failed": "build_circle",
  "prevention-before-recovery": "verified_user",
  "expert-tools-without-expert-complexity-for-everyone": "manage_search",
  "one-system-three-levels-of-control": "account_tree",
  "what-changed": "swap_horiz",
  "from-recovery-to-prevention": "insights",
  "the-product-shift": "ads_click",
};

function TextBlock({ section }: { section: BigRedSection }) {
  return (
    <div className={styles.bigRedText}>
      {"body" in section
        ? section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
        : null}

      {"points" in section ? (
        <ul className={styles.bigRedList}>
          {section.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      ) : null}

      {"after" in section
        ? section.after.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
        : null}
    </div>
  );
}

function CaseImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={[styles.caseImage, className].filter(Boolean).join(" ")}>
      <Image src={src} alt={alt} fill sizes="(max-width: 48rem) 100vw, 50vw" />
    </div>
  );
}

const monitoringMeta = [
  ["Role", "Project Manager & Strategic UX Lead"],
  ["Reach", "100+ users across multiple platforms"],
] as const;

const monitoringPills = ["System Monitoring", "Product Strategy", "Behavioral Telemetry", "UX Benchmarking"] as const;

const monitoringSections = [
  {
    id: "from-field-noise-to-product-judgment",
    wash: "green",
    label: "Overview",
    icon: "insights",
    title: "From field noise to product judgment",
    body: "The shift was not from qualitative to quantitative. It was from fragmented evidence to a product learning loop.",
    layout: "overview",
    visualSrc: "/assets/case-studies/monitoring-product-intelligence/field-noise.png",
    visualAlt: "Diagram showing fragmented field inputs becoming structured product intelligence and prioritized product decisions.",
    visualHeight: "short",
  },
  {
    id: "a-learning-system",
    wash: "neutral",
    label: "Personal Context & Confidentiality",
    icon: "description",
    title: "I did not want another feedback loop. I wanted a learning system.",
    body: "The monitoring initiative started from a product concern: the organization was making decisions from field impressions, commander summaries, and evaluation spreadsheets, while the system itself had a much richer truth about behavior. The goal was to create a way to reach users without always meeting them, compare claims with real usage, and give product and engineering teams a shared evidence base.",
    visualSrc: "/assets/case-studies/monitoring-product-intelligence/personal-context.png",
    visualAlt: "Product intelligence dashboard connecting users, telemetry, field context, and system signals.",
    visualHeight: "medium",
    cards: [
      ["Confidential by design", "All screens, data, operational details, service names, and user identifiers are abstracted. This case study focuses on learning, methods, and product impact.", "lock"],
      ["Product strategy lens", "This was not only UX analytics. It was a mechanism for prioritization, release evaluation, adoption learning, and organizational change.", "strategy"],
    ],
  },
  {
    id: "scenario-mapping",
    wash: "rose",
    label: "Deep Dive 01",
    icon: "map",
    title: "Scenario mapping turned \"usage\" into measurable intent",
    body: "I submitted the initial mapping scenarios and helped the team build a full scenario kit across major capabilities. Each scenario defined what success looked like for a specific user, workflow, and release moment. This gave product and engineering a shared way to evaluate whether a capability was actually working in the field.",
    layout: "text-left",
    visualSrc: "/assets/case-studies/monitoring-product-intelligence/deep-dive-01.png",
    visualAlt: "Scenario mapping illustration connecting workflows, capabilities, and measurable outcomes.",
    visualHeight: "medium",
  },
  {
    id: "matomo-product-evaluation-layer",
    wash: "neutral",
    label: "Deep Dive 02",
    icon: "settings_input_component",
    title: "Matomo became a product evaluation layer",
    body: "The implementation was framed around complete workflows, not vanity metrics. I connected Matomo telemetry with UX benchmarking logic: task success, time on task, errors, abandonment, adoption, and lightweight perception metrics. This made monitoring useful for release evaluation, prioritization, training, and redesign.",
    layout: "text-right",
    visualSrc: "/assets/case-studies/monitoring-product-intelligence/deep-dive-02.png",
    visualAlt: "Matomo product evaluation illustration with workflow and telemetry metrics.",
    visualHeight: "medium",
  },
  {
    id: "evidence-backed-ux-decisions",
    wash: "green",
    label: "Measurement Architecture",
    icon: "architecture",
    title: "From analytics to evidence-backed UX decisions",
    body: "I used the monitoring initiative as a way to combine behavioral telemetry with UX benchmarking logic: task success, time on task, error patterns, adoption, retention, and lightweight perception measures. The goal was to reduce bias, evaluate releases with confidence, and choose three to four meaningful KPIs per workflow instead of drowning in generic dashboards.",
    visualSrc: "/assets/case-studies/monitoring-product-intelligence/measurement-architecture.png",
    visualAlt: "Measurement architecture connecting behavioral analytics, UX benchmarks, and field context.",
    visualHeight: "medium",
    secondaryVisualSrc: "/assets/case-studies/monitoring-product-intelligence/measurement-architecture-02.png",
    secondaryVisualAlt: "Evidence stack connecting behavioral data, task benchmarks, perception measures, and field context.",
    columns: [
      ["Measurement Methods", ["Top-task success", "Time on task", "Single Ease Question or UMUX-Lite", "System Usability Scale", "Confidence intervals only where the sample and method support them"]],
      ["Evidence Stack", ["Behavioral Data", "Task Benchmark", "Perception Pulse", "Field Context"]],
    ],
  },
  {
    id: "first-week-product-value",
    wash: "rose",
    label: "Deep Dive 03",
    icon: "lightbulb",
    title: "The first week surfaced hidden product value",
    body: "The data immediately exposed patterns that field reports alone could not explain: forms that were used often but incorrectly, new forms that almost nobody opened, and repeated user behaviors that pointed to better defaults. This was the moment the initiative became impossible to ignore.",
    visualSrc: "/assets/case-studies/monitoring-product-intelligence/deep-dive-03.png",
    visualAlt: "First-week product findings grouped into incorrect use, invisible value, and repeated patterns.",
    visualHeight: "medium",
    cards: [
      ["Used, but wrong", "High usage exposed a need, but the pattern showed users were operating the form in an unintended way.", "warning"],
      ["Useful, but invisible", "New forms with high potential were barely discovered, exposing an awareness and discoverability gap.", "visibility_off"],
      ["Patterns to presets", "Repeated usage behavior became role-based presets that reduced setup time and supported faster operation.", "auto_fix_high"],
    ],
  },
  {
    id: "insight-loop-prioritization",
    wash: "neutral",
    label: "Deep Dive 04",
    icon: "loop",
    title: "The insight loop changed prioritization",
    body: "Instead of debating single comments, the team could compare claims with behavioral patterns. That shifted decisions from feature requests to evidence categories: Is the issue systemic, local, training-related, discoverability-related, or truly a missing capability? The initiative received priority because it made product learning visible.",
    findings: [
      ["Systemic", "Patterns affecting the majority of workflows or user roles", "schema"],
      ["Local", "Problems specific to a role, device type, or workflow variant", "pin_drop"],
      ["Training-related", "Discoverability and onboarding, not system limitations", "school"],
      ["Discoverability-related", "Features present but not surfaced in the right context", "search"],
      ["Truly missing capability", "Confirmed gaps that justified new development", "add_circle"],
    ],
    visualSrc: "/assets/case-studies/monitoring-product-intelligence/deep-dive-04.png",
    visualAlt: "Insight loop illustration showing how evidence changed product prioritization.",
    visualHeight: "tall",
  },
] as const;

function MonitoringIcon({ name }: { name: string }) {
  return <MaterialIcon className={styles.monitoringIcon} name={name} />;
}

function MonitoringVisual({
  src,
  alt,
  height = "medium",
}: {
  src: string;
  alt: string;
  height?: "short" | "medium" | "tall";
}) {
  return (
    <div className={[styles.monitoringVisual, styles[`monitoringVisual${height[0].toUpperCase()}${height.slice(1)}`]].join(" ")}>
      <img src={src} alt={alt} loading="lazy" decoding="async" />
    </div>
  );
}

function MonitoringSectionHeader({
  icon,
  label,
  title,
  body,
}: {
  icon: string;
  label: string;
  title: string;
  body: string;
}) {
  return (
    <div className={styles.monitoringSectionHead}>
      <Eyebrow as="div" className={styles.monitoringEyebrow} icon={<MonitoringIcon name={icon} />}>{label}</Eyebrow>
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
}

function MonitoringCaseStudy() {
  const currentProjectIndex = projectCards.findIndex((project) => project.href === "/experience/monitoring-product-intelligence");
  const nextProject = projectCards[(currentProjectIndex + 1) % projectCards.length];

  return (
    <main className={[styles.page, styles.monitoringPage].join(" ")}>
      <section className={styles.monitoringHero} data-ds-theme="dark" id="monitoring-and-product-intelligence">
        <div className={styles.monitoringHeroBg} aria-hidden="true">
          <Image
            src="/assets/case-studies/monitoring-product-intelligence/hero-monitoring.png"
            alt=""
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className={styles.monitoringWrap}>
          <div className={styles.monitoringHeroCopy}>
            <Eyebrow as="div" className={styles.monitoringEyebrow} icon={<MonitoringIcon name="monitoring" />}>System Monitoring / Product Strategy</Eyebrow>
            <h1>Monitoring as Product Intelligence</h1>
            <p>Turning field feedback, commander evaluations, and Excel-based reports into a measurable product learning system.</p>
            <dl className={styles.monitoringHeroMeta}>
              {monitoringMeta.map(([term, value]) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <div className={styles.monitoringPills} aria-label="Case study focus areas">
              {monitoringPills.map((pill) => <span key={pill}>{pill}</span>)}
            </div>
          </div>
        </div>
      </section>

      {monitoringSections.map((section, index) => {
        const washClass = section.wash === "green"
          ? styles.monitoringWashGreen
          : section.wash === "rose"
            ? styles.monitoringWashRose
            : styles.monitoringWashNeutral;

        if ("columns" in section) {
          return (
            <ScrollReveal className={styles.monitoringReveal} mode="overlap" key={section.id}>
              <section className={[styles.monitoringSection, washClass].join(" ")} id={section.id}>
                <div className={[styles.monitoringWrap, styles.monitoringMeasurementGrid].join(" ")}>
                  <div className={styles.monitoringMeasurementCopy}>
                    <MonitoringSectionHeader icon={section.icon} label={section.label} title={section.title} body={section.body} />
                    <MonitoringVisual src={section.secondaryVisualSrc} alt={section.secondaryVisualAlt} height="short" />
                  </div>
                  <MonitoringVisual src={section.visualSrc} alt={section.visualAlt} height={section.visualHeight} />
                </div>
              </section>
            </ScrollReveal>
          );
        }

        if ("findings" in section) {
          return (
            <ScrollReveal className={styles.monitoringReveal} mode="creative" key={section.id}>
              <section className={[styles.monitoringSection, washClass].join(" ")} id={section.id}>
                <div className={[styles.monitoringWrap, styles.monitoringLoopGrid].join(" ")}>
                  <div>
                    <MonitoringSectionHeader icon={section.icon} label={section.label} title={section.title} body={section.body} />
                    <div className={styles.monitoringFindingList}>
                      {section.findings.map(([title, body, icon]) => (
                        <article className={styles.monitoringFinding} key={title}>
                          <MonitoringIcon name={icon} />
                          <div>
                            <h3>{title}</h3>
                            <p>{body}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                  <MonitoringVisual src={section.visualSrc} alt={section.visualAlt} height={section.visualHeight} />
                </div>
              </section>
            </ScrollReveal>
          );
        }

        if ("cards" in section) {
          const isPersonalContext = section.id === "a-learning-system";
          const isDeepDiveThree = section.id === "first-week-product-value";
          const useCompactCardHeader = isPersonalContext || isDeepDiveThree;
          return (
            <ScrollReveal className={styles.monitoringReveal} mode={index % 2 === 0 ? "creative" : "overlap"} key={section.id}>
              <section className={[styles.monitoringSection, washClass].join(" ")} id={section.id}>
                <div className={[styles.monitoringWrap, isPersonalContext ? styles.monitoringPersonalGrid : isDeepDiveThree ? styles.monitoringDeepDiveThree : ""].join(" ")}>
                  <MonitoringVisual src={section.visualSrc} alt={section.visualAlt} height={section.visualHeight} />
                  <div className={styles.monitoringCardsCopy}>
                    <MonitoringSectionHeader icon={section.icon} label={section.label} title={section.title} body={section.body} />
                    <div className={section.cards.length === 2 ? styles.monitoringCardGridTwo : styles.monitoringCardGridThree}>
                      {section.cards.map(([title, body, icon]) => (
                        <article className={[styles.monitoringInfoCard, useCompactCardHeader ? styles.monitoringCompactCard : ""].filter(Boolean).join(" ")} key={title}>
                          {useCompactCardHeader ? (
                            <div className={styles.monitoringCardHeader}>
                              <span className={styles.monitoringCardIcon}><MonitoringIcon name={icon} /></span>
                              <h3>{title}</h3>
                            </div>
                          ) : (
                            <>
                              <span className={styles.monitoringCardIcon}><MonitoringIcon name={icon} /></span>
                              <h3>{title}</h3>
                            </>
                          )}
                          <p>{body}</p>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </ScrollReveal>
          );
        }

        return (
          <ScrollReveal className={styles.monitoringReveal} mode={index % 2 === 0 ? "creative" : "overlap"} key={section.id}>
            <section className={[styles.monitoringSection, washClass].join(" ")} id={section.id}>
              <div className={[styles.monitoringWrap, styles.monitoringSplit, section.layout === "text-right" ? styles.monitoringSplitReverse : "", section.layout === "overview" ? styles.monitoringOverviewStack : ""].join(" ")}>
                <MonitoringSectionHeader icon={section.icon} label={section.label} title={section.title} body={section.body} />
                <MonitoringVisual src={section.visualSrc} alt={section.visualAlt} height={section.visualHeight} />
              </div>
            </section>
          </ScrollReveal>
        );
      })}

      <section className={styles.monitoringClosing} data-ds-theme="dark" id="product-judgment">
        <div className={styles.monitoringWrap}>
          <MonitoringSectionHeader
            icon="verified"
            label="Closing Reflection"
            title="Not dashboards. Product judgment."
            body="Monitoring and Product Intelligence turned fragmented feedback into a product-learning mechanism that connected real behavior, field context, and UX benchmarks. As Project Manager and Strategic UX Lead, I led the initiative from scenario mapping through measurement architecture, helping product and engineering teams prioritize with evidence instead of isolated opinion."
          />
          <p>All screens, metrics, operational details, and user identifiers are anonymized, abstracted, or recreated for public sharing.</p>
        </div>
      </section>

      <ContextFab href={nextProject.href} label="Next Case Study" icon="arrow_forward" />
    </main>
  );
}

function BigRedSectionView({ section, index }: { section: BigRedSection; index: number }) {
  const mode = index % 2 === 0 ? "creative" : "overlap";
  const isProcess = "variant" in section && section.variant === "process";
  const sectionIcon = sectionIcons[section.id];

  if ("before" in section) {
    return (
      <ScrollReveal mode={mode}>
        <section className={styles.bigRedSection} id={section.id}>
          <div className={styles.bigRedSectionIntro}>
            <div className={styles.sectionKicker}>
              <span className={styles.sectionIcon}><MaterialIcon name={sectionIcon} /></span>
              <Eyebrow className={styles.sectionKickerEyebrow} color="primaryHover">{section.title}</Eyebrow>
            </div>
            <h2>
              When creating the guide became harder than <span className={styles.kmsKeepTogether}>using it.</span>
            </h2>
          </div>
          <div className={styles.changeGrid}>
            <div>
              <h3>Before</h3>
              <ul className={styles.bigRedList}>
                {section.before.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>After</h3>
              <ul className={styles.bigRedList}>
                {section.afterList.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </ScrollReveal>
    );
  }

  if ("roles" in section) {
    return (
      <ScrollReveal mode={mode}>
        <section className={styles.bigRedSection} id={section.id}>
          <div className={styles.bigRedSectionIntro}>
            <div className={styles.sectionKicker}>
              <span className={styles.sectionIcon}><MaterialIcon name={sectionIcon} /></span>
              <Eyebrow className={styles.sectionKickerEyebrow} color="primaryHover">{section.title}</Eyebrow>
            </div>
            <h2>{section.title}</h2>
            <TextBlock section={section} />
          </div>
          <div className={styles.roleLayout}>
            <div className={styles.roleRail}>
              {section.roles.map(([title, body]) => (
                <article key={title}>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
            {"image" in section ? <CaseImage src={section.image} alt={section.imageAlt} /> : null}
          </div>
        </section>
      </ScrollReveal>
    );
  }

  if ("gallery" in section) {
    return (
      <ScrollReveal mode={mode}>
        <section className={styles.bigRedSection} id={section.id}>
          <div className={styles.bigRedSectionIntro}>
            <div className={styles.sectionKicker}>
              <span className={styles.sectionIcon}><MaterialIcon name={sectionIcon} /></span>
              <Eyebrow className={styles.sectionKickerEyebrow} color="primaryHover">{section.title}</Eyebrow>
            </div>
            <h2>{section.title}</h2>
            <TextBlock section={section} />
          </div>
          <div className={styles.galleryGrid}>
            {section.gallery.map(([src, alt]) => (
              <CaseImage src={src} alt={alt} key={src} />
            ))}
          </div>
        </section>
      </ScrollReveal>
    );
  }

  return (
    <ScrollReveal mode={mode}>
      <section className={[styles.bigRedSection, isProcess ? styles.processSection : ""].join(" ")} id={section.id}>
        <div className={styles.bigRedSectionIntro}>
          <div className={styles.sectionKicker}>
            <span className={styles.sectionIcon}><MaterialIcon name={sectionIcon} /></span>
            <Eyebrow className={styles.sectionKickerEyebrow} color="primaryHover">{section.title}</Eyebrow>
          </div>
          <h2>{section.title}</h2>
          <TextBlock section={section} />
        </div>
        {"image" in section ? <CaseImage src={section.image} alt={section.imageAlt} /> : null}
      </section>
    </ScrollReveal>
  );
}

function BigRedIcon({ name, className }: { name: string; className?: string }) {
  return <MaterialIcon className={[styles.bigRedMsi, className].filter(Boolean).join(" ")} name={name} />;
}

function BigRedInlineImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <img className={[styles.bigRedInlineImage, className].filter(Boolean).join(" ")} src={src} alt={alt} />
  );
}

function BigRedHtmlCaseStudy() {
  const currentProjectIndex = projectCards.findIndex((project) => project.href === "/experience/the-big-red-button");
  const nextProject = projectCards[(currentProjectIndex + 1) % projectCards.length];

  return (
    <main className={[styles.page, styles.bigRedHtmlPage].join(" ")}>
      <section className={styles.bigRedHtmlHero} data-ds-theme="dark" id={bigRedButtonCaseStudy.heroAnchor}>
        <div className={styles.bigRedHtmlWrap}>
          <Eyebrow as="div" className={styles.bigRedHtmlEyebrow}>Monitor Module</Eyebrow>
          <h1>The Big RED BUTTON</h1>
          <p>Reducing critical downtime through targeted recovery.</p>
        </div>
        <div className={styles.bigRedHeroVisual}>
          <BigRedInlineImage src="/assets/case-studies/big-red-button/01-hero-module.png" alt="Monitor module interface overview" />
        </div>
      </section>

      <section className={styles.bigRedHtmlSection} id="project-snapshot">
        <div className={styles.bigRedHtmlWrap}>
          <div className={styles.snapshotGridHtml}>
            <div>
              <Eyebrow as="div" className={styles.bigRedHtmlEyebrow} icon={<BigRedIcon name="description" className={styles.inlineIcon} />}>Project Snapshot</Eyebrow>
              <h2 className={styles.snapshotTitle}>From Panic Button to Operational Intelligence</h2>
              <p className={styles.snapshotParagraph}>In a mission-critical naval system, downtime is an operational risk. Ship technicians had limited tools for diagnosing failures. When the application stopped working, they either contacted shore support or restarted the entire system.</p>
              <p className={styles.snapshotParagraph}>I led the UX strategy and design of a Monitor Module that replaced blind resets with diagnosis, prevention, and role-based recovery tools.</p>
            </div>
            <div>
              <div className={styles.snapshotVisual}>
                <BigRedInlineImage src="/assets/case-studies/big-red-button/project-snapshot.png" alt="Initial product request: build one button that resets everything." />
              </div>
            </div>
          </div>
          <div className={styles.disclaimerStrip}>
            <div className={styles.iconWrap}><BigRedIcon name="gpp_maybe" /></div>
            <span><strong>Security disclaimer.</strong> No real product screens are shown here, because national security matters. Instead, this case study presents the design decisions behind the process, not the actual product or sensitive operational information.</span>
          </div>
        </div>
      </section>

      <section className={[styles.bigRedHtmlSection, styles.washRose].join(" ")} id="the-reset-was-not-the-solution">
        <div className={[styles.blob, styles.blobRose].join(" ")} />
        <div className={styles.bigRedHtmlWrap}>
          <div className={styles.sectionHead}>
            <Eyebrow as="div" className={styles.bigRedHtmlEyebrow} icon={<BigRedIcon name="bolt" className={styles.inlineIcon} />}>The Real Problem</Eyebrow>
            <h2>The Reset Reflex</h2>
          </div>
          <div className={styles.problemGrid}>
            <div className={styles.compareStack}>
              <div className={styles.compareCard}>
                <h4>Current State</h4>
                <p>Technicians relied on full-system resets when the failure source was unclear. Recovery depended on shore support or expert interpretation. Every issue risked unnecessary downtime.</p>
              </div>
              <div className={styles.compareCard}>
                <h4>Operational Risk</h4>
                <p>In an automated system, a reset was not neutral. It could erase diagnostic context and take around 15 minutes to bring the system back online.</p>
              </div>
            </div>
            <div>
              <div className={styles.resetVisual}>
                <BigRedInlineImage src="/assets/case-studies/big-red-button/03-the-reset-reflex.png" alt="Emergency shutdown interface showing the reset reflex risk" />
              </div>
              <div className={styles.uptimeCard}>
                <Eyebrow as="div" className={styles.uptimeLabel} icon={<BigRedIcon name="trending_up" />}>Application uptime, before to after</Eyebrow>
                <svg viewBox="0 0 260 90" width="100%" height="90" aria-hidden="true">
                  <path className={styles.uptimeLine} d="M5,75 C40,72 60,68 85,60 C115,50 130,55 155,40 C185,23 200,28 225,14 L250,8" />
                  <circle className={styles.uptimeDot} cx="250" cy="8" r="4.5" />
                </svg>
                <div className={styles.uptimeCaption}>A steady, meaningful climb in time-online, not a single dramatic fix.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.bigRedHtmlSection} id="translating-infrastructure-into-operational-meaning">
        <div className={styles.bigRedHtmlWrap}>
          <div className={styles.sectionHead}>
            <Eyebrow as="div" className={styles.bigRedHtmlEyebrow} icon={<BigRedIcon name="hub" className={styles.inlineIcon} />}>Research to Strategy</Eyebrow>
            <h2>Translating infrastructure into operational meaning.</h2>
            <p>Developers &amp; technicians worked with Pods, Kafka, APIs, services, and databases. The goal was to create a translation layer between system architecture and the people operating it. The objectives focused on three main points:</p>
          </div>
          <div className={styles.objectivesGrid}>
            <div className={styles.objectiveCard} data-num="01">
              <div className={styles.iconCircle}><BigRedIcon name="check_circle" /></div>
              <h4>Is the system operational?</h4>
              <p>Prevent setup errors and surface early alerts before they become operational issues.</p>
            </div>
            <div className={styles.objectiveCard} data-num="02">
              <div className={styles.iconCircle}><BigRedIcon name="route" /></div>
              <h4>Which process is affected?</h4>
              <p>Map failure points and connect technical events to operational context.</p>
            </div>
            <div className={styles.objectiveCard} data-num="03">
              <div className={styles.iconCircle}><BigRedIcon name="shield_with_heart" /></div>
              <h4>Can I resolve it safely?</h4>
              <p>Link each fault to severity, impact, and the next safe action.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={[styles.bigRedHtmlSection, styles.washSoft].join(" ")} id="prevention-before-recovery">
        <div className={[styles.blob, styles.blobGreen].join(" ")} />
        <div className={styles.bigRedHtmlWrap}>
          <div className={styles.sectionHead}>
            <Eyebrow as="div" className={styles.bigRedHtmlEyebrow} icon={<BigRedIcon name="tune" className={styles.inlineIcon} />}>Key UX Moves</Eyebrow>
            <h2>Prevention Before Recovery</h2>
            <p>In-depth research into configuration and system startup workflows revealed that errors could be reduced earlier through clearer setup visibility.</p>
          </div>

          <div className={styles.solutionRow}>
            <div>
              <Eyebrow as="span" className={styles.solutionTag}>Solution 01</Eyebrow>
              <h3>Configuration that prevents failed startup</h3>
              <p className={styles.solutionDesc}>The setup flow made environment requirements visible before the system was turned on.</p>
              <ul>
                <li><BigRedIcon name="check_circle" /> Mode-specific settings and permissions were surfaced before startup.</li>
                <li><BigRedIcon name="check_circle" /> Dependencies like the Kafka cluster were checked before the system launched.</li>
                <li><BigRedIcon name="check_circle" /> Each startup stage retained visited state until the system became operational.</li>
              </ul>
            </div>
            <div className={styles.solutionVisual}>
              <BigRedInlineImage src="/assets/case-studies/big-red-button/05-1-prevention-before-recovery.png" alt="Configuration flow for preventing failed startup" />
            </div>
          </div>

          <div className={[styles.solutionRow, styles.reverse].join(" ")}>
            <div>
              <Eyebrow as="span" className={styles.solutionTag}>Solution 02</Eyebrow>
              <h3>Role-based visibility for safer operation</h3>
              <p className={styles.solutionDesc}>The monitoring view translated system state into the context each role needed to act on.</p>
              <ul>
                <li><BigRedIcon name="check_circle" /> Each role saw the information and actions relevant to its responsibility.</li>
                <li><BigRedIcon name="check_circle" /> Alerts and system status were connected to operational impact.</li>
                <li><BigRedIcon name="check_circle" /> Relevant signals surfaced before issues became operational failures.</li>
              </ul>
            </div>
            <div className={styles.solutionVisual}>
              <BigRedInlineImage src="/assets/case-studies/big-red-button/05-2-prevention-before-recovery.png" alt="Role-based dashboard visibility for safer operation" />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.bigRedHtmlSection} id="smart-recovery-fix-what-failed">
        <div className={[styles.bigRedHtmlWrap, styles.recoveryGrid].join(" ")}>
          <div className={styles.recoveryVisual}>
            <BigRedInlineImage src="/assets/case-studies/big-red-button/06-smart-recovery-fix-what-failed.png" alt="Smart Recovery interface showing a focused fault and safe recovery action" />
          </div>
          <div>
            <Eyebrow as="div" className={styles.bigRedHtmlEyebrow} icon={<BigRedIcon name="healing" className={styles.inlineIcon} />}>Key UX Moves</Eyebrow>
            <h2 className={styles.recoveryTitle}>Smart Recovery: Fix What Failed</h2>
            <p className={styles.recoveryIntro}>Instead of one global reset, known failures were connected to focused recovery actions. When the system identified a recognized fault, the interface presents:</p>
            <div className={styles.recoveryList}>
              <div className={styles.recoveryItem}>
                <div className={styles.iconCircle}><BigRedIcon name="target" /></div>
                <div><h4>Specific Impact</h4><p>Clear indication of which capability is affected.</p></div>
              </div>
              <div className={styles.recoveryItem}>
                <div className={styles.iconCircle}><BigRedIcon name="restart_alt" /></div>
                <div><h4>Precision Reset</h4><p>Restart only the specific service or Kafka stream that broke.</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={[styles.bigRedHtmlSection, styles.washRose].join(" ")} id="one-system-three-levels-of-control">
        <div className={styles.bigRedHtmlWrap}>
          <div className={[styles.sectionHead, styles.center].join(" ")}>
            <Eyebrow as="div" className={styles.centerEyebrow} icon={<BigRedIcon name="layers" className={styles.inlineIcon} />}>Expert Tools</Eyebrow>
            <h2>Expert Tools: Made for Everyone</h2>
            <p>Providing deep technical transparency while maintaining a high-level operational overview.</p>
          </div>
          <BigRedControlToggle
            options={[
              {
                label: "Solution 1",
                title: "Logs Management",
                body: "Filtering logs by severity or mission component, allowing shore technicians to remote-diagnose without full data dumps.",
                image: "/assets/case-studies/big-red-button/07-expert-tools-made-for-everyone.png",
                imageAlt: "Logs management expert tool",
              },
              {
                label: "Solution 2",
                title: "Detailed Technical Logs",
                body: "Exportable, time-stamped diagnostic bundles that follow maritime data standards for forensic system analysis.",
                image: "/assets/case-studies/big-red-button/07-2-expert-tools-made-for-everyone.png",
                imageAlt: "Detailed technical logs expert tool",
              },
              {
                label: "Solution 3",
                title: "Interfaces Connectivity",
                body: "A live map of connected services and interfaces, so technicians can confirm what is actually linked before acting.",
                image: "/assets/case-studies/big-red-button/07-3-expert-tools-made-for-everyone.png",
                imageAlt: "Interfaces connectivity expert tool",
              },
            ]}
          />
        </div>
      </section>

      <section className={styles.bigRedHtmlSection} id="what-changed">
        <div className={styles.bigRedHtmlWrap}>
          <div className={styles.sectionHead}>
            <Eyebrow as="div" className={styles.bigRedHtmlEyebrow} icon={<BigRedIcon name="sync_alt" className={styles.inlineIcon} />}>From Reactive to Controlled</Eyebrow>
            <h2>What changed.</h2>
          </div>
          <div className={styles.changedWrap}>
            <div className={styles.changedLegend}><span>Before</span><span>After</span></div>
            <div className={styles.changedRow}>
              <div className={[styles.changedCell, styles.before].join(" ")}><BigRedIcon name="cancel" /> Technical failures appeared without operational context.</div>
              <div className={[styles.changedCell, styles.after].join(" ")}><BigRedIcon name="check_circle" /> Errors were connected to operational impact and mission.</div>
            </div>
            <div className={styles.changedRow}>
              <div className={[styles.changedCell, styles.before].join(" ")}><BigRedIcon name="cancel" /> Ship technicians relied on shore support or full resets.</div>
              <div className={[styles.changedCell, styles.after].join(" ")}><BigRedIcon name="check_circle" /> Known failures had targeted, safe recovery actions.</div>
            </div>
            <div className={styles.changedRow}>
              <div className={[styles.changedCell, styles.before].join(" ")}><BigRedIcon name="cancel" /> Engineers searched through broad, raw log files.</div>
              <div className={[styles.changedCell, styles.after].join(" ")}><BigRedIcon name="check_circle" /> Role-based views supported one monitoring model.</div>
            </div>
            <div className={styles.changedMobileGroups}>
              <div className={styles.changedMobileGroup}>
                <h3>Before</h3>
                <ul>
                  <li><BigRedIcon name="cancel" /> Technical failures appeared without operational context.</li>
                  <li><BigRedIcon name="cancel" /> Ship technicians relied on shore support or full resets.</li>
                  <li><BigRedIcon name="cancel" /> Engineers searched through broad, raw log files.</li>
                </ul>
              </div>
              <div className={styles.changedMobileGroup}>
                <h3>After</h3>
                <ul>
                  <li><BigRedIcon name="check_circle" /> Errors were connected to operational impact and mission.</li>
                  <li><BigRedIcon name="check_circle" /> Known failures had targeted, safe recovery actions.</li>
                  <li><BigRedIcon name="check_circle" /> Role-based views supported one monitoring model.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={[styles.bigRedHtmlSection, styles.washDark].join(" ")} id="the-product-shift">
        <span className={styles.anchorShim} id="from-recovery-to-prevention" />
        <div className={styles.bigRedHtmlWrap}>
          <div className={[styles.sectionHead, styles.center, styles.darkHead].join(" ")}>
            <Eyebrow as="div" className={styles.centerEyebrow} icon={<BigRedIcon name="insights" className={styles.inlineIcon} />}>The Product Shift</Eyebrow>
            <h2>Translate the failure. Explain the impact. Apply the smallest safe action.</h2>
            <p>The project began with a request for one reset button. It became a system-health strategy for safer diagnosis, prevention, and role-based continuity.</p>
          </div>
          <div className={styles.shiftReflection}>
            <div className={styles.shiftOutcome}>
              <span className={styles.shiftPulse} aria-hidden="true" />
              <span className={styles.shiftRadar} aria-hidden="true" />
              <BigRedIcon name="insights" />
              <strong>Operational meaning replaced operational panic.</strong>
              <p>The interface no longer asked users to recover blindly. It translated failure into context, impact, and the safest next action.</p>
            </div>
          </div>
        </div>
      </section>

      <ContextFab href={nextProject.href} label="Next Case Study" icon="arrow_forward" />
    </main>
  );
}

function C4iIcon({ name, className }: { name: string; className?: string }) {
  return <MaterialIcon className={[styles.c4iIcon, className].filter(Boolean).join(" ")} name={name} />;
}

function C4iImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={[styles.c4iMediaFrame, className].filter(Boolean).join(" ")}>
      <img src={src} alt={alt} />
    </div>
  );
}

function C4iHtmlCaseStudy() {
  const currentProjectIndex = projectCards.findIndex((project) => project.href === "/experience/c4i-beyond-clarity");
  const nextProject = projectCards[(currentProjectIndex + 1) % projectCards.length];

  return (
    <main className={[styles.page, styles.c4iHtmlPage].join(" ")}>
      <section className={styles.c4iHtmlHero} data-ds-theme="dark" id="c4i-beyond-clarity">
        <div className={styles.c4iHeroVisual} aria-hidden="true">
          <C4iImage
            src="/assets/case-studies/c4i-beyond-clarity/01-c4i-beyond-clarity-hero.png"
            alt=""
          />
        </div>
        <div className={styles.c4iHtmlWrap}>
          <div className={styles.c4iHeroTop}>
            <Eyebrow as="div" className={styles.c4iHtmlEyebrow} icon={<C4iIcon name="shield" />}>Mission-Critical C4I</Eyebrow>
            <h1>C4I - Beyond Clarity</h1>
            <p>C4I products are living ecosystems that require unifying fragmented operational workflows, sensitive permissions, multi-source data, and time-critical mission decision-making into a clearer command-and-control experience.</p>
          </div>
        </div>
      </section>

      <ScrollReveal mode="overlap">
        <section className={styles.c4iHtmlSection} id="before-ux-organizational-alignment">
          <div className={styles.c4iHtmlWrap}>
            <div className={styles.c4iSectionHead}>
              <Eyebrow as="div" className={styles.c4iHtmlEyebrow} icon={<C4iIcon name="groups" />}>Leadership</Eyebrow>
              <h2>Before UX, organizational alignment.</h2>
              <p>The four C4I teams revealed a system too complex to solve screen by screen. Before moving into UX definition, I aligned product, design, development, and stakeholders around the process, structuring flows and information architecture needed for coherent design work.</p>
            </div>

            <div className={styles.c4iAlignGrid}>
              <article className={[styles.c4iAlignCard, styles.c4iAlignFeature].join(" ")}>
                <img className={styles.c4iAlignCardImage} src="/assets/case-studies/c4i-beyond-clarity/leadership-operational-users.png" alt="" />
                <div className={styles.c4iAlignCardContent}>
                  <h3 className={styles.c4iCardTitleLarge}>Operational users</h3>
                  <p>Command and field teams needed fast comprehension, clear prioritization, and interfaces that reduce cognitive load under pressure.</p>
                </div>
              </article>
              <article className={styles.c4iAlignCard}>
                <img className={styles.c4iAlignCardImage} src="/assets/case-studies/c4i-beyond-clarity/leadership-governance-challenge.png" alt="" />
                <div className={styles.c4iAlignCardContent}>
                  <h3 className={styles.c4iCardTitleLarge}>Governance challenge</h3>
                  <p>Move UX from request handling into a repeatable product capability for decisions, delivery, and learning.</p>
                </div>
              </article>
              <article className={styles.c4iAlignCard}>
                <img className={styles.c4iAlignCardImage} src="/assets/case-studies/c4i-beyond-clarity/leadership-engineering-constraints.png" alt="" />
                <div className={styles.c4iAlignCardContent}>
                  <h3 className={styles.c4iCardTitleLarge}>Engineering constraints</h3>
                  <p>The solution had to respect data flows, roles, permissions, release capacity, and technical dependencies.</p>
                </div>
              </article>
              <article className={styles.c4iAlignCard}>
                <img className={styles.c4iAlignCardImage} src="/assets/case-studies/c4i-beyond-clarity/leadership-product-consistency.png" alt="" />
                <div className={styles.c4iAlignCardContent}>
                  <h3 className={styles.c4iCardTitleLarge}>Product consistency</h3>
                  <p>Multiple interfaces needed to behave like one product: consistent language, reusable patterns, and shared ownership.</p>
                </div>
              </article>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal mode="creative">
        <section className={[styles.c4iHtmlSection, styles.c4iWashDark, styles.c4iSystemStructure].join(" ")} id="four-pillars-one-shared-logic">
          <div className={styles.c4iHtmlWrap}>
            <div className={styles.c4iSectionHead}>
              <Eyebrow as="div" className={styles.c4iHtmlEyebrow} icon={<C4iIcon name="grain" />}>System Structure</Eyebrow>
              <h2>Four pillars. One logic.</h2>
              <p>The process connects strategy and UX across four C4I layers: clarifying the mission, mapping users and constraints, structuring decision flows, and validating trust in action.</p>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal mode="overlap">
        <section className={styles.c4iHtmlSection} id="the-real-ux-was-invisible">
          <div className={styles.c4iHtmlWrap}>
            <div className={styles.c4iSectionHead}>
              <Eyebrow as="div" className={styles.c4iHtmlEyebrow} icon={<C4iIcon name="visibility_off" />}>01 / Information UX</Eyebrow>
              <h2>The real UX was invisible.</h2>
              <p>In mission-critical systems, the best UX is often the action users no longer need to perform. Based on deep operational research, the work connected engineering logic, integrations, and algorithmic support into flows that felt almost unnoticeable under pressure.</p>
            </div>

            <div className={styles.c4iFusionCard}>
              <div className={styles.c4iFusionCopy}>
                <span>Information Fusion</span>
                <h3>One action replaced multiple merge forms.</h3>
                <div className={styles.c4iFusionList}>
                  {["Sensor source", "Platform update", "Shared entity", "Manual refinement", "Mission context"].map((item) => (
                    <div className={styles.c4iFusionItem} key={item}><span />{item}</div>
                  ))}
                </div>
              </div>
              <div className={styles.c4iMergeViz} aria-label="Multiple operational entities merging into one validated object">
                <iframe
                  className={styles.c4iMergeFrame}
                  src="/assets/case-studies/c4i-beyond-clarity/entity-merge-animation.html"
                  title="Entity merge animation"
                  loading="lazy"
                />
              </div>
            </div>

            <C4iImage
              className={styles.c4iWideImage}
              src="/assets/case-studies/c4i-beyond-clarity/04-2-the-real-ux-was-invisible.png"
              alt="Dark feature composition showing entity fusion and a unified operational picture."
            />

            <div className={styles.c4iCardsThree}>
              {[
                ["call_merge", "From separate forms to one action", "Users selected the relevant elements once. The system calculated fit, removed weak matches, and merged what belonged together."],
                ["rule_settings", "Logic handled the slow work", "Matching, conflicts, and validation moved into system logic, reducing manual effort and preventing merge mistakes."],
                ["verified_user", "Trust stayed visible", "Supporting evidence, edit states, and override controls kept the user in charge before one validated object was created."],
              ].map(([icon, title, body]) => (
                <article className={styles.c4iIconCard} key={title}>
                  <span><C4iIcon name={icon} /></span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal mode="creative">
        <section className={[styles.c4iHtmlSection, styles.c4iWashSoft].join(" ")} id="defaults-made-each-workspace-feel-purpose-built">
          <div className={[styles.c4iBlob, styles.c4iBlobGreen].join(" ")} />
          <div className={styles.c4iHtmlWrap}>
            <div className={styles.c4iSectionHead}>
              <Eyebrow as="div" className={styles.c4iHtmlEyebrow} icon={<C4iIcon name="tune" />}>02 / Personalization Engine</Eyebrow>
              <h2>Defaults made the system feel personal.</h2>
              <p>Instead of exposing the same tools and data to every operator, the system used profile settings, predefined choices, and dedicated tool sets to shape each workspace before use. Users could still adjust what mattered, but most of the operational context arrived ready.</p>
            </div>

            <C4iImage
              className={styles.c4iWideImage}
              src="/assets/case-studies/c4i-beyond-clarity/05-defaults-made-the-system-feel-personal.png"
              alt="Dark feature composition showing personalized interfaces, access control, and contextual tools."
            />

          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal mode="overlap">
        <section className={[styles.c4iHtmlSection, styles.c4iWashRose].join(" ")} id="designed-for-threat-response">
          <div className={styles.c4iHtmlWrap}>
            <div className={[styles.c4iSectionHead, styles.c4iSectionHeadWide].join(" ")}>
              <Eyebrow as="div" className={styles.c4iHtmlEyebrow} icon={<C4iIcon name="emergency" />}>03 / Operational Decisions</Eyebrow>
              <h2>Designed for threat response, not just information display.</h2>
              <p>In this kind of critical system, the most important moment is how people respond to threats. The decision was to build a support layer for defensive workflows: fast threat classification and system recommendations for operators, and a command dashboard for leaders managing the full picture.</p>
            </div>

            <div className={styles.c4iThreatCard} aria-label="Threat workflow iterations">
              <div className={styles.c4iFlowSteps}>
                {["Detect", "Classify", "Confirm", "Respond"].map((step) => (
                  <div className={styles.c4iFlowStep} key={step}><span />{step}</div>
                ))}
              </div>
            </div>

            <div className={styles.c4iThreatFeature}>
              <C4iImage
                className={styles.c4iThreatVisual}
                src="/assets/case-studies/c4i-beyond-clarity/designed-for-threat-response.png"
                alt="An anonymized maritime command-and-control view for threat response and operational decisions."
              />
            </div>

            <div className={styles.c4iStripCards}>
              {[
                ["bolt", "Fast threat classification", "Classification tied to guidelines, prioritizing action with a proactive recommendation instead of raw data."],
                ["dashboard", "A dashboard for the full picture", "Layers of status, priorities, and situation come together into a single perspective for leaders."],
                ["gavel", "Proving the screen", "Every mission-grade screen became a record of the operator's response - a real part of operational trust."],
              ].map(([icon, title, body]) => (
                <article className={styles.c4iStripItem} key={title}>
                  <span><C4iIcon name={icon} /></span>
                  <div>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal mode="topDown">
        <section className={styles.c4iHtmlSection} id="ux-engineering-through-integration">
          <div className={styles.c4iHtmlWrap}>
            <div className={styles.c4iSectionHead}>
              <Eyebrow as="div" className={styles.c4iHtmlEyebrow} icon={<C4iIcon name="hub" />}>04 / Systems Engineering</Eyebrow>
              <h2>UX engineering through integration.</h2>
              <p>A major part of the work was translating technical structures I mapped: backend values, data structures, and system logic that defined what the operator needed to use and what the system should handle in the background.</p>
            </div>

            <div className={styles.c4iNumCards}>
              {[
                ["01", "Mapping", "Operational data mapping", "Each field was defined not only by the data it represented, but by which operational answer it needed to support."],
                ["02", "Integration", "Interface-level integration", "Manual entry gave way to integration flows that delivered data directly into the operator's dashboard."],
                ["03", "Efficiency", "Cleaner operator flows", "The system handled coordination automatically, saving time, reducing manual steps, and improving flow efficiency."],
              ].map(([num, tag, title, body]) => (
                <article className={styles.c4iNumCard} data-num={num} key={title}>
                  <span>{tag}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>

            <div className={styles.c4iProofRows} id="screens-as-proof">
              {[
                ["/assets/case-studies/c4i-beyond-clarity/screens-as-proof-01.png", "Awareness triggers action", "The interface made it possible to move from entry to awareness to coordinated action without losing context."],
                ["/assets/case-studies/c4i-beyond-clarity/screens-as-proof-02.png", "Authority is visible", "Permissions, dependencies, and actions stayed aligned with the operational hierarchy behind them."],
                ["/assets/case-studies/c4i-beyond-clarity/screens-as-proof-03.png", "Decisions are reviewable", "Every action kept its supporting data and traceability, so decisions could be reconstructed and reviewed."],
              ].map(([src, title, body], index) => (
                <article className={[styles.c4iProofRow, title === "Authority is visible" ? styles.c4iProofRowReverse : ""].filter(Boolean).join(" ")} key={title}>
                  <C4iImage className={[styles.c4iProofVisual, index === 0 ? styles.c4iProofVisualLeft : styles.c4iProofVisualRight].join(" ")} src={src} alt={`${title} anonymized C4I screen proof.`} />
                  <div className={styles.c4iProofCopy}>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <section className={[styles.c4iHtmlSection, styles.c4iClosing].join(" ")} id="operational-resilience">
        <div className={[styles.c4iBlob, styles.c4iBlobRose].join(" ")} />
        <div className={styles.c4iHtmlWrap}>
          <div className={styles.c4iClosingInner}>
            <span />
            <Eyebrow as="div" className={styles.c4iHtmlEyebrow} icon={<C4iIcon name="radar" />}>Summary</Eyebrow>
            <h2>Not screens. Operational resilience.</h2>
            <p>C4I was designed for awareness, coordination, trusted information, and accountable decisions. My role was to help bridge operational research and a product experience that could scale trust, coordinate teams, and support review when decisions mattered most.</p>
            <small>Public case study: security boundaries observed, approved or recreated material only, accountability preserved.</small>
          </div>
        </div>
      </section>

      <ContextFab href={nextProject.href} label="Next Case Study" icon="arrow_forward" />
    </main>
  );
}

type KmsSection = (typeof kmsCaseStudy.sections)[number];

function KmsVisualImage({
  visual,
  className,
}: {
  visual: readonly [string, string];
  className?: string;
}) {
  return (
    <div className={[styles.kmsVisualImage, className].filter(Boolean).join(" ")}>
      <img src={visual[0]} alt={visual[1]} />
    </div>
  );
}

function KmsSectionView({ section, index }: { section: KmsSection; index: number }) {
  const isGuidance = "cardsTitle" in section;
  const revealMode = index % 2 === 0 ? "creative" : "overlap";

  if (section.id === "the-real-problem") {
    return (
      <ScrollReveal mode={revealMode}>
        <section className={[styles.kmsSection, styles.kmsProblemSection].join(" ")} id={section.id}>
          <div className={styles.kmsSectionCopy}>
            <p className={styles.kmsEyebrow}>{section.label}</p>
            <h2>{section.title}</h2>
            <p className={styles.kmsBody}>{section.body}</p>
          </div>
          {"points" in section ? (
            <div className={styles.kmsProblemCards}>
              {section.points.map((point, pointIndex) => {
                const title = typeof point === "string" ? point : point[0];
                const body = typeof point === "string" ? null : point[1];
                return (
                  <article key={title} className={styles.kmsProblemCard}>
                    <span>{pointIndex + 1}</span>
                    <div>
                      <h3>{title}</h3>
                      {body ? <p>{body}</p> : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </section>
      </ScrollReveal>
    );
  }

  if (section.id === "foundation-phase") {
    return (
      <ScrollReveal mode={revealMode}>
        <section className={[styles.kmsSection, styles.kmsFeatureSection, styles.kmsSurfaceBand].join(" ")} id={section.id}>
          <div className={styles.kmsFeatureInner}>
            <div className={styles.kmsSectionCopy}>
              <p className={styles.kmsEyebrow}>{section.label}</p>
              <h2>{section.title}</h2>
              <p className={styles.kmsBody}>{section.body}</p>
              {"points" in section ? (
                <ul className={styles.kmsCheckList}>
                  {section.points.map((point) => (
                    <li key={typeof point === "string" ? point : point[0]}>{typeof point === "string" ? point : point[0]}</li>
                  ))}
                </ul>
              ) : null}
            </div>
            <KmsVisualImage visual={kmsCaseStudy.visuals.foundation} className={styles.kmsDashboardVisual} />
          </div>
        </section>
      </ScrollReveal>
    );
  }

  if (section.id === "editor-to-mobile") {
    return (
      <ScrollReveal mode={revealMode}>
        <section className={[styles.kmsSection, styles.kmsFeatureSection, styles.kmsReverseFeature].join(" ")} id={section.id}>
          <div className={styles.kmsFeatureInner}>
            <KmsVisualImage visual={kmsCaseStudy.visuals.editorToMobile} className={styles.kmsPhoneVisual} />
            <div className={styles.kmsSectionCopy}>
              <p className={styles.kmsEyebrow}>{section.label}</p>
              <h2>{section.title}</h2>
              <p className={styles.kmsBody}>{section.body}</p>
              {"calloutTitle" in section ? (
                <div className={styles.kmsSoftCallout}>
                  <strong>{section.calloutTitle}</strong>
                  <p>{section.callout}</p>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </ScrollReveal>
    );
  }

  if (section.id === "process-model") {
    return (
      <ScrollReveal mode={revealMode}>
        <section className={[styles.kmsSection, styles.kmsProcessSection, styles.kmsSurfaceBand].join(" ")} id={section.id}>
          <div className={styles.kmsProcessIntro}>
            <p className={styles.kmsEyebrow}>{section.label}</p>
            <h2>{section.title}</h2>
            <p className={styles.kmsBody}>{section.body}</p>
            {"points" in section ? (
              <div className={styles.kmsProcessNotes}>
                {section.points.map((point) => (
                  <p key={typeof point === "string" ? point : point[0]}>{typeof point === "string" ? point : point[0]}</p>
                ))}
              </div>
            ) : null}
          </div>
          <KmsProcessGallery items={[
            { src: kmsCaseStudy.visuals.processLeft[0], alt: kmsCaseStudy.visuals.processLeft[1] },
            { src: kmsCaseStudy.visuals.process[0], alt: kmsCaseStudy.visuals.process[1] },
            { src: kmsCaseStudy.visuals.processRight[0], alt: kmsCaseStudy.visuals.processRight[1] },
          ]} />
        </section>
      </ScrollReveal>
    );
  }

  if (section.id === "validation-before-release") {
    return (
      <ScrollReveal mode={revealMode}>
        <section className={[styles.kmsSection, styles.kmsFeatureSection, styles.kmsValidationSection].join(" ")} id={section.id}>
          <div className={styles.kmsFeatureInner}>
            <div className={styles.kmsSectionCopy}>
              <p className={styles.kmsEyebrow}>{section.label}</p>
              <h2>{section.title}</h2>
              <p className={styles.kmsBody}>{section.body}</p>
              {"calloutTitle" in section ? (
                <div className={styles.kmsValidationCallout}>
                  <strong>{section.calloutTitle}</strong>
                  <p>{section.callout}</p>
                </div>
              ) : null}
            </div>
            <KmsVisualImage visual={kmsCaseStudy.visuals.validation} className={styles.kmsValidationVisual} />
          </div>
        </section>
      </ScrollReveal>
    );
  }

  const guidanceSection = section as Extract<KmsSection, { id: "contextual-guidance" }>;

  return (
    <ScrollReveal mode={revealMode}>
      <section className={[styles.kmsSection, isGuidance ? styles.kmsGuidanceSection : ""].join(" ")} id={guidanceSection.id}>
        <div className={styles.kmsGuidanceInner}>
          <div className={styles.kmsGuidanceContent}>
            <div className={styles.kmsGuidanceHeader}>
              <p className={styles.kmsEyebrow}>{guidanceSection.label}</p>
              <h2>{guidanceSection.title}</h2>
              <p className={styles.kmsBody}>{guidanceSection.body}</p>
            </div>

            <div className={styles.kmsGuidanceCards}>
              <article className={styles.kmsInfoCard}>
                <h3>{guidanceSection.cardsTitle}</h3>
                <div className={styles.kmsGuidanceList}>
                  {guidanceSection.points.map((point) => {
                    const title = typeof point === "string" ? point : point[0];
                    const body = typeof point === "string" ? null : point[1];
                    return (
                      <div key={title} className={styles.kmsGuidanceItem}>
                        <span><MaterialIcon name="info" /></span>
                        <div>
                          <h4>{title}</h4>
                          {body ? <p>{body}</p> : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
              <article className={styles.kmsInfoCard}>
                <h3>{guidanceSection.secondaryTitle}</h3>
                <p>{guidanceSection.secondaryBody}</p>
              </article>
            </div>
          </div>
          <KmsVisualImage visual={kmsCaseStudy.visuals.contextual} className={styles.kmsGuidanceVisual} />
        </div>
      </section>
    </ScrollReveal>
  );
}

function EpdIcon({ name, className }: { name: string; className?: string }) {
  return <MaterialIcon className={[styles.epdIcon, className].filter(Boolean).join(" ")} name={name} />;
}

function EpdSectionHeader({
  icon,
  label,
  title,
  body,
  highlightPhrases = [],
}: {
  icon: string;
  label: string;
  title: string;
  body?: string | readonly string[];
  highlightPhrases?: readonly string[];
}) {
  const bodyItems = Array.isArray(body) ? body : body ? [body] : [];

  return (
    <div className={styles.epdSectionHeader}>
      <Eyebrow as="div" className={styles.epdEyebrow} icon={<EpdIcon name={icon} />}>{label}</Eyebrow>
      <h2>{title}</h2>
      {bodyItems.map((paragraph) => (
        <p key={paragraph}><HighlightedText text={paragraph} phrases={highlightPhrases} /></p>
      ))}
    </div>
  );
}

function HighlightedText({ text, phrases }: { text: string; phrases: readonly string[] }) {
  if (phrases.length === 0) return text;
  const escaped = phrases.map((phrase) => phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const matcher = new RegExp(`(${escaped.join("|")})`, "g");
  const highlighted = new Set(phrases);

  return text.split(matcher).map((part, index) => (
    highlighted.has(part)
      ? <strong className={styles.epdTextHighlight} key={`${part}-${index}`}>{part}</strong>
      : part
  ));
}

const epdReferenceBase = "/assets/case-studies/ux-from-the-heart";

function EpdMediaFrame({
  src,
  alt,
  className,
  imageClassName,
  sizes = "(max-width: 48rem) 100vw, 50vw",
}: {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
}) {
  return (
    <div className={[styles.epdMediaFrame, className].filter(Boolean).join(" ")}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={[styles.epdMediaImage, imageClassName].filter(Boolean).join(" ")}
      />
    </div>
  );
}

function EpdModelVisual() {
  return (
    <div className={styles.epdCompareWrap}>
      <ImageCompare
        beforeSrc={`${epdReferenceBase}/before.png`}
        afterSrc={`${epdReferenceBase}/image-8.png`}
        beforeAlt="Previous EPD alpha interface"
        afterAlt="Updated EPD workflow interface"
        beforeLabel="Previous"
        afterLabel="Updated"
        beforeDescription="A fixed, fragmented interaction model that assumed one procedural path."
        afterDescription="A more adaptive procedure view that responds to the clinical situation in real time."
      />
    </div>
  );
}

function EpdHeartVisual() {
  return (
    <EpdMediaFrame
      src={`${epdReferenceBase}/epd-fcs-and-physician-interaction.png`}
      alt="Physician interacting with the cardiac mapping system during a clinical procedure."
      className={styles.epdPrincipleVisual}
      imageClassName={styles.epdMediaContain}
      sizes="(max-width: 48rem) 100vw, 44vw"
    />
  );
}

function EpdTimelineVisual({ index }: { index: number }) {
  const visuals = [
    {
      src: `${epdReferenceBase}/image-8.png`,
      alt: "Orientation and adaptive procedure view",
    },
    {
      src: `${epdReferenceBase}/image-6.png`,
      alt: "Integrated physiological data in the main procedure screen",
    },
    {
      src: `${epdReferenceBase}/image-7.png`,
      alt: "Contextual feedback and support visibility",
    },
  ] as const;

  return (
    <EpdMediaFrame
      src={visuals[index].src}
      alt={visuals[index].alt}
      className={styles.epdTimelineVisual}
      imageClassName={styles.epdMediaContain}
      sizes="(max-width: 48rem) 100vw, 46vw"
    />
  );
}

type EpdSection = (typeof epdCaseStudy.sections)[number];

function EpdSectionView({ section, index }: { section: EpdSection; index: number }) {
  if (section.variant === "roles") {
    return (
      <ScrollReveal mode="creative">
        <section className={[styles.epdSection, styles.epdWashGreen].join(" ")} id={section.id}>
          <div className={[styles.epdWrap, styles.epdSplit].join(" ")}>
            <EpdSectionHeader icon={section.icon} label={section.label} title={section.title} body={section.body} />
            <div className={styles.epdRoleList}>
              {section.roles.map(([, title, body], roleIndex) => (
                <article key={title}>
                  <EpdMediaFrame
                    src={roleIndex === 0 ? `${epdReferenceBase}/electrophysiologist.png` : `${epdReferenceBase}/ep-technician.png`}
                    alt={title}
                    className={styles.epdRoleMedia}
                    imageClassName={styles.epdMediaContain}
                    sizes="(max-width: 48rem) 100vw, 26vw"
                  />
                  <div>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>
    );
  }

  if (section.variant === "setup") {
    return (
      <ScrollReveal mode="overlap">
        <section className={styles.epdSection} id={section.id}>
          <div className={[styles.epdWrap, styles.epdFeatureSplit].join(" ")}>
            <EpdMediaFrame
              src={`${epdReferenceBase}/setup-built-around-the-procedure.png`}
              alt="Procedure setup wizard tailored to clinical workflow"
              className={styles.epdSetupVisual}
              imageClassName={styles.epdMediaContain}
              sizes="(max-width: 48rem) 100vw, 42vw"
            />
            <div>
              <EpdSectionHeader icon={section.icon} label={section.label} title={section.title} body={section.body} />
              <ul className={styles.epdCheckList}>
                {section.points.map((point) => <li key={point}><EpdIcon name="check_circle" />{point}</li>)}
              </ul>
            </div>
          </div>
          <div className={[styles.epdWrap, styles.epdSetupSecondary].join(" ")}>
            <p className={styles.epdSetupCaption}>Intuitive configuration wizard facilitated the workflow</p>
            <EpdMediaFrame
              src={`${epdReferenceBase}/setup-wizard.png`}
              alt="Setup Wizard interface"
              className={styles.epdSetupWizard}
              imageClassName={styles.epdMediaContain}
              sizes="(max-width: 48rem) 100vw, 74vw"
            />
          </div>
          <div className={[styles.epdWrap, styles.epdFeatureCards].join(" ")}>
            {section.features.map(([title, body], featureIndex) => (
              <article key={title}>
                <i aria-hidden="true"><EpdIcon name={featureIndex === 0 ? "tune" : featureIndex === 1 ? "widgets" : "favorite"} /></i>
                <span>Feature</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>
      </ScrollReveal>
    );
  }

  if (section.variant === "model") {
    return (
      <ScrollReveal mode="creative">
        <section className={[styles.epdSection, styles.epdWashGreen].join(" ")} id={section.id}>
          <div className={styles.epdWrap}>
            <EpdSectionHeader
              icon={section.icon}
              label={section.label}
              title={section.title}
              body={section.body}
              highlightPhrases={["not linear", "procedure type", "active catheter", "connected equipment", "physician preference", "patient condition"]}
            />
            <EpdModelVisual />
            <div className={styles.epdDriverGrid}>
              {section.drivers.map(([, title, body], driverIndex) => (
                <article key={title}>
                  <i aria-hidden="true"><EpdIcon name={driverIndex === 0 ? "conversion_path" : driverIndex === 1 ? "cable" : "monitor_heart"} /></i>
                  <span>Procedure driver</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>
    );
  }

  if (section.variant === "principle") {
    return (
      <ScrollReveal mode="overlap">
        <section className={styles.epdSection} id={section.id}>
          <div className={[styles.epdWrap, styles.epdPrinciple].join(" ")}>
            <EpdSectionHeader icon={section.icon} label={section.label} title={section.title} body={section.body} />
            <EpdHeartVisual />
          </div>
        </section>
      </ScrollReveal>
    );
  }

  return (
    <ScrollReveal mode={index % 2 === 0 ? "creative" : "overlap"}>
      <section className={[styles.epdSection, styles.epdWashGreen].join(" ")} id={section.id}>
        <div className={styles.epdWrap}>
          <EpdSectionHeader icon={section.icon} label={section.label} title={section.title} body={section.body} />
          <div className={styles.epdTimeline}>
            {section.timeline.map(([icon, title, body], timelineIndex) => (
              <article key={title}>
                <div className={styles.epdTimelineCopy}>
                  <div className={styles.epdTimelineHeading}>
                    <span><EpdIcon name={icon} /></span>
                    <h3>{title}</h3>
                  </div>
                  <p>{body}</p>
                </div>
                <EpdTimelineVisual index={timelineIndex} />
              </article>
            ))}
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
}

function EpdCaseStudy() {
  return (
    <main className={[styles.page, styles.epdPage].join(" ")}>
      <section className={styles.epdHero} data-ds-theme="dark" id={epdCaseStudy.heroAnchor}>
        <div className={[styles.epdBlob, styles.epdBlobRose].join(" ")} />
        <div className={[styles.epdBlob, styles.epdBlobGreen].join(" ")} />
        <div className={styles.epdHeroImageWrap} aria-hidden="true">
          <Image
            src="/assets/case-studies/ux-from-the-heart/hero-epd.png"
            alt=""
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className={styles.epdWrap}>
          <div className={styles.epdHeroCopy}>
            <Eyebrow as="div" className={styles.epdHeroEyebrow}>{epdCaseStudy.category}</Eyebrow>
            <h1>{epdCaseStudy.title}</h1>
            <p>{epdCaseStudy.statement}</p>
          </div>
        </div>
      </section>

      <ScrollReveal mode="overlap">
        <section className={styles.epdSection} id={epdCaseStudy.overview.id}>
          <div className={styles.epdWrap}>
            <div className={styles.epdOverview}>
              <EpdSectionHeader
                icon={epdCaseStudy.overview.icon}
                label={epdCaseStudy.overview.label}
                title={epdCaseStudy.overview.title}
              />
              <div className={styles.epdOverviewBody}>
                {epdCaseStudy.overview.body.map((paragraph, paragraphIndex) => (
                  <p key={paragraph}>
                    <HighlightedText
                      text={paragraph}
                      phrases={paragraphIndex === 1 ? ["real challenge", "redefine the MVP", "clinical adoption"] : []}
                    />
                  </p>
                ))}
              </div>
            </div>
            <dl className={styles.epdSnapshot}>
              {epdCaseStudy.snapshot.map(([term, value], snapshotIndex) => (
                <div className={styles.epdSnapshotCard} key={term}>
                  <span>{String(snapshotIndex + 1).padStart(2, "0")}</span>
                  <dt>{term}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </ScrollReveal>

      {epdCaseStudy.sections.map((section, index) => <EpdSectionView section={section} index={index} key={section.id} />)}

      <section className={styles.epdSection} id={epdCaseStudy.outcome.id}>
        <div className={styles.epdWrap}>
          <div className={styles.epdOutcome} data-ds-theme="dark">
            <div>
              <EpdSectionHeader
                icon={epdCaseStudy.outcome.icon}
                label={epdCaseStudy.outcome.label}
                title={epdCaseStudy.outcome.title}
                body={epdCaseStudy.outcome.body}
              />
            </div>
            <aside>
              <strong>{epdCaseStudy.outcome.stat}</strong>
              <span>{epdCaseStudy.outcome.statLabel}</span>
            </aside>
          </div>

          <div className={styles.epdTakeaway} id={epdCaseStudy.takeaway.id}>
            <EpdSectionHeader
              icon={epdCaseStudy.takeaway.icon}
              label={epdCaseStudy.takeaway.label}
              title={epdCaseStudy.takeaway.title}
              body={epdCaseStudy.takeaway.body}
            />
          </div>
        </div>
      </section>

      <ContextFab href="/experience/role-fit-agent" label="Next Case Study" icon="arrow_forward" />
    </main>
  );
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projectCards.find((item) => item.href.endsWith(`/${slug}`));

  if (!project) notFound();

  if (slug === bigRedButtonCaseStudy.slug) {
    return <BigRedHtmlCaseStudy />;
  }

  if (slug === "monitoring-product-intelligence") {
    return <MonitoringCaseStudy />;
  }

  if (slug === kmsCaseStudy.slug) {
    return (
      <main className={[styles.page, styles.kmsPage].join(" ")}>
        <section className={styles.kmsHero} data-ds-theme="dark" id="kms-hero">
          <div className={styles.kmsHeroCopy}>
            <p className={styles.kmsEyebrow}>{kmsCaseStudy.category}</p>
            <h1>{kmsCaseStudy.title}</h1>
            <p>{kmsCaseStudy.statement}</p>
          </div>
          <div className={styles.kmsHeroMedia}>
            <img src={kmsCaseStudy.heroImage} alt={kmsCaseStudy.heroImageAlt} />
          </div>
        </section>

        <ScrollReveal mode="overlap">
          <section className={styles.kmsSnapshot} id="project-snapshot">
            <div className={styles.kmsSnapshotLead}>
              <p className={styles.kmsEyebrow}>Project Snapshot</p>
              <h2>From complex knowledge to guided field action.</h2>
              <p>Howtool was a SaaS knowledge-management platform for organizations operating complex capital equipment. Managers created interactive guides in a web-based KMS, while field technicians used them through a mobile application for training and troubleshooting.</p>
              <p>The product vision was strong. The creation process was not: navigation was complex, publishing was unpredictable, and users often discovered errors only after content reached the field.</p>
            </div>
            <dl className={styles.kmsSnapshotGrid}>
              {kmsCaseStudy.snapshot.map(([term, title, description, icon]) => (
                <div key={term}>
                  <span className={styles.kmsSnapshotIcon}><MaterialIcon name={icon} /></span>
                  <dt>{term}</dt>
                  <dd>{title}</dd>
                  <small>{description}</small>
                </div>
              ))}
            </dl>
          </section>
        </ScrollReveal>

        {kmsCaseStudy.sections.map((section, index) => <KmsSectionView section={section} index={index} key={section.id} />)}

        <section className={styles.kmsClosing} id="why-it-still-matters" data-ds-theme="dark">
          <div>
            <p className={styles.kmsEyebrow}>Why It Still Matters</p>
            <h2>Before AI could generate the answer,<br />Howtool structured the logic.</h2>
            <p>Howtool did not generate knowledge. It structured expert logic so it could be reused as guided operational action.</p>
            <p>Many AI systems now aim to transform complex information into contextual assistance. Howtool addressed the same product question through rules, structured content, and workflow logic.</p>
          </div>
        </section>

        <ContextFab href="/experience/ux-from-the-heart" label="Next Case Study" icon="arrow_forward" />
      </main>
    );
  }

  if (slug === epdCaseStudy.slug) {
    return <EpdCaseStudy />;
  }

  if (slug !== c4iCaseStudy.slug) {
    return (
      <main className={styles.page}>
        <section className={styles.placeholder}>
          <p className={styles.eyebrow}>Case study</p>
          <h1>{project.title}</h1>
          <p>{project.summary}</p>
          <Link href="/experience">Back to Experience</Link>
        </section>
      </main>
    );
  }

  return <C4iHtmlCaseStudy />;
}
