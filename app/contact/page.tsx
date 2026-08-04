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
          Tell me about your <strong>open role</strong>
        </p>

        <ContactForm />
      </section>
    </main>
  );
}