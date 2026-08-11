"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { MaterialIcon } from "@/components/ui/material-icon";
import type { ReportUIPayload } from "@/lib/role-fit/contracts";
import styles from "./role-fit-live-report.module.css";

type ReportItem = ReportUIPayload["requirementMapping"]["items"][number];
type EvidenceCluster = ReportUIPayload["evidencePanel"]["clusters"][number];

const fitAssets = {
  "fit-strong": "/assets/role-fit/fit-strong.png",
  "fit-good": "/assets/role-fit/fit-good.png",
  "fit-partial": "/assets/role-fit/fit-partial.png",
} as const;

const matchLabels: Record<ReportItem["matchType"], string> = {
  direct: "Direct evidence",
  semantic: "Semantic match",
  transferable: "Transferable match",
  partial: "Partial evidence",
  "insufficient-evidence": "Insufficient evidence",
  "real-gap": "Real gap",
};

const requirementIcons = ["strategy", "auto_awesome", "terminal", "groups", "health_and_safety"] as const;

function coverageCounts(report: ReportUIPayload) {
  const coverage = report.skillsMatch.visualCoverage;
  if (coverage.mode === "traceable-count") return coverage;
  const matchedCount = report.requirementMapping.items.filter((item) =>
    ["direct", "semantic", "transferable"].includes(item.matchType) && item.clusterIds.length > 0,
  ).length;
  return { matchedCount, totalCount: report.requirementMapping.items.length };
}

function optionalValue(value: string) {
  return value || "Not provided";
}

function Stat({ icon, label, tone, value }: { icon: string; label: string; tone: "success" | "purple" | "pink" | "gold"; value: string }) {
  const toneClass = `stat${tone[0].toUpperCase()}${tone.slice(1)}` as keyof typeof styles;
  return (
    <div className={`${styles.stat} ${styles[toneClass]}`}>
      <MaterialIcon className={styles.statIcon} name={icon} />
      <div className={styles.statCopy}>
        <span className={styles.statLabel} title={label}>{label}</span>
        <strong className={value === "Not provided" ? styles.mutedValue : undefined} title={value}>{value}</strong>
      </div>
    </div>
  );
}

