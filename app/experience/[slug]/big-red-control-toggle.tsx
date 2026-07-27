"use client";

import { useState } from "react";
import styles from "./page.module.css";

type ControlOption = {
  label: string;
  title: string;
  body: string;
  image: string;
  imageAlt: string;
};

function BigRedInlineImage({ src, alt }: { src: string; alt: string }) {
  return <img className={styles.bigRedInlineImage} src={src} alt={alt} />;
}

export function BigRedControlToggle({ options }: { options: ControlOption[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = options[activeIndex] ?? options[0];

  return (
    <div className={styles.controlTogglePanel}>
      <div className={styles.controlToggleVisual}>
        <BigRedInlineImage src={active.image} alt={active.imageAlt} />
      </div>

      <div className={styles.controlToggleCopy}>
        <div className={styles.controlToggleTabs} role="tablist" aria-label="Control level">
          {options.map((option, index) => (
            <button
              aria-controls="control-toggle-panel"
              aria-selected={activeIndex === index}
              className={styles.controlToggleTab}
              id={`control-toggle-tab-${index}`}
              key={option.label}
              onClick={() => setActiveIndex(index)}
              role="tab"
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        <div
          aria-labelledby={`control-toggle-tab-${activeIndex}`}
          className={styles.controlToggleText}
          id="control-toggle-panel"
          role="tabpanel"
        >
          <span>{active.label}</span>
          <h4>{active.title}</h4>
          <p>{active.body}</p>
        </div>
      </div>
    </div>
  );
}
