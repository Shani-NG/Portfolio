# Report UI-to-Analysis Contract v0.2 — Reconciled

**Project:** Conversation-Based Portfolio Agent  
**Document type:** UI-to-analysis data contract  
**Status:** Reconciled and build-aligned  
**Owner and final approver:** Shani Nakash-Gomel  
**Scope:** Role Fit Report only  
**Implementation status:** Specification only — no HTML, CSS, animation, or production code  
**Canonical data authority:** `Report_Data_Model_v1.0.md`

---

## 1. Purpose

This document defines the exact contract between:

1. the role-fit analysis,
2. the structured report data,
3. and the approved visible report components.

Its purpose is to guarantee that:

- every visible report component is backed by an explicit analytical output,
- every analytical output has a defined visible destination,
- no unsupported or decorative data enters the report,
- no visible component relies on invented values,
- and the report remains aligned with the existing approved high-level information architecture.

The report's high-level content sections are considered closed for V1.

No new major information section may be added without explicit product approval.

---

## 2. Canonical data authority

For report field names, object shapes, enum values, validation rules, and browser-facing payload structure, `Report_Data_Model_v1.0.md` is authoritative.

This contract remains authoritative for:

- the purpose of each visible UI component,
- the mapping from analytical meaning to the approved report hierarchy,
- display and fallback behavior,
- and the prohibition on adding new major report sections.

Deprecated aliases from v0.1 may be normalized only at an ingestion compatibility boundary. They must not be stored or emitted in a validated V1 payload.

---

## 3. Governing rule

> No analytical output may enter the V1 report unless it maps to an approved visible component. No visible report component may remain unless its source, analytical rule, evidence requirement, and fallback behavior are explicitly defined.

This contract therefore works in both directions:

### UI → Analysis

For every visible component, define:

- what it represents,
- which field feeds it,
- who produces it,
- whether it is extracted, inferred, or derived,
- what evidence level is required,
- what happens when data is unavailable,
- and whether the component is mandatory or conditional.

### Analysis → UI

For every analysis output, confirm:

- where it appears,
- whether it is user-visible or internal,
- whether it duplicates another field,
- whether it belongs in V1,
- and whether it requires evidence.

---

## 4. Approved high-level report structure

The following report areas are approved for V1:

1. Role Snapshot
2. Overall Fit Visual
3. Skills Match
4. Requirements and Responsibilities Mapping
5. Portfolio Evidence Panel
6. Top Strengths
7. Key Gaps
8. Disclaimer
9. Contact CTA

These are the only major report sections included in this contract.

The contract does not approve:

- additional report tabs,
- additional recommendation sections,
- salary analysis,
- culture-fit analysis,
- personality analysis,
- candidate ranking,
- ATS scoring,
- CV rewriting,
- or new summary sections.

---

## 5. Report data ownership

### Role Understanding produces

- company,
- role title,
- role description,
- responsibilities,
- requirements,
- seniority,
- years of experience,
- location,
- work model,
- and source traceability.

### Fit Analysis produces

- normalized concepts,
- match type,
- evidence confidence,
- short rationale,
- overall fit level,
- hidden visual fill value,
- strengths,
- gaps,
- and evidence references.

### Deterministic application logic produces

- visual state mapping,
- color token selection,
- circular indicator fill,
- impact classification,
- evidence-cluster deduplication,
- link fallback,
- section ordering,
- and display-safe formatting.

### Report Composer produces

- final validated report JSON,
- visible component payloads,
- and the fixed report layout output.

The Report Composer must not invent new professional claims.

---

# 6. Visible component contract

---

## 6.1 Role Snapshot

### Visible purpose

Identify the analyzed role and provide only job-context information extracted from the submitted job description.

### Visible fields

- Role title
- Company
- Seniority or required experience, when present
- Location and work model, when present and already supported by the design
- Report generation date, if included in the final UI

### Data source

```ts
role.title
role.company
role.seniority?
role.yearsOfExperience?
role.location?
role.workModel?
createdAt
```

### Analytical type

- extracted fact from the role input
- no fit inference

### Evidence requirement

The source is the user-submitted job description, not portfolio evidence.

### Display rules

- Preserve the original role title when possible.
- Normalized role concepts remain internal unless needed for explanation.
- Optional fields appear only when explicitly present or confirmed.
- Missing optional fields do not produce an empty card or placeholder statistic.

