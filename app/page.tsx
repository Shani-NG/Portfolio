import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroMotion } from "@/components/home/hero-motion";
import { ExpertiseAreas } from "@/components/home/expertise-areas";
import { RoleFitEntry } from "@/components/home/role-fit-entry";
import { SelectedWorkGallery } from "@/components/home/selected-work-gallery";
import { Eyebrow } from "@/components/ui/eyebrow";
import { MaterialIcon } from "@/components/ui/material-icon";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { SystemCard } from "@/components/ui/system-card";
import { expertiseAreas, homeValues } from "@/lib/portfolio-content";
import { navigationItems } from "@/lib/navigation";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main className={styles.page}>
      <HeroMotion />

      <RoleFitEntry />

      <section className={`${styles.section} ${styles.valuesSection}`} aria-labelledby="values-title">
        <div className={styles.sectionIntro}>
          <h2 id="values-title">Core Values</h2>
          <p>The working principles behind the way I lead strategy, innovation and AI adoption.</p>
        </div>
        <div className={styles.cardGrid}>
          {homeValues.map((value) => (
            <SystemCard className={styles.valueCard} interaction="lift" key={value.title}>
              <SystemCard.Header className={styles.valueCardHeader}>
                <SystemCard.Icon className={styles.valueCardIcon}>
                  <MaterialIcon name={value.icon} />
                </SystemCard.Icon>
                <SystemCard.Title className={styles.valueCardTitle}>{value.title}</SystemCard.Title>
              </SystemCard.Header>
              <SystemCard.Body>{value.body}</SystemCard.Body>
            </SystemCard>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.workSection}`} aria-labelledby="work-title">
        <div className={styles.sectionIntro}>
          <h2 id="work-title">Selected work</h2>
        </div>
        <SelectedWorkGallery />
      </section>

      <section className={`${styles.section} ${styles.expertiseSection}`} aria-labelledby="expertise-title">
        <ScrollReveal>
          <div className={styles.sectionIntro}>
            <Eyebrow className={styles.expertiseEyebrow} color="primaryHover">Expertise</Eyebrow>
            <h2 id="expertise-title">Expertise Areas</h2>
            <p>A high-level view of the three ways I help complex products move from ambiguity to clear, usable systems.</p>
          </div>
        </ScrollReveal>
        <ScrollReveal mode="creative" className={styles.expertiseCardsReveal}>
          <ExpertiseAreas areas={expertiseAreas} />
        </ScrollReveal>
      </section>

      <section className={`${styles.contactBand} ${styles.closingSection}`} aria-labelledby="contact-title">
        <h2 id="contact-title">THANKS FOR MAKING IT THIS FAR!</h2>
        <p>Let&apos;s collaborate on your next technical challenge and build something meaningful together.</p>
        <Link className={styles.contactLink} href={navigationItems.contact.href}>
          <Button className={styles.contactCtaButton} variant="primary" tone="outlined">
            LET&apos;S CONNECT
            <MaterialIcon name="arrow_forward" />
          </Button>
        </Link>
      </section>
    </main>
  );
}
