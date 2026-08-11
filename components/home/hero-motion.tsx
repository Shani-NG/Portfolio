"use client";

import { useEffect, useRef, useState } from "react";
import { MaterialIcon } from "@/components/ui/material-icon";
import styles from "./hero-motion.module.css";

const heroSessionKey = "portfolio-hero-animation-complete";
const heroSessionDuration = 30 * 60 * 1000;
const heroCompleteEvent = "portfolio-hero-animation-complete";

export function HeroMotion() {
  const motionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const visualGroupRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const [started, setStarted] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [restored, setRestored] = useState(false);

  function updatePointerPosition(clientX: number, clientY: number) {
    const bounds = motionRef.current?.getBoundingClientRect();

    if (!bounds) return;

    motionRef.current?.style.setProperty("--hero-pointer-x", `${clientX - bounds.left}px`);
    motionRef.current?.style.setProperty("--hero-pointer-y", `${clientY - bounds.top}px`);
    motionRef.current?.style.setProperty("--hero-pointer-opacity", "1");
  }

  function alignTextWithComposition() {
    const viewport = viewportRef.current;
    const copy = copyRef.current;
    const stage = stageRef.current;
    const visualGroup = visualGroupRef.current;

    if (!viewport || !copy || !stage || !visualGroup) return;

    const copyBounds = copy.getBoundingClientRect();
    const compositionGap = Number.parseFloat(getComputedStyle(motionRef.current!).getPropertyValue("--hero-composition-gap")) || 0;

    motionRef.current?.style.setProperty("--hero-visual-offset", `${(copyBounds.height + compositionGap) / 2}px`);

    const stageBounds = stage.getBoundingClientRect();
    const viewportBounds = viewport.getBoundingClientRect();
    const targetTop = stageBounds.top - viewportBounds.top - compositionGap - copyBounds.height;
    const currentTop = (viewport.clientHeight - copyBounds.height) / 2;

    motionRef.current?.style.setProperty("--hero-text-offset", `${targetTop - currentTop}px`);
  }

  function triggerAnimation() {
    if (startedRef.current) return;

    alignTextWithComposition();
    startedRef.current = true;
    motionRef.current?.setAttribute("data-started", "true");
    motionRef.current?.setAttribute("data-restored", "false");
    setStarted(true);

    const revealDelay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 50 : 2000;
    window.setTimeout(() => {
      motionRef.current?.setAttribute("data-complete", "true");
      setAnimationComplete(true);
      sessionStorage.setItem(heroSessionKey, String(Date.now()));
      window.dispatchEvent(new Event(heroCompleteEvent));
    }, revealDelay);
  }

  function startAnimationFromScrollGesture(event?: { preventDefault?: () => void }) {
    if (startedRef.current) return;

    event?.preventDefault?.();
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    triggerAnimation();
  }

  useEffect(() => {
    const navigationEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const storedAt = Number(sessionStorage.getItem(heroSessionKey));
    const sessionIsValid = storedAt > 0 && Date.now() - storedAt < heroSessionDuration;
    const shouldRestoreCompletedState = navigationEntry?.type !== "reload" && sessionIsValid;

    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    if (navigationEntry?.type === "reload" || !sessionIsValid) {
      sessionStorage.removeItem(heroSessionKey);
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }

    if (shouldRestoreCompletedState) {
      startedRef.current = true;
      motionRef.current?.setAttribute("data-started", "true");
      motionRef.current?.setAttribute("data-complete", "true");
      motionRef.current?.setAttribute("data-restored", "true");
      setStarted(true);
      setAnimationComplete(true);
      setRestored(true);
      window.dispatchEvent(new Event(heroCompleteEvent));
    }

    function handleWheel(event: WheelEvent) {
      if (event.deltaY <= 0) return;

      if (!startedRef.current) {
        startAnimationFromScrollGesture(event);
      }
    }

    function handleScroll() {
      if (startedRef.current || window.scrollY <= 8) return;

      startAnimationFromScrollGesture();
    }

    function handleTouchMove(event: TouchEvent) {
      if (!startedRef.current) {
        startAnimationFromScrollGesture(event);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (!["ArrowDown", "PageDown", " ", "End"].includes(event.key)) return;

      if (!startedRef.current) {
        startAnimationFromScrollGesture(event);
      }
    }

    document.addEventListener("wheel", handleWheel, { passive: false, capture: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false, capture: true });
    document.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    let frame = window.requestAnimationFrame(function watchScrollPosition() {
      handleScroll();

      if (!startedRef.current) {
        frame = window.requestAnimationFrame(watchScrollPosition);
      }
    });

    return () => {
      document.removeEventListener("wheel", handleWheel, { capture: true });
      document.removeEventListener("touchmove", handleTouchMove, { capture: true });
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("scroll", handleScroll, { capture: true });
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!started) return;

    function handleResize() {
      const viewport = viewportRef.current;
      const copy = copyRef.current;
      const stage = stageRef.current;
      const visualGroup = visualGroupRef.current;

      if (!viewport || !copy || !stage || !visualGroup) return;

      const copyBounds = copy.getBoundingClientRect();
      const compositionGap = Number.parseFloat(getComputedStyle(motionRef.current!).getPropertyValue("--hero-composition-gap")) || 0;

      motionRef.current?.style.setProperty("--hero-visual-offset", `${(copyBounds.height + compositionGap) / 2}px`);

      const stageBounds = stage.getBoundingClientRect();
      const viewportBounds = viewport.getBoundingClientRect();
      const targetTop = stageBounds.top - viewportBounds.top - compositionGap - copyBounds.height;
      const currentTop = (viewport.clientHeight - copyBounds.height) / 2;

      motionRef.current?.style.setProperty("--hero-text-offset", `${targetTop - currentTop}px`);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [started]);

  return (
    <section
      className={styles.heroMotion}
      ref={motionRef}
      data-started={started}
      data-complete={animationComplete}
      data-restored={restored}
      onWheel={(event) => {
        if (event.deltaY > 0) startAnimationFromScrollGesture(event);
      }}
      onTouchMove={(event) => startAnimationFromScrollGesture(event)}
      onKeyDown={(event) => {
        if (["ArrowDown", "PageDown", " ", "End"].includes(event.key)) {
          startAnimationFromScrollGesture(event);
        }
      }}
    >
      <div className={styles.heroViewport} ref={viewportRef}>
        <div
          className={styles.heroText}
          aria-labelledby="home-title"
          onPointerMove={(event) => {
            if (event.pointerType !== "mouse" || !animationComplete) return;
            updatePointerPosition(event.clientX, event.clientY);
          }}
          onPointerLeave={() => motionRef.current?.style.setProperty("--hero-pointer-opacity", "0")}
        >
          <div className={styles.heroCopy} ref={copyRef}>
            <h1 id="home-title">KEEP IT COMPLEX</h1>
            <p>I&apos;ll take it from there.</p>
          </div>
        </div>

        <div className={styles.heroVisualGroup} ref={visualGroupRef}>
          <div
            className={styles.animationStage}
            ref={stageRef}
            aria-label="Solutions emerging from complexity"
            onPointerMove={(event) => {
              if (event.pointerType !== "mouse" || !animationComplete) return;
              updatePointerPosition(event.clientX, event.clientY);
            }}
            onPointerLeave={() => motionRef.current?.style.setProperty("--hero-pointer-opacity", "0")}
          >
            <img className={`${styles.stageImage} ${styles.illustration}`} src="/assets/hero-home.png" alt="" onAnimationEnd={(event) => {
              if (event.animationName !== "heroArtReveal") return;
              setAnimationComplete(true);
              sessionStorage.setItem(heroSessionKey, String(Date.now()));
              window.dispatchEvent(new Event(heroCompleteEvent));
            }} />
            <img className={`${styles.stageImage} ${styles.profile}`} src="/assets/hero-bg-profile.png" alt="Shani Nakash-Gomel" />
            <div className={styles.pointerGlow} aria-hidden="true" />
          </div>
          <a className={styles.contactCta} href="/contact?source=portfolio-cta">
            LET&apos;S CONNECT
            <MaterialIcon name="arrow_forward" />
          </a>
        </div>
      </div>
    </section>
  );
}