function FitSummary({ report }: { report: ReportUIPayload }) {
  const fit = report.overallFitVisual;
  const [ringReady, setRingReady] = useState(false);

  useEffect(() => {
    setRingReady(false);
    const frame = window.requestAnimationFrame(() => setRingReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, [report.reportId]);

  if (fit.mode !== "fit") {
    return (
      <section className={`${styles.card} ${styles.fitCard} ${styles.limitedFit}`} aria-labelledby="fit-summary-title">
        <MaterialIcon className={styles.limitedIcon} name={fit.mode === "insufficient" ? "search_off" : "outbound"} />
        <span className={styles.eyebrow}>Role Fit Result</span>
        <h2 id="fit-summary-title">{fit.label}</h2>
      </section>
    );
  }

  const fitOffset = 327 - (327 * Math.min(100, Math.max(0, fit.fitVisualValue))) / 100;
  const ringStyle = {
    "--ring-offset": ringReady ? fitOffset : 327,
  } as CSSProperties;

  return (
    <section className={`${styles.card} ${styles.fitCard}`} aria-labelledby="fit-summary-title">
      <span className={styles.eyebrow}>Role Fit Result</span>
      <span className={styles.fitBadge}>{fit.label}</span>
      <div className={styles.ring} style={ringStyle} aria-label={fit.label}>
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle className={styles.ringTrack} cx="60" cy="60" r="52" />
          <circle className={styles.ringValue} cx="60" cy="60" r="52" />
        </svg>
        <div className={styles.ringCenter}>
          <Image alt="" aria-hidden="true" fill priority sizes="104px" src={fitAssets[fit.illustrationKey]} />
        </div>
      </div>
      <h3 id="fit-summary-title">Core Matching Skills</h3>
      <p className={styles.skillsSubtitle}>The strongest capabilities supporting this fit.</p>
      <div className={styles.skills}>
        {report.skillsMatch.items.map((skill) => (
          <span className={styles.skillChip} key={skill.itemId}>{skill.displayLabel || skill.originalText}</span>
        ))}
      </div>
    </section>
  );
}

function ProfileCard({ report }: { report: ReportUIPayload }) {
  const location = [report.roleSnapshot.location, report.roleSnapshot.workModel].filter(Boolean).join(" | ");
  const coverage = coverageCounts(report);
  const coveragePercent = coverage.totalCount > 0 ? Math.round((coverage.matchedCount / coverage.totalCount) * 100) : 0;
  const experience = report.roleSnapshot.yearsOfExperience
    ? `${report.roleSnapshot.yearsOfExperience}+ years`
    : report.roleSnapshot.seniority ?? "";

  return (
    <section className={`${styles.card} ${styles.profileCard}`} aria-labelledby="job-profile-title">
      <span className={styles.eyebrow}>Analyzed Job Profile</span>
      <h2 id="job-profile-title">{report.roleSnapshot.title}</h2>
      <p className={styles.company}>{report.roleSnapshot.company}</p>
      <div className={styles.profileDetails}>
        <p className={styles.profileSummary}>{report.overallFitVisual.rationale}</p>
        <div className={styles.stats}>
          <Stat icon="verified" label="Verified Requirements" tone="success" value={`${coverage.matchedCount} / ${coverage.totalCount}`} />
          <Stat icon="psychology" label="Core Skills Coverage" tone="purple" value={`${coveragePercent}%`} />
          <Stat icon="location_on" label="Location & Work Model" tone="pink" value={optionalValue(location)} />
          <Stat icon="workspace_premium" label="Required Experience" tone="gold" value={optionalValue(experience)} />
        </div>
      </div>
    </section>
  );
}

function EvidenceLink({ cluster, isOpen }: { cluster: EvidenceCluster; isOpen: boolean }) {
  if (cluster.destination.mode === "no-link") {
    return <p className={styles.sourceLabel}>Source: {cluster.title}</p>;
  }

  return (
    <Link className={styles.projectLink} href={cluster.destination.href} tabIndex={isOpen ? 0 : -1}>
      <span>View Case Study</span>
      <MaterialIcon name="arrow_forward" />
    </Link>
  );
}

function EvidenceContent({
  clusters,
  isOpen,
  rationale,
}: {
  clusters: EvidenceCluster[];
  isOpen: boolean;
  rationale: string;
}) {
  if (!clusters.length) {
    return (
      <div className={styles.noEvidence}>
        <MaterialIcon name="search_off" />
        <strong>No verified portfolio evidence found</strong>
        <p>This requirement is not supported by the approved portfolio evidence.</p>
      </div>
    );
  }

  return (
    <div className={styles.evidenceContent}>
      {clusters.map((cluster) => (
        <div className={styles.evidenceBlock} key={cluster.clusterId}>
          <div className={styles.evidenceLabel}>
            <MaterialIcon name="folder_open" />
            <span>Portfolio Evidence</span>
          </div>
          <h4>{cluster.project?.title || cluster.title}</h4>
          <p>{cluster.summary}</p>
          <div className={styles.supportReason}>
            <strong>Why this supports the requirement</strong>
            <p>{rationale}</p>
          </div>
          <EvidenceLink cluster={cluster} isOpen={isOpen} />
        </div>
      ))}
    </div>
  );
}

function EvidenceSection({ report }: { report: ReportUIPayload }) {
  const defaultItemId = report.requirementMapping.defaultSelectedItemId ?? report.requirementMapping.items[0]?.itemId;
  const [openIds, setOpenIds] = useState<Set<string>>(() => defaultItemId ? new Set([defaultItemId]) : new Set());
  const clusterById = new Map(report.evidencePanel.clusters.map((cluster) => [cluster.clusterId, cluster]));

  useEffect(() => {
    setOpenIds(defaultItemId ? new Set([defaultItemId]) : new Set());
  }, [defaultItemId, report.reportId]);

  return (
    <section className={`${styles.card} ${styles.evidenceSection}`} aria-labelledby="evidence-title">
      <div className={styles.sectionHeader}>
        <div>
          <span className={styles.evidenceEyebrow}>Requirements &amp; Evidence Mapping</span>
          <h2 id="evidence-title">Evidence Behind the Match</h2>
        </div>
        <p className={styles.instruction}><MaterialIcon name="touch_app" />Open a requirement to view its portfolio evidence</p>
      </div>
      <div className={styles.accordion}>
        {report.requirementMapping.items.map((item, index) => {
          const isOpen = openIds.has(item.itemId);
          const panelId = `evidence-panel-${report.reportId}-${item.itemId}`;
          const clusters = item.clusterIds.map((id) => clusterById.get(id)).filter((cluster): cluster is EvidenceCluster => Boolean(cluster));
          return (
            <article className={`${styles.requirement} ${isOpen ? styles.requirementOpen : ""}`} key={item.itemId}>
              <button
                aria-controls={panelId}
                aria-expanded={isOpen}
                className={styles.requirementTrigger}
                onClick={() => setOpenIds((current) => {
                  const next = new Set(current);
                  if (next.has(item.itemId)) next.delete(item.itemId);
                  else next.add(item.itemId);
                  return next;
                })}
                type="button"
              >
                <span className={styles.requirementIcon}><MaterialIcon name={requirementIcons[index % requirementIcons.length]} /></span>
                <span className={styles.requirementCopy}>
                  <strong title={item.displayLabel || item.originalText}>{item.displayLabel || item.originalText}</strong>
                  <small title={item.shortRationale}>{item.shortRationale}</small>
                  <span className={styles.matchLabel}>{matchLabels[item.matchType]} | {item.evidenceConfidence.replaceAll("-", " ")}</span>
                </span>
                <MaterialIcon className={styles.chevron} name="expand_more" />
              </button>
              <div aria-hidden={!isOpen} className={styles.panelWrap} id={panelId} inert={!isOpen}>
                <div className={styles.panelInner}>
                  <EvidenceContent clusters={clusters} isOpen={isOpen} rationale={item.shortRationale} />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ListCard({ title, tone, items, wide = false }: { title: string; tone: "strength" | "gap"; items: ReportItem[]; wide?: boolean }) {
  return (
    <section className={`${styles.card} ${styles.listCard} ${tone === "strength" ? styles.strengthCard : styles.gapCard} ${wide ? styles.strengthWide : ""}`}>
      <h2><MaterialIcon name={tone === "strength" ? "check" : "warning"} />{title}</h2>
      {items.length ? (
        <ul>
          {items.map((item) => (
            <li key={item.itemId}>
              <MaterialIcon name={tone === "strength" ? "check" : "error_outline"} />
              <span>
                <strong>{item.displayLabel || item.originalText}</strong>
                <small>{tone === "gap" ? `${matchLabels[item.matchType]} | ` : ""}{item.shortRationale}</small>
              </span>
            </li>
          ))}
        </ul>
      ) : <p className={styles.emptyState}>No items supplied for this section.</p>}
    </section>
  );
}

export function RoleFitLiveReport({ report, onStartNewAnalysis }: { report: ReportUIPayload; onStartNewAnalysis: () => void }) {
  const fitClass = report.overallFitVisual.mode === "fit"
    ? styles[report.overallFitVisual.level]
    : styles.limited;

  return (
    <div className={`${styles.report} ${fitClass}`} dir={report.language === "he" ? "rtl" : "ltr"} id="role-fit-live-report">
      <header className={styles.reportHeader}>
        <div className={styles.brand}>
          <span className={styles.avatar} aria-hidden="true">S</span>
          <div>
            <h1>Shani Nakash-Gomel - Smart Role Fit</h1>
            <p>A concise role-fit report grounded in verified portfolio evidence.</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.outcomeBadge}>{report.overallFitVisual.label}</span>
          <button className={styles.newAnalysisButton} onClick={onStartNewAnalysis} type="button">Start new analysis</button>
        </div>
      </header>

      <div className={styles.reportGrid}>
        <FitSummary report={report} />
        <ProfileCard report={report} />
        <EvidenceSection report={report} />
        <ListCard items={report.topStrengths.items} title="Top Strengths" tone="strength" wide={report.keyGaps.items.length === 0} />
        {report.keyGaps.items.length > 0 ? <ListCard items={report.keyGaps.items} title="Key Gaps" tone="gap" /> : null}
        <p className={styles.disclaimer}>{report.disclaimer.text}</p>
        {report.contactCta.enabled && report.contactCta.href ? (
          <section className={styles.contactCta}>
            <h2>Let&apos;s build something great together</h2>
            <Link className={styles.contactButton} href={report.contactCta.href}>
              <MaterialIcon name="mail" />
              <span>{report.contactCta.label}</span>
            </Link>
          </section>
        ) : null}
      </div>
    </div>
  );
}
