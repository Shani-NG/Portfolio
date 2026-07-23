import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Eyebrow } from "@/components/ui/eyebrow";
import { MaterialIcon } from "@/components/ui/material-icon";
import { SystemCard } from "@/components/ui/system-card";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { motionPatterns, motionStyle } from "@/lib/motion";
import styles from "./page.module.css";

const colorRoles = [
  { name: "Primary action", value: "var(--ds-color-action-primary)", note: "Dusty pink for main action and emphasis" },
  { name: "Secondary action", value: "var(--ds-color-action-secondary)", note: "Eucalyptus for support, context and calm status" },
  { name: "Canvas", value: "var(--ds-color-canvas)", note: "Warm neutral background" },
  { name: "Surface", value: "var(--ds-color-surface-raised)", note: "Raised content surfaces" },
  { name: "Text primary", value: "var(--ds-color-text-primary)", note: "Primary reading layer" },
  { name: "Text secondary", value: "var(--ds-color-text-secondary)", note: "Supporting reading layer" },
  { name: "Dark running text", value: "var(--ds-color-text-on-dark-body)", note: "Body copy on near-black sections" },
];

const colorScales = [
  {
    name: "Primary / Smoky Rose",
    colors: ["var(--ds-color-pink-100)", "var(--ds-color-pink-300)", "var(--ds-color-pink-400)", "var(--ds-color-pink-500)", "var(--ds-color-pink-600)", "var(--ds-color-pink-700)"],
  },
  {
    name: "Secondary / Eucalyptus",
    colors: ["var(--ds-color-eucalyptus-100)", "var(--ds-color-eucalyptus-300)", "var(--ds-color-eucalyptus-500)", "var(--ds-color-eucalyptus-600)", "var(--ds-color-eucalyptus-700)"],
  },
  {
    name: "Secondary / Eucalyptus for dark surfaces",
    colors: ["var(--ds-color-eucalyptus-dark-300)", "var(--ds-color-eucalyptus-dark-200)", "var(--ds-color-eucalyptus-dark-500)"],
  },
];

const neutralPalettes = [
  {
    name: "Dark neutrals",
    colors: [
      ["Background", "var(--ds-palette-dark-background)"],
      ["Surface", "var(--ds-palette-dark-surface)"],
      ["Elevated", "var(--ds-palette-dark-elevated)"],
      ["Border", "var(--ds-palette-dark-border)"],
      ["Text primary", "var(--ds-palette-dark-text-primary)"],
      ["Text secondary", "var(--ds-palette-dark-text-secondary)"],
    ],
  },
  {
    name: "Light neutrals",
    colors: [
      ["Background", "var(--ds-palette-light-background)"],
      ["Surface", "var(--ds-palette-light-surface)"],
      ["Border", "var(--ds-palette-light-border)"],
      ["Text primary", "var(--ds-palette-light-text-primary)"],
      ["Text secondary", "var(--ds-palette-light-text-secondary)"],
    ],
  },
];

const buttonExamples = [
  { variant: "primary", tone: "filled", label: "Primary" },
  { variant: "primary", tone: "outlined", label: "Primary" },
  { variant: "primary", tone: "text", label: "Primary" },
  { variant: "secondary", tone: "filled", label: "Secondary" },
  { variant: "secondary", tone: "outlined", label: "Secondary" },
  { variant: "secondary", tone: "text", label: "Secondary" },
  { variant: "tertiary", tone: "text", label: "Tertiary" },
] as const;