### Forbidden behavior

- Do not infer company from email domains or filenames.
- Do not infer location from company headquarters.
- Do not convert missing seniority into “Senior.”
- Do not present unsupported work-model details.
- Do not create visual empty gaps when optional fields are absent.

### Fallback

If company is unavailable but the role is otherwise valid, the report flow must follow the approved completeness rule. If company is required for generation, generation remains blocked until confirmed.

---

## 6.2 Overall Fit Visual

### Visible purpose

Provide an immediate qualitative representation of the overall role fit without presenting a false sense of exact mathematical precision.

### Visible mechanism

The component includes:

- one of three fixed illustrations,
- the approved color associated with the selected fit level,
- a circular indicator surrounding the illustration,
- a qualitative fit label,
- and a short rationale.

Animation and illustration art direction are explicitly deferred to a later visual-specification task.

### Supported visible fit levels

```ts
type VisibleFitLevel =
  | "strong"
  | "good"
  | "partial"
```

Only these three levels use the illustration-and-ring mechanism.

### Required analysis fields

```ts
type OverallFitVisual = {
  level: "strong" | "good" | "partial"
  fitVisualValue: number
  label: string
  rationale: string
}
```

### `level`

Controls:

- which of the three illustrations is displayed,
- which approved color token is applied,
- which visible label is shown,
- and which internal fill range is valid.

### `fitVisualValue`

Controls:

- the relative fill of the circular indicator.

It is:

- internal,
- hidden from the user,
- not displayed as a number,
- not displayed as a percentage,
- not called a score,
- and not presented as a scientific measurement.

The ring visually represents an internal continuum while intentionally preserving ambiguity.

### Proposed internal display bands

These are implementation bands, not user-visible percentages:

| Fit level | Allowed visual fill band |
|---|---:|
| Partial | 30–54 |
| Good | 55–79 |
| Strong | 80–100 |

The exact thresholds remain configurable and may be adjusted during evaluation.

### Important distinction

The ring may visually resemble progress, but it must not be accompanied by:

- “82% fit,”
- “9/10 match,”
- a numeric score,
- or a claim that the value is statistically precise.

### Analysis rule

The fit level must be based on:

- the coverage of central role requirements,
- match strength,
- importance of matched and unmatched requirements,
- evidence quality,
- and existence of confirmed real gaps.

It must not be based only on keyword count.

### Exceptional outcomes

The following outcomes do not use the three-illustration mechanism:

```ts
type NonVisualFitOutcome =
  | "insufficient"
  | "out-of-scope"
```

#### Insufficient

Used when the role is valid but there is not enough approved evidence for an accountable fit conclusion.

The normal fit illustration and circular fill are not shown.

#### Out of scope

Used when the role falls outside the documented professional experience.

The normal report may be replaced by the approved respectful out-of-scope response.

### Fallback

If the analysis returns an unsupported level or invalid `fitVisualValue`, the report must not render the component as ready.

---

## 6.3 Evidence Confidence

### Visible purpose

Show how strongly the available approved evidence supports the report conclusions.

This must remain separate from overall fit.

### Data source

```ts
evidenceConfidence.level
evidenceConfidence.rationale
```

### Supported levels

```ts
type EvidenceConfidence =
  | "high"
  | "medium"
  | "low"
  | "insufficient"
```

### Display rule

Evidence confidence may appear as:

- a small label,
- chip,
- status line,
- or secondary text within the approved Overall Fit area.

It must not become a new major report section.

### Forbidden behavior

- Do not merge evidence confidence into the fit ring.
- Do not imply that strong fit automatically means high evidence confidence.
- Do not hide low confidence behind a positive fit label.

### Fallback

If evidence confidence is insufficient, the report must either:

- enter the approved limited-report state,
- or not produce a normal fit report.

The final decision between those two behaviors remains a product decision.

---

## 6.4 Skills Match

### Visible purpose

Show the main professional capabilities required by the role and how they map to documented experience.

### Visible fields

- normalized skill or capability label
- visible match status
- optional concise explanation
- visual coverage representation already supported by the design

### Data source

```ts
sections["skills"].items[]
```

Each item uses:

```ts
type ReportItem = {
  itemId: string
  originalText: string
  normalizedConcept?: string
  matchType:
    | "direct"
    | "semantic"
    | "transferable"
    | "partial"
    | "insufficient-evidence"
    | "real-gap"
  impact: "strength" | "gap" | "neutral"
  claimKind:
    | "documented-fact"
    | "interpretive-conclusion"
    | "unverified-assumption"
  evidenceConfidence:
    | "high"
    | "medium"
    | "low"
    | "insufficient"
  shortRationale: string
  clusterIds: string[]
}
```

### Coverage visualization

The design may show a circular or compact visual representation of skills coverage.

It must not display unsupported ratios such as:

- `9 / 10`,
- `11 / 9`,
- or an exact percentage unless the denominator and calculation rule are explicitly valid.

### Approved V1 rule

For V1, skills coverage should be represented through one of these safe patterns:

1. qualitative coverage state,
2. visually filled indicator without a visible number,
3. or a count of clearly defined role skills only when the denominator is fully traceable.

The UI-to-code implementation must choose one approved option before build.

### Analytical rule

Each skill must originate from the role requirements or responsibilities.

The system must not add generic positive skills merely because they exist in the portfolio.

### Evidence requirement

Every visible skill match requires one or more approved Evidence Cards, except:

- `insufficient-evidence`,
- and `real-gap`, which require a clear explanation of the absence or confirmed gap.

### Fallback

If no skills can be reliably extracted, the report should not fabricate a skills list. The report should enter an insufficient-role-data or insufficient-evidence state according to the source of the failure.

---

## 6.5 Requirements and Responsibilities Mapping

### Visible purpose

Map the most important role requirements and responsibilities to documented portfolio evidence.

### Visible fields

For each displayed item:

- original role requirement or responsibility,
- concise normalized meaning when useful,
- visible match state,
- short rationale,
- and linked evidence cluster.

### Data source

```ts
sections["requirements"].items[]
sections["responsibilities"].items[]
```

### Selection rule

The visible report may prioritize a limited set, such as the top five items already supported by the design.

Selection must be based on:

- requirement importance,
- explicit “must-have” language,
- central responsibilities,
- seniority implications,
- and value to the visitor.

It must not simply choose the first five lines in the job description.

### Analytical rule

Each item must be classified as one of:

- direct,
- semantic,
- transferable,
- partial,
- insufficient evidence,
- real gap.

### Evidence requirement

Every positive or partial match must reference approved evidence.

### UI interaction

Selecting a requirement updates the existing Portfolio Evidence Panel.

The evidence panel is therefore a linked detail view, not a new report section.

### Forbidden behavior

- Do not rewrite requirements into more favorable versions.
- Do not hide central gaps by displaying only matched items.
- Do not use the same project link repeatedly when one Evidence Cluster can support several items.
- Do not invent strategic decisions or outcomes.

### Fallback

If a requirement has no valid evidence:

- show `insufficient evidence`,
- or `real gap` only when the system can responsibly establish an actual gap.

---

## 6.6 Portfolio Evidence Panel

### Visible purpose

Show the specific approved case-study evidence supporting the currently selected requirement, responsibility, or skill.

### Visible fields

- project title,
- short evidence explanation,
- relevant action, decision, or documented outcome,
- link to the case study,
- semantic anchor when available.

### Data source

```ts
evidenceClusters[]
```

```ts
type EvidenceCluster = {
  clusterId: string
  title: string
  summary: string
  supportedItemIds: string[]
  evidenceIds: string[]
  project?: {
    slug: string
    title: string
  }
  destination:
    | { mode: "anchor"; href: string; anchorId: string; dedupeKey: string }
    | { mode: "project-top"; href: string; dedupeKey: string }
    | { mode: "no-link"; dedupeKey: string }
  reliability: "high" | "medium" | "low"
}
```

### Evidence assembly rule

Evidence Clusters are built deterministically from approved Evidence Cards.

The model must not invent:

- destination links,
- anchors,
- project names,
- metrics,
- or deduplication keys.

### Visibility rule

Only public, approved Evidence Cards may be used to construct a browser-facing cluster.

`visibility` is enforced before composition and is therefore not included in the browser-facing `EvidenceCluster`. Internal evidence must not appear as raw content or source references.

### Deduplication rule

The same:

```text
projectSlug + anchorId
```

must not appear more than once in the report.

