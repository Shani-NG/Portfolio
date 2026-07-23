import type { CSSProperties } from "react";

export const motionTokens = {
  duration: {
    fast: "var(--ds-duration-fast)",
    base: "var(--ds-duration-base)",
    slow: "var(--ds-duration-slow)",
  },
  easing: {
    enter: "var(--ds-ease-enter)",
    exit: "var(--ds-ease-exit)",
    move: "var(--ds-ease-standard)",
  },
  distance: {
    sm: "var(--ds-distance-sm)",
    md: "var(--ds-distance-md)",
    lg: "var(--ds-distance-lg)",
  },
  stagger: {
    tight: "var(--ds-stagger-tight)",
    base: "var(--ds-stagger-base)",
  },
} as const;

export const motionPatterns = {
  fadeUp: {
    name: "fadeUp",
    intent: "Introduce a section without competing with its content.",
    duration: motionTokens.duration.slow,
    easing: motionTokens.easing.enter,
    distance: motionTokens.distance.md,
    reducedMotion: "opacity-only",
  },
  stagger: {
    name: "stagger",
    intent: "Reveal a meaningful list or card group in reading order.",
    duration: motionTokens.duration.base,
    easing: motionTokens.easing.enter,
    distance: motionTokens.distance.sm,
    staggerDelay: motionTokens.stagger.base,
    reducedMotion: "opacity-only",
  },
  hoverLift: {
    name: "hoverLift",
    intent: "Confirm a pointer affordance without changing layout.",
    duration: motionTokens.duration.fast,
    easing: motionTokens.easing.move,
    distance: motionTokens.distance.sm,
    reducedMotion: "color-and-border-only",
  },
  imageReveal: {
    name: "imageReveal",
    intent: "Bring attention to a central image while preserving its identity.",
    duration: motionTokens.duration.slow,
    easing: motionTokens.easing.enter,
    distance: motionTokens.distance.lg,
    reducedMotion: "opacity-only",
  },
} as const;

export type MotionPattern = keyof typeof motionPatterns;

export const scrollModes = {
  overlap: {
    name: "overlap",
    intent: "Let the incoming section gently take visual priority over the previous one.",
  },
  static: {
    name: "static",
    intent: "Keep the section stable when content clarity is more important than transition.",
  },
  creative: {
    name: "creative",
    intent: "Use a restrained image or accent reveal for a meaningful focal moment.",
  },
} as const;

export type ScrollMode = keyof typeof scrollModes;

export function motionStyle(pattern: MotionPattern): CSSProperties {
  const config = motionPatterns[pattern];

  return {
    "--motion-duration": config.duration,
    "--motion-easing": config.easing,
    "--motion-distance": config.distance,
    ...( "staggerDelay" in config
      ? { "--motion-stagger": config.staggerDelay }
      : {}),
  } as CSSProperties;
}
