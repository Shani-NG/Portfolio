"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AgentComposer } from "@/components/ui/agent-composer";
import styles from "./role-fit-conversation-entry.module.css";

const rotatingTerms = ["Product Strategy", "Vision & Innovation", "AI Workflows"];
const heroCompleteEvent = "portfolio-hero-animation-complete";

const quickActions = [
  { label: "Upload a job description", icon: "upload_file", action: "upload" as const },
  { label: "Paste job details", icon: "content_paste", action: "paste" as const },
  { label: "Explore my experience", icon: "travel_explore", action: "insert" as const, value: "Explore my experience" },
];

export function RoleFitConversationEntry() {
  const pathname = usePathname();
  const router = useRouter();
  const isRoleFitPage = pathname === "/minime";
  const [termIndex, setTermIndex] = useState(0);
  const [visibleLength, setVisibleLength] = useState(rotatingTerms[0].length);
  const [phase, setPhase] = useState<"typing" | "pause" | "deleting" | "nextPause">("pause");
  const [typingEnabled, setTypingEnabled] = useState(false);

  const activeTerm = rotatingTerms[termIndex];
  const visibleTerm = useMemo(() => activeTerm.slice(0, visibleLength), [activeTerm, visibleLength]);

  useEffect(() => {
    if (isRoleFitPage) {
      setTypingEnabled(true);
      return;
    }

    const storedAt = Number(sessionStorage.getItem(heroCompleteEvent));
    if (storedAt > 0) {
      setTypingEnabled(true);
      return;
    }

    const enableTyping = () => setTypingEnabled(true);
    window.addEventListener(heroCompleteEvent, enableTyping);

    return () => window.removeEventListener(heroCompleteEvent, enableTyping);
  }, [isRoleFitPage]);

  useEffect(() => {
    if (!typingEnabled) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reducedMotion.matches) {
      setVisibleLength(activeTerm.length);
      setPhase("pause");
      return;
    }

    const delay = phase === "pause" ? 1750 : phase === "deleting" ? 52 : phase === "nextPause" ? 250 : 72;
    const timeout = window.setTimeout(() => {
      if (phase === "typing") {
        if (visibleLength < activeTerm.length) {
          setVisibleLength((currentLength) => currentLength + 1);
          return;
        }

        setPhase("pause");
        return;
      }

      if (phase === "pause") {
        setPhase("deleting");
        return;
      }

      if (visibleLength > 0) {
        setVisibleLength((currentLength) => currentLength - 1);
        return;
      }

      if (phase === "nextPause") {
        setTermIndex((currentIndex) => (currentIndex + 1) % rotatingTerms.length);
        setPhase("typing");
        return;
      }

      setPhase("nextPause");
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [activeTerm.length, phase, typingEnabled, visibleLength]);

  useEffect(() => {
    if (phase === "typing" && visibleLength === 0) {
      setVisibleLength(1);
    }
  }, [phase, visibleLength]);

  return (
    <section className={styles.roleEntry} id="role-fit-agent" aria-labelledby="agent-title" data-page={isRoleFitPage ? "role-fit" : "home"}>
      <div className={styles.backgroundMark} aria-hidden="true" />
      <div className={styles.content}>
        <h2 className={styles.title} id="agent-title">
          <span>As challenges evolve, solutions take shape</span>
          <br />
          <span>through </span>
          <span className={styles.typedTerm}>
            {visibleTerm}
            <span className={styles.cursor} aria-hidden="true">
              |
            </span>
          </span>
        </h2>
        <p className={styles.supportingText}>
          <span>Explore the decisions and thinking behind my work</span>
          <span>Let&apos;s see how my experience can fit your challenges.</span>
        </p>

        <AgentComposer
          placeholder="Ask me anything about my experience or choose a starting point to begin the conversation."
          actions={quickActions}
          onSubmit={() => router.push("/minime")}
          state="empty"
        />
      </div>
    </section>
  );
}
