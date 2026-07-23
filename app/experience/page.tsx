import Image from "next/image";
import Link from "next/link";
import { MaterialIcon } from "@/components/ui/material-icon";
import { projectCards } from "@/lib/portfolio-content";
import styles from "./page.module.css";

export default function ExperiencePage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Experience</p>
        <h1>Selected work.</h1>
        <p>Five case studies from complex systems, product learning, operational clarity, and AI-ready knowledge work.</p>
      </section>
      <section className={styles.projectGrid} aria-label="Case studies">
        {projectCards.map((project) => (
          <Link className={styles.projectCard} href={project.href} key={project.href}>
            <div className={styles.projectThumb}>
              <Image src={project.image} alt={project.imageAlt} fill sizes="(max-width: 48rem) 100vw, (max-width: 72rem) 50vw, 20vw" />
            </div>
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