When one source supports several items, the same cluster may be referenced by several items without being repeated visually.

### Empty state

Before selection, the panel may show the approved neutral instructional state.

### Fallback

- Missing anchor → open project top.
- Missing project route → show evidence without a live link, if approved.
- Internal-only evidence → do not display the source.
- Broken link → preserve the report and record a fallback event.

---

## 6.7 Top Strengths

### Visible purpose

Summarize the highest-value supported fit conclusions.

### Data source

Top Strengths are derived from the same `ReportItem[]` used in the core sections.

They are not independently generated.

### Derivation rule

Eligible items:

```ts
matchType === "direct"
|| matchType === "semantic"
|| matchType === "transferable"
```

Additional conditions:

- high relevance to the role,
- sufficient evidence,
- no duplication,
- and clear value to the visitor.

### Ranking rule

Prioritize:

1. central requirements,
2. leadership or ownership expectations,
3. domain or workflow complexity,
4. cross-functional responsibilities,
5. high-confidence evidence.

### Display limit

Use a concise list. The existing design capacity should be preserved.

Recommended V1 maximum:

```text
3–5 strengths
```

### Forbidden behavior

- Do not write generic strengths unrelated to the role.
- Do not repeat the Skills Match list.
- Do not create new evidence claims here.
- Do not include unsupported numerical outcomes.
- Do not upgrade partial evidence into a top strength.

### Fallback

If fewer than three evidence-backed strengths exist, show fewer items rather than adding weak filler.

---

## 6.8 Key Gaps

### Visible purpose

Show the most important limitations relevant to the role while preserving the distinction between missing evidence and a confirmed gap.

### Data source

Key Gaps are derived from the same `ReportItem[]`.

They are not independently generated.

### Eligible classifications

```ts
matchType === "real-gap"
|| matchType === "insufficient-evidence"
|| matchType === "partial"
```

### Required visible distinction

#### Real gap

The available approved evidence supports the conclusion that the requirement is not demonstrated or is materially outside the documented experience.

#### Insufficient evidence

The system cannot establish whether the requirement is met.

#### Partial

Some relevant experience exists, but it does not fully cover the requirement.

These states must not be collapsed into one generic warning.

### Display limit

Recommended V1 maximum:

```text
up to 3 key gaps
```

### Ranking rule

Prioritize:

- mandatory requirements,
- central responsibilities,
- high-impact seniority expectations,
- and gaps that materially affect the interpretation of fit.

### Tone rule

Gap language should be:

- factual,
- respectful,
- concise,
- and non-defensive.

### Forbidden behavior

- Do not use lack of evidence as proof of no experience.
- Do not create dramatic rejection language.
- Do not list minor tool differences as major gaps unless the role makes them central.
- Do not manufacture a gap to balance a positive report.

### Fallback

If no responsible gaps can be identified:

- show no gap items,
- or use an approved neutral statement.

Do not invent one for visual symmetry.

---

## 6.9 Disclaimer

### Visible purpose

Set expectations about the nature and limits of the report.

### Required meaning

The disclaimer should communicate that:

- the report is based on the submitted role description,
- the assessment uses approved portfolio evidence,
- the analysis is qualitative and evidence-based,
- it is not an ATS decision,
- it does not replace human judgment,
- and the visual fit indicator is not a literal numeric score.

### Data source

Static approved copy, with optional language variant.

### Forbidden behavior

- Do not expose model, prompt, API, or internal architecture details.
- Do not imply legal or hiring authority.
- Do not use a long technical disclaimer.

---

## 6.10 Contact CTA

### Visible purpose

Provide a natural next step after the report.

### Data source

```ts
overallFit.level
report state
conversation context
approved contact route
```

### Adaptation rule

The CTA wording may adapt to:

- strong,
- good,
- partial,
- or limited evidence.

The destination itself remains fixed and approved.

### Tone rule

The CTA should be:

- professional,
- warm,
- non-pushy,
- and appropriate to the report outcome.

### Forbidden behavior

- Do not use overly promotional language.
- Do not imply guaranteed availability.
- Do not imply that a fit report is a hiring recommendation.
- Do not open a contact destination that has not been approved.

### Fallback

If contact is unavailable, keep the conversation open without showing a broken CTA.

---

# 7. Internal-only analysis outputs

