"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import type { ScrollMode } from "@/lib/motion";
import styles from "./scroll-reveal.module.css";

type ScrollRevealProps = {
  children: ReactNode;
  mode?: ScrollMode;
  className?: string;
};

export function ScrollReveal({ children, mode = "overlap", className }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

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
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={[styles.reveal, styles[mode], isVisible ? styles.visible : "", className]
        .filter(Boolean)
        .join(" ")}
      ref={ref}
      data-scroll-mode={mode}
    >
      {children}
    </div>
  );
}
