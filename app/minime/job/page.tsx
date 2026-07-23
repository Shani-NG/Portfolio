import styles from "@/components/site/route-placeholder.module.css";

export default function JobDetailsPage() {
  return (
    <main className={styles.main}>
      <section className={styles.section}>
        <p className={styles.eyebrow}>Role Fit</p>
        <h1 className={styles.title}>Job details</h1>
        <p className={styles.copy}>Job setup and parsed role context will live here.</p>
      </section>
    </main>
  );
}