const typeScale = [
  ["display-64", "var(--ds-type-display-64-size)", "var(--ds-type-display-64-line)", "var(--ds-type-weight-semibold)"],
  ["display-48", "var(--ds-type-display-48-size)", "var(--ds-type-display-48-line)", "var(--ds-type-weight-semibold)"],
  ["heading-36", "var(--ds-type-heading-36-size)", "var(--ds-type-heading-36-line)", "var(--ds-type-weight-semibold)"],
  ["heading-28", "var(--ds-type-heading-28-size)", "var(--ds-type-heading-28-line)", "var(--ds-type-weight-semibold)"],
  ["heading-22", "var(--ds-type-heading-22-size)", "var(--ds-type-heading-22-line)", "var(--ds-type-weight-semibold)"],
  ["heading-18", "var(--ds-type-heading-18-size)", "var(--ds-type-heading-18-line)", "var(--ds-type-weight-semibold)"],
  ["body-18", "var(--ds-type-body-18-size)", "var(--ds-type-body-18-line)", "var(--ds-type-weight-regular)"],
  ["body-16", "var(--ds-type-body-16-size)", "var(--ds-type-body-16-line)", "var(--ds-type-weight-regular)"],
  ["body-14", "var(--ds-type-body-14-size)", "var(--ds-type-body-14-line)", "var(--ds-type-weight-regular)"],
  ["body-14-light", "var(--ds-type-body-14-size)", "var(--ds-type-body-14-line)", "var(--ds-type-weight-light)"],
  ["label-14", "var(--ds-type-label-14-size)", "var(--ds-type-label-14-line)", "var(--ds-type-weight-medium)"],
  ["label-13", "var(--ds-type-label-13-size)", "var(--ds-type-label-13-line)", "var(--ds-type-weight-medium)"],
  ["button-16", "var(--ds-type-button-16-size)", "var(--ds-type-button-16-line)", "var(--ds-type-weight-semibold)"],
  ["nav-14", "var(--ds-type-nav-14-size)", "var(--ds-type-nav-14-line)", "var(--ds-type-weight-medium)"],
] as const;

