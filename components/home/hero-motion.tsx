import styles from "./hero-motion.module.css";

export function HeroMotion() {
  return (
    <section className={styles.heroMotion} aria-labelledby="home-title">
      <div className={styles.heroCopy}>
        <h1 id="home-title">KEEP IT COMPLEX</h1>
        <p>I&apos;ll take it from there.</p>
      </div>
    </section>
  );
}
