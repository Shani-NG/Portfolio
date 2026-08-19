import { Suspense } from "react";
import { ContactForm } from "./contact-form";
import styles from "./page.module.css";

export default function ContactPage() {
  return (
    <main className={styles.main}>
      <section className={styles.section} aria-labelledby="contact-title">
        <h1 className={styles.title} id="contact-title">
          Let&apos;s Connect
        </h1>

        <p className={styles.copy}>
          Let&apos;s see what we can <strong>build together</strong>
        </p>

        <Suspense fallback={null}>
          <ContactForm />
        </Suspense>
      </section>
    </main>
  );
}
