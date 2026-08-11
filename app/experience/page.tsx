import Image from "next/image";
import Link from "next/link";
import { MaterialIcon } from "@/components/ui/material-icon";
import { experienceProjectCards } from "@/lib/portfolio-content";
import styles from "./page.module.css";

const designSystemCard = {
  category: "DESIGN SYSTEM",
  title: "Elegant, soft and technical foundations.",
  summary:
    "A code-first preview for approving color roles, typography hierarchy, button behavior and reusable card composition before applying the system to portfolio pages.",
  href: "/design-system",
  image: "/assets/project-design-system.png",
  imageAlt: "Design-system tokens connecting design decisions to production code.",
} as const;

export default function ExperiencePage() {
  const selectedWorkCards = [...experienceProjectCards, designSystemCard];

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Experience</p>
        <h1>Selected work.</h1>
      <p>Six case studies and one design-system foundation from complex systems, product learning, operational clarity, and AI-ready knowledge work.</p>
      </section>
      <section className={styles.projectGrid} aria-label="Case studies">
        {selectedWorkCards.map((project) => (
          <Link className={styles.projectCard} href={project.href} key={project.href}>
            {"image" in project ? (
              <div className={[styles.projectThumb, project.href === "/experience/role-fit-agent" || project.href === "/design-system" ? styles.projectThumbTop : ""].filter(Boolean).join(" ")}>
                <Image src={project.image} alt={project.imageAlt} fill sizes="(max-width: 48rem) 100vw, (max-width: 72rem) 50vw, 33vw" />
              </div>
            ) : (
              <div className={`${styles.projectThumb} ${styles.designSystemThumb}`} aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            )}
            <div className={styles.projectBody}>
              <span>{project.category}</span>
              <h2>{project.title}</h2>
              <p>{project.summary}</p>
              <strong>
                View project
                <MaterialIcon name="arrow_forward" />
              </strong>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
