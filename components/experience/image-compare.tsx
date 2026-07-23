"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import styles from "./image-compare.module.css";

type ImageCompareProps = {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
  beforeLabel?: string;
  afterLabel?: string;
  beforeDescription?: string;
  afterDescription?: string;
};

export function ImageCompare({
  beforeSrc,
  afterSrc,
  beforeAlt,
  afterAlt,
  beforeLabel = "Before",
  afterLabel = "After",
  beforeDescription,
  afterDescription,
}: ImageCompareProps) {
  const [position, setPosition] = useState(52);
  const style = useMemo(() => ({ "--compare-position": `${position}%` } as CSSProperties), [position]);

  return (
    <div>
      <div className={styles.root} style={style}>
        <div className={styles.surface}>
          <Image src={beforeSrc} alt={beforeAlt} fill sizes="(max-width: 48rem) 100vw, 72vw" />
          <div className={[styles.labelGroup, styles.labelGroupBefore].join(" ")}>
            <span className={[styles.label, styles.labelBefore].join(" ")}>{beforeLabel}</span>
            {beforeDescription ? <p className={styles.note}>{beforeDescription}</p> : null}
          </div>
        </div>
        <div className={[styles.surface, styles.after].join(" ")}>
          <Image src={afterSrc} alt={afterAlt} fill sizes="(max-width: 48rem) 100vw, 72vw" />
          <div className={[styles.labelGroup, styles.labelGroupAfter].join(" ")}>
            <span className={[styles.label, styles.labelAfter].join(" ")}>{afterLabel}</span>
            {afterDescription ? <p className={styles.note}>{afterDescription}</p> : null}
          </div>
        </div>
        <div className={styles.scrim} aria-hidden="true" />
        <div className={styles.divider} aria-hidden="true" />
        <div className={styles.handle} aria-hidden="true">
          <i />
          <b />
        </div>
        <input
          className={styles.input}
          type="range"
          min={0}
          max={100}
          value={position}
          aria-label="Reveal updated clinical interface"
          onChange={(event) => setPosition(Number(event.target.value))}
        />
      </div>
    </div>
  );
}
