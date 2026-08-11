"use client";

import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";
import type { ScrollMode } from "@/lib/motion";
import styles from "./scroll-reveal.module.css";

type ScrollRevealProps = {
  children: ReactNode;
  mode?: ScrollMode;
  className?: string;
  delayMs?: number;
};

export function ScrollReveal({ children, mode = "overlap", className, delayMs = 0 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const revealHashTarget = () => {
      const targetId = decodeURIComponent(window.location.hash.slice(1));
      const target = targetId ? document.getElementById(targetId) : null;
      if (target && element.contains(target)) {
        setIsVisible(true);
        return true;
      }
      return false;
    };

    if (revealHashTarget()) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -8%" },
    );

    observer.observe(element);
    window.addEventListener("hashchange", revealHashTarget);
    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", revealHashTarget);
    };
  }, []);

  return (
    <div
      className={[styles.reveal, styles[mode], isVisible ? styles.visible : "", className]
        .filter(Boolean)
        .join(" ")}
      ref={ref}
      data-scroll-mode={mode}
      style={{ "--scroll-reveal-delay": `${delayMs}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
