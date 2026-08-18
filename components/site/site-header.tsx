"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { MaterialIcon } from "@/components/ui/material-icon";
import { navigationItems, projects } from "@/lib/navigation";
import styles from "./site-header.module.css";

function Chevron() {
  return <MaterialIcon className={styles.chevron} name="keyboard_arrow_down" />;
}

function MenuIcon({ open }: { open: boolean }) {
  return <MaterialIcon name={open ? "close" : "menu"} />;
}

export function SiteHeader() {
  const pathname = usePathname();
  const menuId = useId();
  const projectMenuId = useId();
  const experienceRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [activeHash, setActiveHash] = useState("");

  useEffect(() => {
    setMenuOpen(false);
    setProjectsOpen(false);
  }, [pathname]);

  useEffect(() => {
    function syncActiveHash() {
      setActiveHash(window.location.hash);
    }

    syncActiveHash();
    window.addEventListener("hashchange", syncActiveHash);
    return () => window.removeEventListener("hashchange", syncActiveHash);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setProjectsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);

    return () => document.body.classList.remove("menu-open");
  }, [menuOpen]);

  useEffect(() => {
    if (!projectsOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (target instanceof Node && experienceRef.current?.contains(target)) return;

      setProjectsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [projectsOpen]);

  useEffect(() => {
    window.localStorage.removeItem("portfolio-theme");
    document.documentElement.dataset.dsTheme = "dark";
  }, []);

  const isRoleFitActive = pathname.startsWith("/minime");
  const isExperienceActive = pathname.startsWith("/experience");
  const isAboutActive = pathname === navigationItems.about.href;
  const isContactActive = pathname === navigationItems.contact.href;

  function closeMenu() {
    setMenuOpen(false);
    setProjectsOpen(false);
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.brand} href="/" onClick={closeMenu}>
          <span>Shani Nakash-Gomel</span>
        </Link>

        <button
          aria-controls={menuId}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          className={styles.menuToggle}
          onClick={() => {
            setMenuOpen((open) => !open);
            setProjectsOpen(false);
          }}
          type="button"
        >
          <MenuIcon open={menuOpen} />
        </button>

        <nav
          aria-label="Main navigation"
          className={`${styles.navigation} ${menuOpen ? styles.navigationOpen : ""}`}
          id={menuId}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeMenu();
          }}
        >
          <Link className={`${styles.navLink} ${isAboutActive ? styles.active : ""}`} href={navigationItems.about.href} onClick={closeMenu}>
            {navigationItems.about.label}
          </Link>

          <div
            ref={experienceRef}
            className={`${styles.experienceItem} ${isExperienceActive ? styles.active : ""}`}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setProjectsOpen(false);
              }
            }}
          >
            <Link className={`${styles.navLink} ${styles.experiencePrimary}`} href={navigationItems.experience.href} onClick={closeMenu}>
              {navigationItems.experience.label}
            </Link>
            <button
              aria-controls={projectMenuId}
              aria-expanded={projectsOpen}
              aria-label={projectsOpen ? "Close experience projects menu" : "Open experience projects menu"}
              className={styles.experienceButton}
              onClick={() => setProjectsOpen((open) => !open)}
              type="button"
            >
              <Chevron />
            </button>
            <div className={`${styles.projectMenu} ${projectsOpen ? styles.projectMenuOpen : ""}`} id={projectMenuId}>
              {projects.map((project) => (
                <Link className={styles.projectLink} href={project.href} key={project.href} onClick={closeMenu}>
                  {project.label}
                </Link>
              ))}
            </div>
          </div>

          <Link className={`${styles.navLink} ${isRoleFitActive ? styles.active : ""}`} href={navigationItems.roleFit.href} onClick={closeMenu}>
            {navigationItems.roleFit.label}
          </Link>
          <Link className={`${styles.navLink} ${isContactActive ? styles.active : ""}`} href={navigationItems.contact.href} onClick={closeMenu}>
            {navigationItems.contact.label}
          </Link>
        </nav>
      </div>
    </header>
  );
}
