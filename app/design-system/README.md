# Portfolio Design-System Context

Last verified: 17 October 2026

This file preserves design intent and routing context. It does not duplicate every token. The implementation source of truth remains:

- `app/globals.css` for semantic tokens, typography, spacing, radius, shadows, breakpoints and motion values;
- `/app/design-system` for the living visual reference;
- existing shared components and states before any new primitive is introduced.

## Visual language

- Typeface: Outfit.
- Tone: elegant, soft and technical.
- Palette: semantic pink, eucalyptus and neutral roles with light/dark mappings.
- Hierarchy: one clear focal point, generous space and restrained supporting elements.
- Complex-system priority: operational clarity, reliability and readability before decoration.
- Cards are appropriate when they create grouping, comparison, state or affordance. Do not turn every section into a card mosaic.
- Shadows separate meaningful layers; they are not a default decoration for every surface.
- Material Icons remain the shared icon vocabulary unless an approved component requires otherwise.

## Layout

- Desktop: 12-column system.
- Tablet: 8-column system.
- Mobile: 4-column system.
- Mobile-first is a product constraint, not a final QA pass.
- Account for fixed navigation, short landscape viewports, safe focus visibility and route/state continuity from the first design decision.

## Motion

- Motion must explain hierarchy, feedback, continuity or state change.
- Shared timing tokens use short, standard and deliberate transitions (approximately 140/200/360 ms in the current system).
- Reuse the standard enter/exit curves and existing reveal patterns.
- Each animation should have one purpose.
- Reduced motion must preserve complete content and interaction through normal document positioning or opacity-only behavior.
- Keyboard focus must never remain behind a later cover layer.

## Current homepage behavior

PR22 is the current Production baseline:

- opening hero copy is static and does not block native scrolling;
- Selected Work appears before Core Values;
- only the four Core Values cards reveal on entry; the title/body remain stable;
- all four value cards remain readable on mobile before the next section covers them;
- Expertise covers Values after the content can be consumed;
- cover offsets adapt to panel and viewport height;
- the existing gallery behavior and Expertise reveals are preserved;
- the RoleFit entry changed only to remove its dependency on the deleted hero-completion event.

Do not reproduce the old scroll-blocking hero sequence. Do not interpret this homepage pattern as a global instruction to convert every page into stacked cover panels.

## Future UI change checklist

1. Inspect tokens, components, states and nearby patterns before creating a local style.
2. Confirm the change does not alter RoleFit report/provider/confirmation/persistence behavior unless that is the approved scope.
3. Check desktop, mobile and short landscape layouts.
4. Check keyboard focus, semantic structure, contrast and reduced motion.
5. Preserve approved copy, imagery and case-study anchors.
6. Use one Preview and a bounded browser check after automated validation.
7. Document a genuinely reusable missing pattern in the design-system source of truth.