export default function DesignSystemPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Design system preview</p>
        <h1>Elegant, soft and technical foundations.</h1>
        <p>
          A code-first preview for approving color roles, typography hierarchy,
          button behavior and reusable card composition before applying the
          system to portfolio pages.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="foundations-title">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>01 Foundations</p>
          <h2 id="foundations-title">Semantic color roles</h2>
          <p>
            Components consume roles, not raw colors. This keeps a future
            primary color or theme swap centralized.
          </p>
        </div>
        <div className={styles.swatchGrid}>
          {colorRoles.map((role) => (
            <article className={styles.swatchCard} key={role.name}>
              <span className={styles.swatch} style={{ background: role.value }} />
              <h3>{role.name}</h3>
              <p>{role.note}</p>
            </article>
          ))}
        </div>
        <div className={styles.scaleGrid} aria-label="Brand color scales">
          {colorScales.map((scale) => (
            <div className={styles.scale} key={scale.name}>
              <h3>{scale.name}</h3>
              <div className={styles.scaleRow}>
                {scale.colors.map((color, index) => (
                  <span className={styles.scaleSwatch} style={{ background: color }} key={`${scale.name}-${index}`} />
                ))}
              </div>
              <p>Use the lighter steps for illustration surfaces and the deeper steps for emphasis, icons and active states.</p>
            </div>
          ))}
        </div>
        <div className={styles.neutralGrid} aria-label="Neutral palette candidates">
          {neutralPalettes.map((palette) => (
            <div className={styles.neutralPalette} key={palette.name}>
              <h3>{palette.name}</h3>
              <div className={styles.neutralRows}>
                {palette.colors.map(([name, color]) => (
                  <div className={styles.neutralRow} key={name}>
                    <span className={styles.neutralSwatch} style={{ background: color }} />
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="grid-title">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>02 Layout grid</p>
          <h2 id="grid-title">One responsive geometry</h2>
          <p>
            The same layout contract scales from 12 columns on desktop to 8 on
            tablet and 4 on mobile. Gutters and gaps are tokens, so page-level
            layouts can change together without rewriting each section.
          </p>
        </div>
        <div className={styles.gridPreviewPanel}>
          <div className="ds-grid" aria-label="Responsive grid preview">
            {Array.from({ length: 12 }, (_, index) => (
              <span className={styles.gridColumn} key={index}>{index + 1}</span>
            ))}
          </div>
          <div className={styles.gridLegend}>
            <span><strong>Desktop</strong> 12 columns · 48px gutter · 24px gap</span>
            <span><strong>Tablet</strong> 8 columns · 24px gutter · 20px gap</span>
            <span><strong>Mobile</strong> 4 columns · 16px gutter · 16px gap</span>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="type-title">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>03 Typography</p>
          <h2 id="type-title">Inter as the system voice</h2>
          <p>
            The scale is restrained, readable and designed for portfolio
            storytelling without turning operational sections into hero moments.
          </p>
        </div>
        <div className={styles.typePanel}>
          {typeScale.map(([name, size, line, weight]) => (
            <div className={styles.typeRow} key={name}>
              <span className={styles.typeName}>{name}</span>
              <p className={styles.typeSample} style={{ fontSize: size, lineHeight: line, fontWeight: weight }}>
                Keep it complex
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="buttons-title">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>04 Buttons</p>
          <h2 id="buttons-title">One component, explicit variants</h2>
          <p>
            The hierarchy supports primary decisions, secondary paths and quiet
            tertiary actions with focus and disabled states.
          </p>
        </div>
        <div className={styles.buttonPanel}>
          {buttonExamples.map((example) => (
            <div className={styles.componentExample} key={`${example.variant}-${example.tone}`}>
              <Button variant={example.variant} tone={example.tone}>{example.label}</Button>
              <span className={styles.componentLabel}>Button / {example.variant} / {example.tone}</span>
            </div>
          ))}
          <div className={styles.componentExample}>
            <Button disabled>Disabled</Button>
            <span className={styles.componentLabel}>Button / primary / disabled</span>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="eyebrow-title">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>05 Eyebrow</p>
          <h2 id="eyebrow-title">Small label, consistent signal</h2>
          <p>
            Eyebrows are always uppercase, can appear with or without an icon,
            and default to the primary action color.
          </p>
        </div>
        <div className={styles.eyebrowPanel}>
          <div className={styles.componentExample}>
            <Eyebrow>Primary label</Eyebrow>
            <span className={styles.componentLabel}>Eyebrow / primary / no icon</span>
          </div>
          <div className={styles.componentExample}>
            <Eyebrow color="secondary" icon={<MaterialIcon name="insights" />}>Secondary with icon</Eyebrow>
            <span className={styles.componentLabel}>Eyebrow / secondary / icon</span>
          </div>
          <div className={styles.componentExample}>
            <Eyebrow color="primaryHover">Case study section</Eyebrow>
            <span className={styles.componentLabel}>Eyebrow / primary hover</span>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="cards-title">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>06 Reusable cards</p>
          <h2 id="cards-title">Flexible composition, not a fixed box</h2>
          <p>
            The card is a reusable structure only when it creates meaningful
            grouping, comparison, action or status.
          </p>
        </div>
        <div className={styles.cardGrid}>
          <div className={styles.componentExample}>
            <SystemCard interaction="lift">
              <SystemCard.Header>
                <SystemCard.Icon>+</SystemCard.Icon>
                <div><SystemCard.Eyebrow>Pattern candidate</SystemCard.Eyebrow><SystemCard.Title>Evidence card</SystemCard.Title></div>
              </SystemCard.Header>
              <SystemCard.Body>Used when a repeated block needs a title, explanation and optional action while preserving a consistent visual rhythm.</SystemCard.Body>
              <SystemCard.Actions><Button size="sm">Review</Button><Button size="sm" variant="secondary" tone="outlined">Compare</Button></SystemCard.Actions>
            </SystemCard>
            <span className={styles.componentLabel}>SystemCard / interactive / icon / actions</span>
          </div>

          <div className={styles.componentExample}>
            <SystemCard>
              <SystemCard.Header><div><SystemCard.Eyebrow>No icon variation</SystemCard.Eyebrow><SystemCard.Title>Quiet insight block</SystemCard.Title></div></SystemCard.Header>
              <SystemCard.Body>The same infrastructure works without icon or action when the content is informational rather than actionable.</SystemCard.Body>
            </SystemCard>
            <span className={styles.componentLabel}>SystemCard / static / no icon / no actions</span>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="chips-title">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>07 Chips</p>
          <h2 id="chips-title">Compact labels with clear behavior</h2>
          <p>
            Chips separate information, actions and links. They stay on one
            line, truncate long text and expose the full label on hover.
          </p>
        </div>
        <div className={styles.chipPanel}>
          <div className={styles.chipGroup}>
            <span className={styles.componentLabel}>Info</span>
            <Chip kind="info">Neutral label</Chip>
            <Chip icon="verified" kind="info" tone="success">Direct evidence</Chip>
            <Chip icon="psychology" kind="info" tone="secondary">Transferable match</Chip>
            <Chip kind="info" tone="warning">Partial evidence</Chip>
          </div>
          <div className={styles.chipGroup}>
            <span className={styles.componentLabel}>Action</span>
            <Chip icon="upload_file" kind="action" tone="primary">Upload a job description</Chip>
            <Chip icon="content_paste" kind="action" tone="primary">Paste job details</Chip>
            <Chip disabled icon="travel_explore" kind="action" tone="primary">Disabled action</Chip>
          </div>
          <div className={styles.chipGroup}>
            <span className={styles.componentLabel}>Link</span>
            <Chip href="/experience" icon="arrow_forward" kind="link" tone="secondary">Go to selected work</Chip>
            <Chip href="/minime" kind="link" tone="primary">Open Role Fit</Chip>
          </div>
          <div className={styles.chipGroup}>
            <span className={styles.componentLabel}>Overflow</span>
            <Chip className={styles.longChip} icon="touch_app" kind="info" tone="neutral">
              Tap a requirement to see the matching proof in the connected case study
            </Chip>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="depth-title">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>08 Depth</p>
          <h2 id="depth-title">Quiet elevation hierarchy</h2>
          <p>Shadows separate meaningful layers. They do not turn every surface into a floating card.</p>
        </div>
        <div className={styles.shadowGrid}>
          <div className={styles.shadowSample} style={{ boxShadow: "var(--ds-shadow-none)" }}><span>None</span></div>
          <div className={styles.shadowSample} style={{ boxShadow: "var(--ds-shadow-soft)" }}><span>Soft</span></div>
          <div className={styles.shadowSample} style={{ boxShadow: "var(--ds-shadow-raised)" }}><span>Raised</span></div>
          <div className={styles.shadowSample} style={{ boxShadow: "var(--ds-shadow-focus)" }}><span>Focus</span></div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="motion-title">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>09 Motion</p>
          <h2 id="motion-title">Four patterns, one motion language</h2>
          <p>Each pattern has one purpose, shared timing tokens and an opacity-only reduced-motion fallback.</p>
        </div>
        <div className={styles.motionGrid}>
          {(Object.keys(motionPatterns) as Array<keyof typeof motionPatterns>).map((pattern) => (
            <div className={`${styles.motionSample} ${styles[pattern]}`} data-motion={pattern} style={motionStyle(pattern)} key={pattern}>
              <span>{motionPatterns[pattern].name}</span>
              <small>{motionPatterns[pattern].intent}</small>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="scroll-title">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>10 Scroll behavior</p>
          <h2 id="scroll-title">Three section modes</h2>
          <p>Scroll down and each mode demonstrates a different level of movement without introducing a new animation language.</p>
        </div>
        <div className={styles.scrollDemoGrid}>
          <div className={styles.scrollDemoCard}>
            <span className={styles.eyebrow}>Overlap</span>
            <ScrollReveal mode="overlap">
              <div className={styles.scrollDemoContent}>
              <h3>Incoming section takes priority</h3>
              <p>A restrained rise that creates continuity between sections.</p>
              </div>
            </ScrollReveal>
          </div>
          <div className={styles.scrollDemoCard}>
            <span className={styles.eyebrow}>Static</span>
            <ScrollReveal mode="static">
              <div className={styles.scrollDemoContent}>
              <h3>Content stays still</h3>
              <p>Used when the information itself should remain the focal point.</p>
              </div>
            </ScrollReveal>
          </div>
          <div className={styles.scrollDemoCard}>
            <span className={styles.eyebrow}>Creative</span>
            <ScrollReveal mode="creative">
              <div className={styles.scrollDemoContent}>
              <h3>Soft image-like reveal</h3>
              <p>A subtle clip and scale shift for a meaningful visual moment.</p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className={styles.darkPreview} data-ds-theme="dark" aria-labelledby="dark-title">
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>11 Dark mode check</p>
          <h2 id="dark-title">Same roles, different theme</h2>
          <p>
            This proves the system can change theme centrally without rewriting
            component styles.
          </p>
        </div>
        <div className={styles.darkActions}>
          <div className={styles.componentExample}><Button>Primary</Button><span className={styles.componentLabel}>Button / primary / filled / dark</span></div>
          <div className={styles.componentExample}><Button variant="secondary">Secondary</Button><span className={styles.componentLabel}>Button / secondary / filled / dark</span></div>
          <div className={styles.componentExample}><Button variant="secondary" tone="outlined">Secondary</Button><span className={styles.componentLabel}>Button / secondary / outlined / dark</span></div>
          <div className={styles.componentExample}><Button variant="tertiary" tone="text">Tertiary</Button><span className={styles.componentLabel}>Button / tertiary / text / dark</span></div>
        </div>
      </section>
    </main>
  );
}
