import Link from "next/link";
import { externalLinks } from "@/lib/navigation";
import styles from "@/components/site/route-placeholder.module.css";

export default function ContactPage() {
  return (
    <main className={styles.main}>
      <section className={styles.section}>
        <p className={styles.eyebrow}>Contact</p>
        <h1 className={styles.title}>Let&apos;s connect.</h1>
        <p className={styles.copy}>Contact details will live here as a dedicated page.</p>
        <ul className={styles.projectList} aria-label="Contact links">
          <li>
            <Link href={externalLinks.linkedin} rel="noreferrer" target="_blank">LinkedIn</Link>
          </li>
          <li>
            <Link href={externalLinks.whatsapp} rel="noreferrer" target="_blank">WhatsApp</Link>
          </li>
          <li>
            <Link href={externalLinks.email}>Email</Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
