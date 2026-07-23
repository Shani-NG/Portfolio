import Link from "next/link";
import { externalLinks } from "@/lib/navigation";
import styles from "./site-footer.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.name}>Shani Nakash-Gomel</p>
        <p className={styles.closing}>© 2026 Shani Nakash-Gomel. When human intent is clear, AI knows what to do.</p>
        <nav aria-label="Contact links" className={styles.links}>
          <Link href={externalLinks.linkedin} rel="noreferrer" target="_blank">LinkedIn</Link>
          <Link href={externalLinks.whatsapp} rel="noreferrer" target="_blank">WhatsApp</Link>
          <Link href={externalLinks.email}>Email</Link>
        </nav>
      </div>
    </footer>
  );
}
