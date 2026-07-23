"use client";

import type { CSSProperties, PointerEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MaterialIcon } from "@/components/ui/material-icon";
import { projectCards } from "@/lib/portfolio-content";
import styles from "./selected-work-gallery.module.css";

const shortestLoopOffset = (index: number, activeIndex: number, total: number) => {
  const rawOffset = index - activeIndex;
  const half = Math.floor(total / 2);

  if (rawOffset > half) {
    return rawOffset - total;
  }

  if (rawOffset < -half) {
    return rawOffset + total;
  }

  return rawOffset;
};

export function SelectedWorkGallery() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const total = projectCards.length;

  const positionedProjects = useMemo(
    () =>
      projectCards.map((project, index) => ({
        ...project,
        offset: shortestLoopOffset(index, activeIndex, total),
      })),
    [activeIndex, total],
  );

  const move = (direction: 1 | -1) => {
    setActiveIndex((current) => (current + direction + total) % total);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStart === null) {
      return;
    }

    const distance = event.clientX - dragStart;
    setDragStart(null);

    if (Math.abs(distance) < 42) {
      return;
    }

    move(distance < 0 ? 1 : -1);
  };

  return (
    <div className={styles.gallery} aria-roledescription="carousel" aria-label="Selected work projects">
      <div
        className={styles.stage}
        onPointerDown={(event) => setDragStart(event.clientX)}
        onPointerLeave={() => setDragStart(null)}
        onPointerUp={handlePointerUp}
      >
        {positionedProjects.map((project, index) => {
          const isActive = project.offset === 0;

          return (
            <article
              className={styles.projectCard}
              data-accent={project.accent}
              data-active={isActive}
              key={project.href}
              onClick={!isActive ? () => setActiveIndex(index) : undefined}
              onKeyDown={!isActive ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setActiveIndex(index);
                }
              } : undefined}
              role={!isActive ? "button" : undefined}
              style={
                {
                  "--offset": project.offset,
                  "--abs-offset": Math.abs(project.offset),
                } as CSSProperties
              }
              tabIndex={!isActive ? 0 : undefined}
            >
              <div className={styles.imageFrame}>
                <Image src={project.image} alt={project.imageAlt} fill sizes="(max-width: 48rem) 84vw, 34rem" priority={isActive} />
              </div>
              <div className={styles.cardBody}>
                <p className={styles.category}>{project.category}</p>
                <h3>{project.title}</h3>
                <p>{project.summary}</p>
                {isActive ? (
                  <Link className={styles.projectLink} href={project.href}>
                    View project
                    <MaterialIcon name="arrow_forward" />
                  </Link>
                ) : (
                  <span className={`${styles.projectLink} ${styles.projectLinkDisabled}`} aria-disabled="true">
                    View project
                    <MaterialIcon name="arrow_forward" />
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className={styles.controls} aria-label="Gallery controls">
        <button className={styles.controlButton} type="button" onClick={() => move(-1)} aria-label="Previous project">
          <MaterialIcon name="arrow_back" />
        </button>
        <div className={styles.indicators} aria-label="Project position">
          {projectCards.map((project, index) => (
            <button
              aria-label={`Show ${project.title}`}
              aria-current={activeIndex === index}
              className={styles.indicator}
              key={project.href}
              onClick={() => setActiveIndex(index)}
              type="button"
            />
          ))}
        </div>
        <button className={styles.controlButton} type="button" onClick={() => move(1)} aria-label="Next project">
          <MaterialIcon name="arrow_forward" />
        </button>
      </div>
    </div>
  );
}
