"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./home-cover-panel.module.css";

/** Pins only after the whole panel has passed through the available viewport. */
export function HomeCoverPanel({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = ref.current;
    if (!panel) return;
    const header = document.querySelector("header");
    const updateTop = () => {
      const headerHeight = header?.getBoundingClientRect().height ?? 0;
      const top = Math.min(headerHeight, window.innerHeight - panel.getBoundingClientRect().height);
      panel.style.setProperty("--home-cover-top", `${top}px`);
    };
    const observer = new ResizeObserver(updateTop);
    observer.observe(panel);
    if (header) observer.observe(header);
    window.addEventListener("resize", updateTop);
    updateTop();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateTop);
    };
  }, []);

  return <div ref={ref} className={styles.panel}>{children}</div>;
}
