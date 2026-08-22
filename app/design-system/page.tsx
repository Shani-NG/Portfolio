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

const projectIconNames = [
  "account_tree", "add", "add_circle", "alt_route", "analytics", "architecture",
  "arrow_back", "arrow_forward", "auto_awesome", "bolt", "build_circle", "cancel",
  "center_focus_strong", "check_circle", "chevron_left", "chevron_right", "commit",
  "compare_arrows", "content_paste", "conversion_path", "deployed_code", "description",
  "directions_boat", "emoji_objects", "favorite", "gpp_maybe", "groups", "handshake",
  "healing", "health_and_safety", "hub", "info", "insights", "layers", "lightbulb",
  "loop", "mail", "map", "monitor_heart", "person_outline", "play_circle", "restart_alt",
  "rocket_launch", "route", "schedule", "search_off", "send", "settings_input_component",
  "shield_with_heart", "strategy", "sync_alt", "target", "terminal", "touch_app",
  "travel_explore", "trending_up", "tune", "upload_file", "verified", "visibility",
] as const;

const typeScale = [
  ["hero", "var(--ds-type-hero-size)", "var(--ds-type-hero-line)", "var(--ds-type-weight-semibold)"],
  ["page-title", "var(--ds-type-page-title-size)", "var(--ds-type-page-title-line)", "var(--ds-type-weight-semibold)"],
  ["section-title", "var(--ds-type-section-title-size)", "var(--ds-type-section-title-line)", "var(--ds-type-weight-semibold)"],
  ["card-title", "var(--ds-type-card-title-size)", "var(--ds-type-card-title-line)", "var(--ds-type-weight-semibold)"],
  ["body-large", "var(--ds-type-body-large-size)", "var(--ds-type-body-large-line)", "var(--ds-type-weight-regular)"],
  ["heading-22", "var(--ds-type-heading-22-size)", "var(--ds-type-heading-22-line)", "var(--ds-type-weight-semibold)"],
  ["heading-18", "var(--ds-type-heading-18-size)", "var(--ds-type-heading-18-line)", "var(--ds-type-weight-semibold)"],
  ["body-16", "var(--ds-type-body-16-size)", "var(--ds-type-body-16-line)", "var(--ds-type-weight-regular)"],
  ["body-14", "var(--ds-type-body-14-size)", "var(--ds-type-body-14-line)", "var(--ds-type-weight-regular)"],
  ["body-14-light", "var(--ds-type-body-14-size)", "var(--ds-type-body-14-line)", "var(--ds-type-weight-light)"],
  ["label-14", "var(--ds-type-label-14-size)", "var(--ds-type-label-14-line)", "var(--ds-type-weight-medium)"],
  ["label-13", "var(--ds-type-label-13-size)", "var(--ds-type-label-13-line)", "var(--ds-type-weight-medium)"],
  ["button-16", "var(--ds-type-button-16-size)", "var(--ds-type-button-16-line)", "var(--ds-type-weight-semibold)"],
  ["nav-14", "var(--ds-type-nav-14-size)", "var(--ds-type-nav-14-line)", "var(--ds-type-weight-medium)"],
] as const;


const drawerIcons: Record<string, string> = {
  foundations: "palette",
  "responsive-grid": "grid_view",
  typography: "text_fields",
  buttons: "smart_button",
  eyebrows: "label",
  cards: "dashboard",
  chips: "sell",
  depth: "layers",
  motion: "animation",
  "scroll-reveal": "swipe_up",
  icons: "category",
};

function DesignSystemDrawer({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <details className={styles.drawer} id={id}>
      <summary>
        <span className={styles.drawerSummary}>
          <span className={styles.drawerIcon} aria-hidden="true"><MaterialIcon name={drawerIcons[id] ?? "layers"} /></span>
          <span className={styles.drawerSummaryCopy}>
            <span className={styles.eyebrow}>{eyebrow}</span>
            <span className={styles.drawerTitle} id={id + "-title"}>{title}</span>
          </span>
        </span>
        <MaterialIcon className={styles.drawerChevron} name="add" />
      </summary>
      <div className={styles.drawerContent}>
        <p className={styles.drawerDescription}>{description}</p>
        {children}
      </div>
    </details>
  );
}