The following may exist internally but must not appear directly as visible report sections:

- raw model reasoning,
- prompt content,
- trace details,
- source IDs,
- internal Evidence Cards,
- normalized-concept candidates,
- confidence per parser token,
- rejected evidence,
- dedupe logs,
- model version,
- latency,
- retry history,
- and evaluator records.

They may support:

- debugging,
- QA,
- observability,
- or report generation,

but they are not visible report content.

---

# 8. Current visual prototype reconciliation

The current HTML and image are treated as visual references, not as validated data logic.

The following prototype elements require correction before implementation:

### Remove or replace

- explicit numeric fit score,
- visible percentages that imply scientific precision,
- invalid ratios such as `11 / 9`,
- hard-coded project mappings,
- hard-coded strengths and gaps,
- unsupported outcome metrics,
- manual Strong / Good / Partial simulator controls in production,
- and any evidence link not produced from approved Evidence Clusters.

### Preserve at high level

- Role Snapshot area,
- Overall Fit visual area,
- Skills Match area,
- Requirements mapping,
- interactive evidence panel,
- Top Strengths,
- Key Gaps,
- Disclaimer,
- Contact CTA,
- and the existing report information hierarchy.

---

# 9. Canonical report-facing schema

The browser-facing payload must conform to the canonical schema in `Report_Data_Model_v1.0.md`:

```ts
type ReportUIPayload = {
  schemaVersion: "1.0"
  reportId: string
  createdAt: string
  language: "he" | "en"
  state: "ready"

  roleSnapshot: RoleSnapshotUI
  overallFitVisual: OverallFitVisualUI
  evidenceConfidence: EvidenceConfidenceUI

  skillsMatch: SkillsMatchUI
  requirementMapping: RequirementMappingUI
  evidencePanel: EvidencePanelUI

  topStrengths: TopStrengthsUI
  keyGaps: KeyGapsUI

  disclaimer: DisclaimerUI
  contactCta: ContactCtaUI
}
```

Canonical browser-facing items are `ReportItem` objects. They contain `clusterIds`, not raw `evidenceIds` or internal source references.

No additional top-level visible report section is permitted in V1.

---

# 10. Validation rules before rendering

The report may render as ready only when:

- role title, company, description, at least one responsibility, and at least one requirement are valid,
- Overall Fit `mode` is supported,
- `fitVisualValue` falls within the permitted level band,
- evidence confidence exists,
- every positive visible claim maps to approved evidence,
- every cluster link is validated or has a fallback,
- no internal-only source is exposed,
- strengths and gaps are derived from canonical analysis items and emitted as report items,
- no duplicate evidence destination appears,
- and all visible sections use the approved report hierarchy.

If any required validation fails:

```text
report state ≠ ready
```

---

# 11. Decisions explicitly deferred

The following are intentionally not defined in this document:

- illustration design,
- avatar design,
- illustration poses,
- exact colors,
- animation behavior,
- motion timing,
- reduced-motion behavior,
- circular-indicator stroke design,
- transition effects,
- responsive layout implementation,
- and final HTML component code.

These will be defined later in:

```text
Report Visual States & Motion Spec
```

or an equivalent visual-design task.

---

# 12. Acceptance criteria

This contract is ready for the next stage when:

- every existing report area has a documented analytical source,
- every analysis field has a visible or internal destination,
- no additional high-level report section has been introduced,
- the three-level illustration mechanism is formally defined,
- the circular fill is internal and non-numeric,
- insufficient and out-of-scope states are separated,
- strengths and gaps are derived rather than generated independently,
- evidence links are deterministic and deduplicated,
- optional role fields do not create empty layout holes,
- and the current prototype's unsupported numbers and claims are explicitly excluded.

---

# 13. Next step

The next document should be:

```text
Report Handoff Contract v0.1
```

It will define the exact structured object passed from:

- conversation state,
- to role understanding,
- to evidence retrieval,
- to fit analysis,
- to this UI contract,
- and into report follow-up.


---

## Reconciliation record

Version 0.2 aligns this contract with `Report_Data_Model_v1.0.md`. The reconciliation normalizes enum spelling, replaces the draft browser item type with `ReportItem`, removes visibility and raw source references from browser-facing Evidence Clusters, and adopts the canonical `ReportUIPayload`. No product decision or major report section was added or removed.
