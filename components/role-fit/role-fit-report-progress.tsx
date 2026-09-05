"use client";

import { useEffect, useState } from "react";
import styles from "./role-fit-report-progress.module.css";

type ProgressMode = "progress" | "success";

type RoleFitReportProgressProps = {
  mode?: ProgressMode;
};

const progressStages = [
  {
    copy: "Reviewing the role requirements",
    visualSrc: "/assets/role-fit/report-progress/index.html",
  },
  {
    copy: "Cross-checking the role against the resume",
    visualSrc: "/assets/role-fit/report-progress/b.html",
  },
  {
    copy: "Connecting relevant portfolio case studies",
    visualSrc: "/assets/role-fit/report-progress/c11.html",
  },
  {
    copy: "Building the role-fit report",
    visualSrc: "/assets/role-fit/report-progress/d9.html",
  },
  {
    copy: "Making sure nothing is missed",
    visualSrc: "/assets/role-fit/report-progress/e7.html",
  },
] as const;

const stageTransitionDelays = [3500, 7500, 11500, 15500] as const;

export function RoleFitReportProgress({ mode = "progress" }: RoleFitReportProgressProps) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (mode !== "progress") return;

    setStageIndex(0);
    const timers = stageTransitionDelays.map((delay, index) => (
      window.setTimeout(() => setStageIndex(index + 1), delay)
    ));

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [mode]);

  if (mode === "success") {
    return (
      <div className={`${styles.progressShell} ${styles.successShell}`} role="status" aria-live="polite">
        <div className={styles.successContent}>
          <p className={styles.eyebrow}>MATCH FOUND</p>
          <h2>Your report is ready.</h2>
        </div>
      </div>
    );
  }

  const stage = progressStages[stageIndex];

  return (
    <div className={styles.progressShell} role="status" aria-live="polite">
      <div className={styles.stageContent}>
        <p className={styles.eyebrow}>REQUIREMENTS TO FACTS</p>
        <h2>SCANNING</h2>
        <p className={styles.stageCopy} key={stage.copy}>{stage.copy}</p>
        <div className={styles.visualSurface} aria-hidden="true">
          <div className={styles.backgroundCircle} />
          {progressStages.map((progressStage, index) => (
            <iframe
              className={`${styles.visualFrame} ${index === stageIndex ? styles.activeFrame : ""}`}
              key={progressStage.visualSrc}
              src={progressStage.visualSrc}
              tabIndex={-1}
              title=""
            />
          ))}
        </div>
      </div>
    </div>
  );
}
