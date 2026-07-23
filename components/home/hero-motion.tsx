"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./hero-motion.module.css";

const heroSessionKey = "portfolio-hero-animation-complete";
const heroSessionDuration = 30 * 60 * 1000;
const heroCompleteEvent = "portfolio-hero-animation-complete";

export function HeroMotion() {
  const motionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const [started, setStarted] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const navigationEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const storedAt = Number(sessionStorage.getItem(heroSessionKey));
    const sessionIsValid = storedAt > 0 && Date.now() - storedAt < heroSessionDuration;
    const pageIsAlreadyScrolled = window.scrollY > 8;

    if (navigationEntry?.type === "reload" || !sessionIsValid) {
      sessionStorage.removeItem(heroSessionKey);
    }

    if ((navigationEntry?.type !== "reload" && sessionIsValid) || pageIsAlreadyScrolled) {
      startedRef.current = true;
      setStarted(true);
      setAnimationComplete(true);
      setRestored(true);
      window.dispatchEvent(new Event(heroCompleteEvent));
    }

    function alignTextWithComposition() {
      const viewport = viewportRef.current;
      const copy = copyRef.current;
      const stage = stageRef.current;

      if (!viewport || !copy || !stage) return;

      const copyBounds = copy.getBoundingClientRect();
      const stageBounds = stage.getBoundingClientRect();
      const compositionGap = Number.parseFloat(getComputedStyle(motionRef.current!).getPropertyValue("--hero-composition-gap")) || 0;
      const viewportBounds = viewport.getBoundingClientRect();
      const targetTop = stageBounds.top - viewportBounds.top - compositionGap - copyBounds.height;
      const currentTop = (viewport.clientHeight - copyBounds.height) / 2;

      motionRef.current?.style.setProperty("--hero-text-offset", `${targetTop - currentTop}px`);
    }

    function restoreCompletedAnimation() {
      if (startedRef.current || window.scrollY <= 8) return;

      alignTextWithComposition();
      startedRef.current = true;
      setStarted(true);
      setAnimationComplete(true);
      setRestored(true);
    }

    function triggerAnimation() {
      if (startedRef.current) return;

      alignTextWithComposition();
      startedRef.current = true;
      setStarted(true);

      const revealDelay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 50 : 2400;
      window.setTimeout(() => {
        setAnimationComplete(true);
        sessionStorage.setItem(heroSessionKey, String(Date.now()));
        window.dispatchEvent(new Event(heroCompleteEvent));
      }, revealDelay);
    }

    function handleWheel(event: WheelEvent) {
      if (event.deltaY <= 0) return;

      if (!startedRef.current) {
        triggerAnimation();
      }
    }

    function handleTouchMove(event: TouchEvent) {
      if (!startedRef.current) {
        triggerAnimation();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (!["ArrowDown", "PageDown", " ", "End"].includes(event.key)) return;

      if (!startedRef.current) triggerAnimation();
    }

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", restoreCompletedAnimation, { passive: true });
    const frame = window.requestAnimationFrame(restoreCompletedAnimation);
    const timeout = window.setTimeout(restoreCompletedAnimation, 120);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", restoreCompletedAnimation);
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!started) return;

    function handleResize() {
      const viewport = viewportRef.current;
      const copy = copyRef.current;
      const stage = stageRef.current;

      if (!viewport || !copy || !stage) return;

      const copyBounds = copy.getBoundingClientRect();
      const stageBounds = stage.getBoundingClientRect();
      const viewportBounds = viewport.getBoundingClientRect();
      const compositionGap = Number.parseFloat(getComputedStyle(motionRef.current!).getPropertyValue("--hero-composition-gap")) || 0;
      const targetTop = stageBounds.top - viewportBounds.top - compositionGap - copyBounds.height;
      const currentTop = (viewport.clientHeight - copyBounds.height) / 2;

      motionRef.current?.style.setProperty("--hero-text-offset", `${targetTop - currentTop}px`);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [started]);

  return (
    <section className={styles.heroMotion} ref={motionRef} data-started={started} data-complete={animationComplete} data-restored={restored}>
      <div className={styles.heroViewport} ref={viewportRef}>
        <div
          className={styles.heroText}
          aria-labelledby="home-title"
          onPointerMove={(event) => {
            if (event.pointerType !== "mouse" || !animationComplete) return;
            const bounds = event.currentTarget.getBoundingClientRect();
            event.currentTarget.style.setProperty("--hero-text-pointer-x", `${event.clientX - bounds.left}px`);
            event.currentTarget.style.setProperty("--hero-text-pointer-y", `${event.clientY - bounds.top}px`);
            event.currentTarget.style.setProperty("--hero-text-pointer-opacity", "1");
          }}
          onPointerLeave={(event) => event.currentTarget.style.setProperty("--hero-text-pointer-opacity", "0")}
        >
          <div className={styles.heroCopy} ref={copyRef}>
            <h1 id="home-title">KEEP IT COMPLEX</h1>
            <p>I&apos;ll take it from there.</p>
          </div>
        </div>

        <div className={styles.heroVisualGroup}>
          <div
            className={styles.animationStage}
            ref={stageRef}
            aria-label="Solutions emerging from complexity"
            onPointerMove={(event) => {
              if (event.pointerType !== "mouse" || !animationComplete) return;
              const bounds = event.currentTarget.getBoundingClientRect();
              event.currentTarget.style.setProperty("--hero-pointer-x", `${event.clientX - bounds.left}px`);
              event.currentTarget.style.setProperty("--hero-pointer-y", `${event.clientY - bounds.top}px`);
              event.currentTarget.style.setProperty("--hero-pointer-opacity", "1");
            }}
            onPointerLeave={(event) => event.currentTarget.style.setProperty("--hero-pointer-opacity", "0")}
          >
            <img className={`${styles.stageImage} ${styles.illustration}`} src="/assets/hero-dark.png" alt="" onAnimationEnd={(event) => {
              if (event.animationName !== "heroArtReveal") return;
              setAnimationComplete(true);
              sessionStorage.setItem(heroSessionKey, String(Date.now()));
              window.dispatchEvent(new Event(heroCompleteEvent));
            }} />
            <img className={`${styles.stageImage} ${styles.profile}`} src="/assets/hero-bg-profile.png" alt="Shani Nakash-Gomel" />
            <div className={styles.pointerGlow} aria-hidden="true" />
          </div>
          <a className={styles.contactCta} href="/contact">
            Let&apos;s Connect
          </a>
        </div>
      </div>
    </section>
  );
}