export default function DesignSystemPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero} id="design-system-overview">
        <p className={styles.eyebrow}>Design system preview</p>
        <h1>Elegant, soft and technical foundations.</h1>
        <p>
          A code-first preview for approving color roles, typography hierarchy,
          button behavior and reusable card composition before applying the
          system to portfolio pages.
        </p>
      </section>

      <DesignSystemDrawer
        id="foundations"
        eyebrow={"01 Foundations"}
        title={"Semantic color roles"}
        description={<>Components consume roles, not raw colors. This keeps a future
            primary color or theme swap centralized.</>}
      >
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
      </DesignSystemDrawer>

      <DesignSystemDrawer
        id="responsive-grid"
        eyebrow={"02 Layout grid"}
        title={"One responsive geometry"}
        description={<>The same layout contract scales from 12 columns on desktop to 8 on
            tablet and 4 on mobile. Gutters and gaps are tokens, so page-level
            layouts can change together without rewriting each section.</>}
      >
        <div className={styles.gridPreviewPanel}>
          <div className="ds-grid" aria-label="Responsive grid preview">
            {Array.from({ length: 12 }, (_, index) => (
              <span className={styles.gridColumn} key={index}>{index + 1}</span>
            ))}
          </div>
          <div className={styles.gridLegend}>
            <span><strong>Desktop</strong> 12 columns · 48px gutter · 24px gap</span>
            <span><strong>Tablet</strong> 8 columns · 24px gutter · 20px gap</span>
            <span><strong>Mobile</strong> 4 columns · 24px gutter · 16px gap</span>
          </div>
        </div>
      </DesignSystemDrawer>

      <DesignSystemDrawer
        id="typography"
        eyebrow={"03 Typography"}
        title={"Outfit as the system voice"}
        description={<>The scale is expressive enough for portfolio storytelling, but
            bounded by semantic roles so sections, cards and body copy keep a
            consistent rhythm across viewports.</>}
      >
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
      </DesignSystemDrawer>

      <DesignSystemDrawer
        id="buttons"
        eyebrow={"04 Buttons"}
        title={"One component, explicit variants"}
        description={<>The hierarchy supports primary decisions, secondary paths and quiet
            tertiary actions with focus and disabled states.</>}
      >
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
      </DesignSystemDrawer>

      <DesignSystemDrawer
        id="eyebrows"
        eyebrow={"05 Eyebrow"}
        title={"Small label, consistent signal"}
        description={<>Eyebrows are always uppercase, can appear with or without an icon,
            and default to the primary action color.</>}
      >
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
      </DesignSystemDrawer>

      <DesignSystemDrawer
        id="cards"
        eyebrow={"06 Reusable cards"}
        title={"Flexible composition, not a fixed box"}
        description={<>The card is a reusable structure only when it creates meaningful
            grouping, comparison, action or status.</>}
      >
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
      </DesignSystemDrawer>

      <DesignSystemDrawer
        id="chips"
        eyebrow={"07 Chips"}
        title={"Compact labels with clear behavior"}
        description={<>Chips separate information, actions and links. They stay on one
            line, truncate long text and expose the full label on hover.</>}
      >
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
      </DesignSystemDrawer>

      <DesignSystemDrawer
        id="depth"
        eyebrow={"08 Depth"}
        title={"Quiet elevation hierarchy"}
        description={<>Shadows separate meaningful layers. They do not turn every surface into a floating card.</>}
      >
        <div className={styles.shadowGrid}>
          <div className={styles.shadowSample} style={{ boxShadow: "var(--ds-shadow-none)" }}><span>None</span></div>
          <div className={styles.shadowSample} style={{ boxShadow: "var(--ds-shadow-soft)" }}><span>Soft</span></div>
          <div className={styles.shadowSample} style={{ boxShadow: "var(--ds-shadow-raised)" }}><span>Raised</span></div>
          <div className={styles.shadowSample} style={{ boxShadow: "var(--ds-shadow-focus)" }}><span>Focus</span></div>
        </div>
      </DesignSystemDrawer>

      <DesignSystemDrawer
        id="motion"
        eyebrow={"09 Motion"}
        title={"Four patterns, one motion language"}
        description={<>Each pattern has one purpose, shared timing tokens and an opacity-only reduced-motion fallback.</>}
      >
        <div className={styles.motionGrid}>
          {(Object.keys(motionPatterns) as Array<keyof typeof motionPatterns>).map((pattern) => (
            <div className={`${styles.motionSample} ${styles[pattern]}`} data-motion={pattern} style={motionStyle(pattern)} key={pattern}>
              <span>{motionPatterns[pattern].name}</span>
              <small>{motionPatterns[pattern].intent}</small>
            </div>
          ))}
        </div>
      </DesignSystemDrawer>

      <DesignSystemDrawer
        id="scroll-reveal"
        eyebrow={"10 Scroll behavior"}
        title={"Three section modes"}
        description={<>Scroll down and each mode demonstrates a different level of movement without introducing a new animation language.</>}
      >
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
      </DesignSystemDrawer>

      <DesignSystemDrawer
        id="icons"
        eyebrow={"11 Icons"}
        title={"ICONS"}
        description={<>Material Icons currently used across the portfolio, presented as one shared visual vocabulary.</>}
      >
        <div className={styles.iconGrid} aria-label="Material icons used in the portfolio">
          {projectIconNames.map((name) => (
            <div className={styles.iconSample} key={name} aria-label={name}>
              <MaterialIcon name={name} />
            </div>
          ))}
        </div>
      </DesignSystemDrawer>
    </main>
  );
}
