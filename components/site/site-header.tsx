"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [activeHash, setActiveHash] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("dark");

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
    const storedTheme = window.localStorage.getItem("portfolio-theme");
    const resolvedTheme = storedTheme === "light" || storedTheme === "dark" ? storedTheme : "dark";

    setTheme(resolvedTheme);
    document.documentElement.dataset.dsTheme = resolvedTheme;
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";

    setTheme(nextTheme);
    document.documentElement.dataset.dsTheme = nextTheme;
    window.localStorage.setItem("portfolio-theme", nextTheme);
  }

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
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          <MenuIcon open={menuOpen} />
        </button>

        <nav aria-label="Main navigation" className={`${styles.navigation} ${menuOpen ? styles.navigationOpen : ""}`} id={menuId}>
          <Link className={`${styles.navLink} ${isAboutActive ? styles.active : ""}`} href={navigationItems.about.href} onClick={closeMenu}>
            {navigationItems.about.label}
          </Link>

          <div
            className={`${styles.experienceItem} ${isExperienceActive ? styles.active : ""}`}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setProjectsOpen(false);
              }
            }}
            onFocus={() => setProjectsOpen(true)}
            onMouseEnter={() => setProjectsOpen(true)}
            onMouseLeave={() => setProjectsOpen(false)}
          >
            <Link className={`${styles.navLink} ${styles.experiencePrimary}`} href={navigationItems.experience.href} onClick={closeMenu}>
              {navigationItems.experience.label}
            </Link>
            <button
              aria-controls={projectMenuId}
              aria-expanded={projectsOpen}
              aria-label={projectsOpen ? "Close experience projects menu" : "Open experience projects menu"}
              className={styles.experienceButton}
              onClick={() => {
                const isCompactNavigation = window.matchMedia("(max-width: 48rem)").matches;
                setProjectsOpen((open) => (isCompactNavigation ? !open : true));
              }}
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
          <button className={styles.themeToggle} onClick={toggleTheme} type="button" aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
            <MaterialIcon name={theme === "dark" ? "light_mode" : "dark_mode"} />
          </button>
        </nav>
      </div>
    </header>
  );
}
