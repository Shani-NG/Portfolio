import { ContactForm } from "./contact-form";
import styles from "./page.module.css";

export default function ContactPage() {
  return (
    <main className={styles.main}>
      <section className={styles.section} aria-labelledby="contact-title">
        <p className={styles.eyebrow}>CONTACT</p>
        <h1 className={styles.title} id="contact-title">Let&apos;s connect.</h1>
        <p className={styles.copy}>Share a short note about the role, project, or collaboration you have in mind.</p>
        <ContactForm />
      </section>
    </main>
  );
}
