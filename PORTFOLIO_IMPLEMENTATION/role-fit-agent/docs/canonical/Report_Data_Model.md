\# Report Data Model v1.1

\*\*Project:\*\* Conversation-Based Portfolio Agent    
\*\*Document type:\*\* Canonical report data model and validation specification    
\*\*Status:\*\* Build-ready source of truth    
\*\*Owner and final approver:\*\* Shani Nakash-Gomel    
\*\*Scope:\*\* Role Fit Report only    
\*\*Supersedes:\*\* Draft report-facing schemas where this document consolidates, normalizes, or clarifies them    
\*\*Primary upstream source:\*\* \`Conversation\_Blueprint\_Package.md\`    
\*\*Supporting contracts:\*\* Reconciled report contracts embedded in \`Conversation\_Blueprint\_Package.md\`

\---

\#\# 1\. Purpose

This document defines the final canonical data model for Report V1.1.

It unifies:

1\. submitted role data,  
2\. normalized role concepts,  
3\. analysis items,  
4\. Evidence Cards,  
5\. Evidence Clusters,  
6\. the three visible fit levels,  
7\. the hidden circular-fill value,  
8\. report UI component payloads,  
9\. report lifecycle states,  
10\. validation and rendering gates,  
11\. internal versus user-visible fields,  
12\. persistence boundaries,  
13\. and valid example payloads.

The high-level report information architecture is closed. This model does not add new major content sections.

\---

\#\# 2\. Authority and conflict rule

When report-data definitions conflict, use this order:

1\. explicit product decisions approved by Shani,  
2\. this \`Report Data Model v1.1\`,  
3\. \`Conversation\_Blueprint\_Package\_v0.2.md\`,  
4\. \`Report\_UI\_to\_Analysis\_Contract\_v0.1.md\`,  
5\. \`Report\_Handoff\_Contract\_v0.1.md\`,  
6\. earlier PRDs and prototypes.

The HTML prototype and report image are visual references only. They are not data sources and must not override this schema.

\---

\#\# 3\. Closed report structure

The V1 report contains only these major sections:

1\. Role Snapshot  
2\. Overall Fit Visual  
3\. Skills Match  
4\. Requirements and Responsibilities Mapping  
5\. Portfolio Evidence Panel  
6\. Top Strengths  
7\. Key Gaps  
8\. Disclaimer  
9\. Contact CTA

The following are not report sections in V1:

\- evidence confidence as an independent section,  
\- salary analysis,  
\- culture fit,  
\- personality analysis,  
\- ATS score,  
\- candidate ranking,  
\- CV rewrite,  
\- recommendations tab,  
\- raw diagnostics,  
\- logs,  
\- model reasoning,  
\- or source-debug information.

Evidence Confidence may appear only as secondary information inside the approved Overall Fit area.

\---

\#\# 4\. Canonical naming decisions

This document resolves inconsistent enum spellings found in earlier drafts.

\#\#\# 4.1 Canonical values

Use these values in all new storage, APIs, model outputs, and UI payloads:

\`\`\`ts  
type MatchType \=  
  | "direct"  
  | "semantic"  
  | "transferable"  
  | "partial"  
  | "insufficient-evidence"  
  | "real-gap"

type OverallFitMode \=  
  | "fit"  
  | "insufficient"  
  | "out-of-scope"  
\`\`\`

\#\#\# 4.2 Deprecated aliases

The following values may be accepted only at an ingestion compatibility boundary:

\`\`\`ts  
"insufficient\_evidence" → "insufficient-evidence"  
"real\_gap"              → "real-gap"  
"out\_of\_scope"          → "out-of-scope"  
\`\`\`

Deprecated aliases must never be persisted or emitted in a validated V1 payload.

\#\#\# 4.3 Identifier and field style

\- JSON field names: \`camelCase\`  
\- enum values: lowercase kebab-case where the value has multiple words  
\- IDs: opaque strings with a typed prefix where practical  
\- timestamps: ISO 8601 UTC strings  
\- URLs: absolute site paths or approved absolute URLs  
\- language: \`he\`, \`en\`, or \`mixed\`  
\- visible report language: \`he\` or \`en\`

\---

\#\# 5\. Layer model

The model is split into four boundaries.

| Boundary | Purpose | May contain internal data? | Sent to browser? |  
|---|---|---:|---:|  
| Intake / Role Understanding | Preserve and validate submitted job content | Yes | No |  
| Analysis | Map role concepts to approved evidence | Yes | No |  
| Composition | Derive clusters, rankings, and display-safe fields | Yes | No |  
| Report UI Payload | Render the approved report | No internal-only data | Yes |

The UI must receive only \`ValidatedReportPayload.report\`.

\---

\#\# 6\. Shared primitives

\`\`\`ts  
type Language \= "he" | "en" | "mixed"  
type ReportLanguage \= "he" | "en"  
type ConfidenceLevel \= "high" | "medium" | "low" | "insufficient"  
type ReliabilityLevel \= "high" | "medium" | "low"  
type RoleImportance \= "must-have" | "core" | "supporting"  
type RoleFamily \=  
  | "ux-product-design"  
  | "product-management"  
  | "innovation-ai-strategy"  
  | "ai-implementation"  
  | "systems-engineering"  
  | "software-engineering"  
  | "research"  
  | "other"

type CareerTransitionType \=  
  | "same-role"  
  | "adjacent-role"  
  | "role-expansion"  
  | "domain-transition"  
  | "profession-transition"  
  | "unrelated-role"

type SeniorityAlignment \=  
  | "underqualified"  
  | "slightly-below"  
  | "aligned"  
  | "above"  
  | "potentially-overqualified"

type CareerDirectionAlignment \=  
  | "aligned"  
  | "plausible-transition"  
  | "unclear"  
  | "misaligned"

type ConstraintType \=  
  | "capability"  
  | "domain"  
  | "platform"  
  | "tool"  
  | "methodology"  
  | "credential"  
  | "legal"  
  | "logistical"  
  | "seniority"  
  | "leadership-scope"

type DomainDependency \= "low" | "medium" | "high" | "critical"  
type Bridgeability \= "high" | "medium" | "low" | "non-bridgeable"  
type CapabilityFit \= "strong" | "moderate" | "weak" | "absent" | "unknown"  
type ContextFit \= "strong" | "partial" | "low" | "not-applicable" | "unknown"  
type OutcomeEvidenceLevel \=  
  | "verified-quantitative"  
  | "verified-qualitative"  
  | "measurement-capability-only"  
  | "not-required"  
  | "insufficient"

type FitQualifier \=  
  | "domain-transition"  
  | "role-expansion"  
  | "profession-transition"  
  | "evidence-limited"  
  | "potentially-overqualified"  
  | "hard-constraint"  
type ClaimKind \=  
  | "documented-fact"  
  | "interpretive-conclusion"  
  | "unverified-assumption"

type ReportSectionKey \=  
  | "role-snapshot"  
  | "overall-fit"  
  | "skills-match"  
  | "requirements-responsibilities"  
  | "evidence-panel"  
  | "top-strengths"  
  | "key-gaps"  
  | "disclaimer"  
  | "contact-cta"  
\`\`\`

\#\#\# 6.1 Shared identifiers

\`\`\`ts  
type ReportIdentifiers \= {  
  conversationId: string  
  conversationSnapshotId: string  
  roleSnapshotId: string  
  sourceSnapshotId: string  
  reportId: string  
  traceId: string  
}  
\`\`\`

All identifiers are required after explicit report approval and before report generation begins.

\---

\#\# 7\. Role data model

\#\#\# 7.1 Role source reference

\`\`\`ts  
type RoleSourceRef \= {  
  sourceId: string  
  kind: "user-text" | "uploaded-file" | "clarification"  
  label?: string  
  locator?: string  
  contentHash?: string  
}  
\`\`\`

\`locator\` may identify a page, paragraph, text span, or message reference. It is internal.

\#\#\# 7.2 Role field

\`\`\`ts  
type RoleField\<T\> \= {  
  originalValue: T  
  normalizedValue?: T  
  sourceRef: RoleSourceRef  
  confidence: "high" | "medium" | "low"  
  confirmed: boolean  
}  
\`\`\`

Rules:

\- \`originalValue\` preserves submitted wording.  
\- \`normalizedValue\` supports matching but never replaces the original visible title.  
\- \`confirmed \= true\` means the field was explicitly present or confirmed in conversation.  
\- Low-confidence required fields cannot make the role complete without clarification.

\#\#\# 7.3 Role draft

\`\`\`ts  
type RoleDraft \= {  
  company?: RoleField\<string\>  
  title?: RoleField\<string\>  
  description?: RoleField\<string\>  
  responsibilities: RoleField\<string\>\[\]  
  requirements: RoleField\<string\>\[\]  
  seniority?: RoleField\<string\>  
  yearsOfExperience?: RoleField\<number\>  
  location?: RoleField\<string\>  
  workModel?: RoleField\<string\>  
  employmentType?: RoleField\<string\>  
  preferredQualifications: RoleField\<string\>\[\]  
}  
\`\`\`

\#\#\# 7.4 Role parse status

\`\`\`ts  
type RoleParseStatus \=  
  | "valid-complete"  
  | "valid-incomplete"  
  | "not-a-job-description"  
  | "unreadable"  
  | "contradictory"  
\`\`\`

\#\#\# 7.5 Required role fields

A role is complete only when all are present and usable:

\- company,  
\- title,  
\- description,  
\- at least one central responsibility,  
\- at least one central requirement.

Optional fields do not block generation:

\- seniority,  
\- years of experience,  
\- location,  
\- work model,  
\- employment type,  
\- preferred qualifications.

\#\#\# 7.6 Validated role snapshot

The report uses an immutable snapshot, not the mutable draft.

\`\`\`ts  
type ValidatedRoleSnapshot \= {  
  roleSnapshotId: string  
  version: number  
  company: string  
  title: string  
  description: string  
  responsibilities: RoleConceptSource\[\]  
  requirements: RoleConceptSource\[\]  
  preferredQualifications: RoleConceptSource\[\]  
  roleFamily: RoleFamily  
  careerTransitionType: CareerTransitionType  
  seniorityAlignment: SeniorityAlignment  
  careerDirectionAlignment: CareerDirectionAlignment  
  seniority?: string  
  yearsOfExperience?: number  
  location?: string  
  workModel?: string  
  employmentType?: string  
  detectedLanguage: Language  
  sourceRefs: RoleSourceRef\[\]  
  validatedAt: string  
  confirmedAt: string  
}  
\`\`\`

\#\#\# 7.7 Role concept source

\`\`\`ts  
type RoleConceptSource \= {  
  roleItemId: string  
  originalText: string  
  source:  
    | "requirement"  
    | "responsibility"  
    | "preferred-qualification"  
  importance: RoleImportance  
  constraintType: ConstraintType  
  underlyingCapability: string  
  domainDependency: DomainDependency  
  sourceRefId: string  
}  
\`\`\`

The \`roleItemId\` is stable within the role snapshot and is the origin of every analysis item.

\---

\#\# 8\. Normalized role concept

\`\`\`ts  
type NormalizedRoleConcept \= {  
  conceptId: string  
  roleItemIds: string\[\]  
  canonicalLabel: string  
  originalTexts: string\[\]  
  sourceTypes: Array\<  
    | "requirement"  
    | "responsibility"  
    | "preferred-qualification"  
    | "title"  
    | "professional-context"  
  \>  
  importance: RoleImportance  
  confidence: "high" | "medium" | "low"  
  ambiguous: boolean  
  alternatives?: string\[\]  
}  
\`\`\`

Rules:

\- A normalized concept is a matching aid, not evidence.  
\- It must point back to one or more role items.  
\- Ambiguous low-confidence concepts may not independently drive a visible positive claim.  
\- Skills shown in the report must originate from role content, not generic portfolio strengths.

\---

\#\# 9\. Evidence Card

An Evidence Card is the smallest approved professional evidence unit.

\`\`\`ts  
type EvidenceCard \= {  
  evidenceId: string  
  conceptIds: string\[\]

  claim: string  
  claimKind: ClaimKind

  context: string  
  action?: string  
  result?: string

  project?: {  
    slug: string  
    title: string  
  }

  source: {  
    type: "case-study" | "cv" | "homepage" | "agent-guidance"  
    label: string  
    locator: string  
    anchorId?: string  
  }

  visibility: "public" | "internal"  
  reliability: ReliabilityLevel  
  approvalStatus: "approved" | "needs-review" | "blocked"

  updatedAt: string  
}  
\`\`\`

\#\#\# 9.1 Evidence eligibility

For visible report support, an Evidence Card must satisfy:

\`\`\`ts  
visibility \=== "public"  
&& approvalStatus \=== "approved"  
&& (reliability \=== "high" || reliability \=== "medium")  
\`\`\`

Internal evidence may be used only if an approved product rule explicitly allows it for internal analysis. It must never be exposed in the UI payload.

\#\#\# 9.2 Evidence restrictions

An Evidence Card must not contain:

\- invented metrics,  
\- unsupported claims,  
\- raw private CV text,  
\- model reasoning,  
\- prompt text,  
\- API or system details,  
\- unapproved personal information.

\`claimKind \= "unverified-assumption"\` is never eligible to support a visible positive claim.

\---

\#\# 10\. Retrieval result

\`\`\`ts  
type EvidenceRetrievalResult \= {  
  reportId: string  
  sourceSnapshotId: string  
  traceId: string

  evidenceCards: EvidenceCard\[\]

  uncoveredConcepts: Array\<{  
    conceptId: string  
    sourceText: string  
    reason:  
      | "no-approved-evidence"  
      | "no-public-evidence"  
      | "low-reliability-only"  
  }\>

  summary: {  
    requestedConceptCount: number  
    coveredConceptCount: number  
    evidenceCardCount: number  
  }  
}  
\`\`\`

V1 retrieval is deterministic:

\`\`\`text  
conceptId match  
\+ public visibility  
\+ approved status  
\+ allowed reliability  
\`\`\`

Semantic plausibility alone cannot authorize evidence.

\---

\#\# 11\. Analysis item

The Analysis Item is the canonical unit from which mapped items, Top Strengths, and Key Gaps are derived.

\`\`\`ts  
type AnalysisItem \= {  
  itemId: string

  roleItemId: string  
  originalText: string  
  normalizedConceptId?: string  
  displayLabel?: string

  source:  
    | "skill"  
    | "requirement"  
    | "responsibility"  
    | "professional-context"

  importance: RoleImportance

  matchType: MatchType  
  claimKind: ClaimKind  
  evidenceConfidence: ConfidenceLevel

  capabilityFit: CapabilityFit  
  contextFit: ContextFit  
  bridgeability: Bridgeability  
  domainDependency: DomainDependency  
  constraintType: ConstraintType  
  outcomeEvidenceLevel: OutcomeEvidenceLevel

  shortRationale: string  
  evidenceIds: string\[\]

  internal: {  
    selectedForMapping: boolean  
    selectionRank?: number  
    strengthRank?: number  
    gapRank?: number  
    exclusionReasons?: string\[\]  
  }  
}  
\`\`\`

\#\#\# 11.1 Evidence rules by match type

| Match type | Evidence IDs | Allowed claim kind | Meaning |  
|---|---:|---|---|  
| \`direct\` | ≥1 | documented fact or supported interpretation | Comparable documented experience |  
| \`semantic\` | ≥1 | interpretive conclusion | Different wording, aligned professional meaning |  
| \`transferable\` | ≥1 | interpretive conclusion | Relevant capability from another context |  
| \`partial\` | ≥1 | documented fact or interpretation | Some coverage, not full coverage |  
| \`insufficient-evidence\` | 0 allowed | interpretive conclusion | Cannot determine from approved evidence |  
| \`real-gap\` | 0 allowed | interpretive conclusion | Reviewed evidence supports absence of the underlying capability or a non-bridgeable hard constraint |

Additional rules:

\- \`direct\`, \`semantic\`, \`transferable\`, and \`partial\` must reference eligible evidence.  
\- \`insufficient-evidence\` must never be worded as proof of no experience.  
\- \`real-gap\` requires evidence that the underlying capability is absent, or that a credential, legal, logistical, or other non-bridgeable hard constraint is unmet. Domain, platform, audience, or business-model mismatch alone is not enough.  
\- \`unverified-assumption\` cannot appear in a visible report item.  
\- Every item must trace to \`roleItemId\`.

\#\#\# 11.2 Derived impact

\`impact\` is not generated by the model. The composer derives it.

\`\`\`ts  
function deriveImpact(matchType: MatchType): "strength" | "gap" | "neutral" {  
  switch (matchType) {  
    case "direct":  
    case "semantic":  
    case "transferable":  
      return "strength"  
    case "partial":  
    case "insufficient-evidence":  
    case "real-gap":  
      return "gap"  
  }  
}  
\`\`\`

A UI may visually soften \`partial\` or \`insufficient-evidence\`, but the stored derivation remains deterministic.

\---

\#\# 12\. Fit analysis result

\`\`\`ts  
type FitAnalysisResult \= {  
  identifiers: ReportIdentifiers

  overallFit:  
    | {  
        mode: "fit"  
        level: "strong" | "good" | "partial"  
        fitVisualValue: number  
        label: string  
        rationale: string  
      }  
    | {  
        mode: "insufficient"  
        label: string  
        rationale: string  
      }  
    | {  
        mode: "out-of-scope"  
        label: string  
        rationale: string  
      }

  evidenceConfidence: {  
    level: ConfidenceLevel  
    rationale: string  
  }

  sections: {  
    skills: AnalysisItem\[\]  
    requirements: AnalysisItem\[\]  
    responsibilities: AnalysisItem\[\]  
    professionalContext: AnalysisItem\[\]  
  }

  topStrengthItemIds: string\[\]  
  keyGapItemIds: string\[\]

  internalDiagnostics: {  
    coveredCoreRequirementCount: number  
    totalCoreRequirementCount: number  
    coveredMustHaveCount: number  
    totalMustHaveCount: number  
    realGapCount: number  
    insufficientEvidenceCount: number  
    highConfidenceEvidenceCount: number  
    evidenceCoverageRatio?: number  
    fitComputationVersion: string  
  }  
}  
\`\`\`

\`internalDiagnostics\` is never sent to the client.

\---

\#\# 12A. Role-family and transferability interpretation

Role-family classification occurs before requirement matching. Similar job titles must not override the actual discipline described by responsibilities and qualifications.

Examples:

\- A role titled “Lead System Designer” that requires an engineering degree, V\&V ownership, technical risk management, and systems-engineering judgment is classified as \`systems-engineering\`, not UX/Product Design.  
\- Innovation Lead roles are a supported same-family or role-expansion path when the approved evidence demonstrates innovation leadership, organizational transformation, facilitation, AI adoption, and cross-functional influence.  
\- Junior-to-mid AI implementation or AI product roles may be classified as an adjacent-role or domain-transition opportunity. Strong UX architecture, problem framing, human-centered AI, and completed AI-implementation training may increase fit, while limited implementation depth must remain visible.

\#\#\# 12A.1 Capability versus context

Each role item is evaluated on separate dimensions:

1\. \`capabilityFit\` — whether the underlying ability is demonstrated.  
2\. \`contextFit\` — whether it was demonstrated in the same domain, audience, platform, scale, or business model.  
3\. \`bridgeability\` — whether the context difference can reasonably be learned or transferred.  
4\. \`evidenceConfidence\` — how strongly approved sources support the conclusion.

A domain mismatch is not automatically a capability gap. Mobile work in another domain may support mobile UX capability while preserving a qualification about B2C scale. Gaming experience may receive transferable support for adoption, feedback, motivation, task completion, and behavioral design, while reward economies, monetization, streaks, and near-miss mechanics remain explicit context gaps.

\#\#\# 12A.2 Must-have interpretation

A stated must-have influences fit but does not automatically determine it. The analysis must identify what the employer is trying to guarantee through the requirement.

\- If the underlying capability is strongly evidenced and the remaining difference is bridgeable context, the report may still return Good Fit with a visible qualification.  
\- If the requirement is a credential, legal condition, mandatory language, professional license, or non-bridgeable discipline requirement, it may materially limit or block fit.  
\- Requirement wording must never be treated as a universal knockout rule without semantic interpretation.

\#\#\# 12A.3 Measurement capability versus measured outcome

The model must distinguish:

\- ability to define KPIs, instrumentation, evaluation methods, and learning loops; and  
\- verified evidence that a commercial or operational metric changed because of the work.

Strong measurement capability may support fit even when exact metrics cannot be published. It must not be rewritten as verified revenue, retention, conversion, ARPU, ROI, or adoption impact.

\#\#\# 12A.4 Seniority and overqualification

\`seniorityAlignment\` is evaluated separately from capability fit. A candidate may be a Strong Fit and still be \`potentially-overqualified\` when the role has narrower ownership, a substantially lower experience threshold, an existing lead above the role, or a heavier execution focus than the candidate’s approved career direction.

Overqualification is a qualifier, not an automatic rejection.

\#\# 13\. Overall fit model

\#\#\# 13.1 Visible fit levels

\`\`\`ts  
type VisibleFitLevel \= "strong" | "good" | "partial"  
\`\`\`

The visible label is qualitative only.

\#\#\# 13.2 Hidden visual fill

\`\`\`ts  
const fitVisualBands \= {  
  partial: { min: 30, max: 54 },  
  good: { min: 55, max: 79 },  
  strong: { min: 80, max: 100 },  
} as const  
\`\`\`

Rules:

\- \`fitVisualValue\` is an integer.  
\- It controls only the circular fill.  
\- It is never shown numerically.  
\- It is never called a score or percentage.  
\- It is valid only when \`mode \= "fit"\`.  
\- It must fall inside the band associated with \`level\`.

\#\#\# 13.3 Deterministic visual mapping

\`\`\`ts  
const overallFitPresentation \= {  
  partial: {  
    illustrationKey: "fit-partial",  
    colorToken: "fit.partial",  
  },  
  good: {  
    illustrationKey: "fit-good",  
    colorToken: "fit.good",  
  },  
  strong: {  
    illustrationKey: "fit-strong",  
    colorToken: "fit.strong",  
  },  
} as const  
\`\`\`

The model does not select arbitrary illustrations or color tokens.

\#\#\# 13.4 Fit decision inputs

The fit result may consider:

\- must-have coverage,  
\- core-requirement coverage,  
\- match strength,  
\- importance of unmatched items,  
\- evidence reliability and confidence,  
\- real gaps,  
\- insufficient-evidence volume,  
\- and role-context relevance.

It must not be based only on keyword count.

\#\#\# 13.5 Exceptional outcomes

\#\#\#\# Insufficient

Use when the role is valid but approved evidence is inadequate for an accountable overall conclusion.

Rules:

\- no fit level,  
\- no circular fill,  
\- no fit illustration,  
\- no visual score proxy.

\#\#\#\# Out of scope

Use when the role is materially outside the documented professional experience.

Rules:

\- no normal three-level fit visual,  
\- no forced partial rating,  
\- no detailed invented gap list,  
\- use respectful product-approved handling.

\---

\#\# 14\. Evidence Cluster

An Evidence Cluster is a display-safe grouping of one or more eligible Evidence Cards.

\`\`\`ts  
type EvidenceCluster \= {  
  clusterId: string  
  title: string  
  summary: string

  supportedItemIds: string\[\]  
  evidenceIds: string\[\]

  project?: {  
    slug: string  
    title: string  
  }

  destination:  
    | {  
        mode: "anchor"  
        href: string  
        anchorId: string  
        dedupeKey: string  
      }  
    | {  
        mode: "project-top"  
        href: string  
        dedupeKey: string  
      }  
    | {  
        mode: "no-link"  
        dedupeKey: string  
      }

  reliability: ReliabilityLevel  
}  
\`\`\`

\#\#\# 14.1 Construction rules

The composer builds clusters deterministically from eligible Evidence Cards.

It must not invent:

\- project names,  
\- destinations,  
\- anchor IDs,  
\- claims,  
\- metrics,  
\- or evidence IDs.

\#\#\# 14.2 Dedupe rules

\`\`\`text  
anchor destination: projectSlug \+ "\#" \+ anchorId  
project top:        projectSlug \+ "\#\_\_top"  
no link:            "no-link:" \+ stableClusterSourceKey  
\`\`\`

Within one report:

\- every \`dedupeKey\` is unique,  
\- one cluster may support several analysis items,  
\- an item may reference several clusters,  
\- a destination is rendered once and referenced many times.

\#\#\# 14.3 Cluster visibility

There is no \`visibility\` field in the browser-facing cluster. Visibility has already been enforced before composition.

A cluster containing any blocked, unapproved, or internal-only raw source fails evidence validation.

\---

\#\# 15\. Browser-facing report item

The browser does not receive raw \`AnalysisItem.internal\` data or raw evidence IDs.

\`\`\`ts  
type ReportItem \= {  
  itemId: string  
  originalText: string  
  displayLabel?: string  
  normalizedConcept?: string

  source:  
    | "skill"  
    | "requirement"  
    | "responsibility"  
    | "professional-context"

  importance: RoleImportance  
  matchType: MatchType  
  impact: "strength" | "gap" | "neutral"  
  evidenceConfidence: ConfidenceLevel  
  shortRationale: string  
  clusterIds: string\[\]  
}  
\`\`\`

Rules:

\- \`clusterIds\` replace raw \`evidenceIds\` in the UI.  
\- Positive and partial items require at least one valid \`clusterId\`.  
\- Gap items may have no cluster when no public evidence link is appropriate.  
\- No internal source references are included.

\---

\#\# 16\. UI component data model

\#\#\# 16.1 Role Snapshot

\`\`\`ts  
type RoleSnapshotUI \= {  
  company: string  
  title: string  
  seniority?: string  
  yearsOfExperience?: number  
  location?: string  
  workModel?: string  
  employmentType?: string  
}  
\`\`\`

Only confirmed fields are included. Missing optional values are omitted, not set to empty strings.

\#\#\# 16.2 Overall Fit Visual

\`\`\`ts  
type OverallFitVisualUI \=  
  | {  
      mode: "fit"  
      level: "strong" | "good" | "partial"  
      fitVisualValue: number  
      illustrationKey: "fit-strong" | "fit-good" | "fit-partial"  
      colorToken: "fit.strong" | "fit.good" | "fit.partial"  
      label: string  
      rationale: string  
      qualifiers?: FitQualifier\[\]  
    }  
  | {  
      mode: "insufficient"  
      label: string  
      rationale: string  
    }  
  | {  
      mode: "out-of-scope"  
      label: string  
      rationale: string  
    }  
\`\`\`

\`fitVisualValue\` is technically included in the UI payload because the renderer needs it, but it is a non-display field. It must not be bound to text, aria-value text, tooltip, analytics label, or accessible description as a percentage.

\#\#\# 16.3 Evidence Confidence

\`\`\`ts  
type EvidenceConfidenceUI \= {  
  level: ConfidenceLevel  
  rationale: string  
}  
\`\`\`

It appears only within the Overall Fit component area.

\#\#\# 16.4 Skills Match

\`\`\`ts  
type SkillsMatchUI \= {  
  items: ReportItem\[\]  
  visualCoverage:  
    | {  
        mode: "qualitative"  
        label: string  
      }  
    | {  
        mode: "hidden-continuum"  
        internalValue: number  
      }  
    | {  
        mode: "traceable-count"  
        matchedCount: number  
        totalCount: number  
      }  
}  
\`\`\`

V1 recommendation: use \`qualitative\` or \`hidden-continuum\`. Use \`traceable-count\` only when the denominator is fully derived from the visible role skill set.

\#\#\# 16.5 Requirements and Responsibilities Mapping

\`\`\`ts  
type RequirementMappingUI \= {  
  items: ReportItem\[\]  
  defaultSelectedItemId?: string  
}  
\`\`\`

Rules:

\- Maximum visible mapped items: 5\.  
\- Selection is based on importance and value, not input order.  
\- Central gaps may not be hidden merely to produce a positive report.  
\- \`defaultSelectedItemId\`, when present, must exist in \`items\`.

\#\#\# 16.6 Portfolio Evidence Panel

\`\`\`ts  
type EvidencePanelUI \= {  
  clusters: EvidenceCluster\[\]  
  defaultClusterId?: string  
}  
\`\`\`

\`defaultClusterId\`, when present, must be linked from the default selected item.

\#\#\# 16.7 Top Strengths

\`\`\`ts  
type TopStrengthsUI \= {  
  items: ReportItem\[\]  
}  
\`\`\`

Rules:

\- 0–5 items,  
\- derived from \`direct\`, \`semantic\`, or \`transferable\`,  
\- no duplicate \`itemId\`,  
\- no independent claims.

\#\#\# 16.8 Key Gaps

\`\`\`ts  
type KeyGapsUI \= {  
  items: ReportItem\[\]  
}  
\`\`\`

Rules:

\- 0–3 items,  
\- derived from \`partial\`, \`insufficient-evidence\`, or \`real-gap\`,  
\- classifications remain visible and distinct,  
\- no gap is invented for visual symmetry.

\#\#\# 16.9 Disclaimer

\`\`\`ts  
type DisclaimerUI \= {  
  copyKey: "report.disclaimer.v1"  
  text: string  
}  
\`\`\`

The disclaimer is approved static localized copy. The model does not generate it.

\#\#\# 16.10 Contact CTA

\`\`\`ts  
type ContactCtaUI \= {  
  variant:  
    | "strong"  
    | "good"  
    | "partial"  
    | "insufficient"  
    | "out-of-scope"  
  label: string  
  href?: string  
  enabled: boolean  
}  
\`\`\`

The destination must come from approved application configuration, not model output.

\---

\#\# 17\. Canonical Report UI Payload

\`\`\`ts  
type ReportUIPayload \= {  
  schemaVersion: "1.0"  
  reportId: string  
  createdAt: string  
  language: ReportLanguage

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
\`\`\`

No other top-level visible report section is permitted in V1.

\---

\#\# 18\. Report lifecycle states

\`\`\`ts  
type ReportState \=  
  | "draft"  
  | "awaiting-confirmation"  
  | "queued"  
  | "generating"  
  | "validating"  
  | "ready"  
  | "limited"  
  | "out-of-scope"  
  | "failed"  
  | "superseded"  
\`\`\`

\#\#\# 18.1 State meanings

| State | Meaning | UI render rule |  
|---|---|---|  
| \`draft\` | Mutable role/report preparation data exists | No report |  
| \`awaiting-confirmation\` | Role valid; explicit approval missing | Confirmation UI only |  
| \`queued\` | Approved generation request accepted | Loading only |  
| \`generating\` | Retrieval/analysis/composition running | Loading only |  
| \`validating\` | Payload gates are running | Loading only |  
| \`ready\` | Normal valid fit report | Full approved report |  
| \`limited\` | Valid role; insufficient evidence outcome | Limited-state approved report surface |  
| \`out-of-scope\` | Role outside documented scope | Out-of-scope approved response surface |  
| \`failed\` | Generation or validation failed | Recoverable error |  
| \`superseded\` | Replaced by a newer report/version | Read-only history if retained |

\#\#\# 18.2 Important distinction

\`overallFitVisual.mode\` describes the analytical result.

\`ReportState\` describes lifecycle and render behavior.

Canonical mapping:

\`\`\`text  
mode \= fit           → state \= ready  
mode \= insufficient  → state \= limited  
mode \= out-of-scope  → state \= out-of-scope  
\`\`\`

A client-facing payload for \`limited\` or \`out-of-scope\` may reuse the same approved report shell, but must not render the three-state visual.

\---

\#\# 19\. Composition record

The persisted server-side report record is broader than the UI payload.

\`\`\`ts  
type ReportRecord \= {  
  schemaVersion: "1.0"  
  identifiers: ReportIdentifiers

  state: ReportState  
  language: ReportLanguage

  roleSnapshot: ValidatedRoleSnapshot  
  normalizedConcepts: NormalizedRoleConcept\[\]

  evidenceSnapshot: {  
    evidenceIds: string\[\]  
    evidenceCards: EvidenceCard\[\]  
    createdAt: string  
  }

  fitAnalysis?: FitAnalysisResult  
  reportPayload?: ReportUIPayload

  validation?: ReportValidationResult

  generation: {  
    trigger: "dedicated-button" | "natural-language-request"  
    approvedAt: string  
    startedAt?: string  
    completedAt?: string  
    failedAt?: string  
    modelVersion?: string  
    composerVersion: string  
    retryCount: number  
  }

  createdAt: string  
  updatedAt: string  
}  
\`\`\`

\#\#\# 19.1 Persistence recommendation

For the MVP:

\- Store role snapshots, report metadata, item IDs, cluster IDs, and validation outcomes.  
\- Store raw uploaded job content only according to the final retention policy.  
\- Prefer references/hashes over duplicating private source text in logs.  
\- Keep UI payload and analysis result versioned.  
\- Do not persist raw chain-of-thought or prompts.

\---

\#\# 20\. Internal versus visible field matrix

| Field / object | Internal | Visible | Notes |  
|---|---:|---:|---|  
| \`conversationId\` | Yes | No | Operational |  
| \`traceId\` | Yes | No | Logging only |  
| \`roleSnapshotId\` | Yes | No | Traceability |  
| Original role title/company | Yes | Yes | Confirmed job facts |  
| Role field confidence | Yes | No | Parsing only |  
| Source locator | Yes | No | Never expose internal source IDs |  
| Normalized concept ID | Yes | No | Label may be visible |  
| \`AnalysisItem.internal\` | Yes | No | Ranking/exclusions |  
| \`evidenceIds\` | Yes | No | Replaced by cluster IDs |  
| Evidence Card raw source data | Yes | No | Cluster summary only |  
| Evidence Cluster title/summary | Yes | Yes | Public-safe |  
| Fit level | Yes | Yes | Qualitative |  
| \`fitVisualValue\` | Yes | Renderer-only | Never textual/numeric |  
| Internal diagnostics | Yes | No | Evaluation only |  
| Evidence confidence | Yes | Yes | Secondary status |  
| Match type | Yes | Yes | Needed for explanation |  
| \`impact\` | Derived | Yes | UI styling/semantics |  
| Disclaimer | Config | Yes | Static approved copy |  
| Contact URL | Config | Yes when enabled | Not model-generated |  
| Model version | Yes | No | Observability |  
| Retry count | Yes | No | Observability |  
| Validation results | Yes | No | Only safe failure copy shown |

\---

\#\# 21\. Validation architecture

Validation runs in ordered gates.

\`\`\`text  
1\. Request gate  
2\. Role gate  
3\. Analysis gate  
4\. Evidence gate  
5\. Composition gate  
6\. Privacy gate  
7\. Link gate  
8\. UI-schema gate  
9\. State-transition gate  
\`\`\`

A failure in any hard gate prevents \`ready\`.

\---

\#\# 22\. Request gate

A generation request is valid only when:

\`\`\`ts  
approval.approved \=== true  
&& session.reportGenerationCountBeforeRun \< 2  
&& identifiers.conversationId is present  
&& identifiers.conversationSnapshotId is present  
&& identifiers.roleSnapshotId is present  
&& identifiers.reportId is present  
&& identifiers.traceId is present  
\`\`\`

Hard failures:

\- missing explicit approval,  
\- report count already 2,  
\- missing role snapshot,  
\- invalid identifiers.

The report limit must be checked before report ID creation, model call, loading state, retrieval, or composition.

\---

\#\# 23\. Role gate

A role snapshot passes when:

\- company is a non-empty confirmed string,  
\- title is a non-empty confirmed string,  
\- description is non-empty,  
\- responsibilities contain at least one central item,  
\- requirements contain at least one central item,  
\- every role item has a stable \`roleItemId\`,  
\- every role item has a source reference,  
\- no blocking contradiction remains,  
\- required low-confidence fields were clarified.

Optional fields must be omitted when unknown. Empty placeholders are invalid.

\---

\#\# 24\. Analysis gate

Every Analysis Item must satisfy:

\- unique \`itemId\`,  
\- valid \`roleItemId\`,  
\- valid source type,  
\- valid importance,  
\- canonical \`matchType\`,  
\- non-empty rationale,  
\- no unsupported claim kind,  
\- evidence relationship consistent with match type.

Additional constraints:

\`\`\`ts  
topStrengthItemIds.length \<= 5  
keyGapItemIds.length \<= 3  
\`\`\`

All referenced item IDs must exist in one of the section arrays.

\`topStrengthItemIds\` may reference only direct, semantic, or transferable items.

\`keyGapItemIds\` may reference only partial, insufficient-evidence, or real-gap items.

\---

\#\# 25\. Overall fit gate

For \`mode \= "fit"\`:

\- level is strong, good, or partial,  
\- \`fitVisualValue\` is an integer,  
\- value is inside the correct band,  
\- illustration and color are derived from the fixed map,  
\- label and rationale are non-empty,  
\- evidence confidence is not \`insufficient\`.

For \`mode \= "insufficient"\`:

\- no level,  
\- no \`fitVisualValue\`,  
\- no illustration key,  
\- no color token,  
\- report state must be \`limited\`.

For \`mode \= "out-of-scope"\`:

\- no level,  
\- no \`fitVisualValue\`,  
\- no illustration key,  
\- no color token,  
\- report state must be \`out-of-scope\`.

\---

\#\# 26\. Evidence gate

The report passes evidence validation only when:

\- every positive or partial item maps to at least one eligible Evidence Card,  
\- every evidence ID exists in the evidence snapshot,  
\- every Evidence Cluster contains only eligible public evidence,  
\- every \`supportedItemId\` exists,  
\- every cluster evidence ID exists,  
\- every item cluster ID exists,  
\- no cluster exposes internal-only metadata,  
\- no blocked or needs-review evidence supports visible content,  
\- no visible claim uses \`unverified-assumption\`.

\`insufficient-evidence\` and \`real-gap\` may have zero evidence IDs, but must include an accountable rationale.

\---

\#\# 27\. Composition gate

The composer must verify:

\- only the nine approved major sections exist,  
\- all visible items are derived from analysis items,  
\- Top Strengths and Key Gaps are not independently generated,  
\- maximum item limits are respected,  
\- mapping items are selected by ranking, not source order,  
\- optional role fields are omitted cleanly,  
\- default item and cluster references are valid,  
\- impact is derived, not model-authored,  
\- illustration/color mapping is deterministic,  
\- disclaimer uses approved copy,  
\- CTA URL comes from configuration.

\---

\#\# 28\. Link and deduplication gate

For every cluster destination:

\- \`href\` matches an approved portfolio route or approved URL,  
\- anchor belongs to the selected project when mode is \`anchor\`,  
\- missing anchors use \`project-top\`,  
\- unavailable routes use \`no-link\`,  
\- every \`dedupeKey\` is unique,  
\- no broken link blocks the report when a safe fallback is available.

A duplicate destination fails composition until merged.

\---

\#\# 29\. Privacy gate

The UI payload must not include:

\- prompts,  
\- raw logs,  
\- trace IDs,  
\- source snapshot IDs,  
\- role source locators,  
\- raw Evidence Cards,  
\- private CV content,  
\- internal-only evidence,  
\- model version,  
\- retry history,  
\- rejected evidence,  
\- hidden diagnostics,  
\- API keys,  
\- internal endpoints.

The report may expose only approved public project names, summaries, and destinations.

\---

\#\# 30\. UI-schema gate

A ready payload must satisfy:

\- \`schemaVersion \= "1.0"\`,  
\- \`state \= "ready"\`,  
\- report ID and creation timestamp are valid,  
\- report language is \`he\` or \`en\`,  
\- Role Snapshot required fields exist,  
\- all section objects exist,  
\- arrays may be empty only where explicitly allowed,  
\- all enum values are canonical,  
\- no unknown top-level keys are accepted in strict mode.

Recommended implementation: JSON Schema with \`additionalProperties: false\` for the UI payload.

\---

\#\# 31\. Validation output

\`\`\`ts  
type ReportValidationResult \=  
  | {  
      valid: true  
      schemaValid: true  
      roleValid: true  
      analysisValid: true  
      evidenceValid: true  
      privacyValid: true  
      linkValidationComplete: true  
      noDuplicateDestinations: true  
      stateValid: true  
      validatedAt: string  
    }  
  | {  
      valid: false  
      reportId: string  
      errorCategory:  
        | "request"  
        | "role"  
        | "analysis"  
        | "evidence"  
        | "privacy"  
        | "link"  
        | "visual-band"  
        | "composition"  
        | "schema"  
        | "state"  
      safeMessageKey: string  
      repairable: boolean  
      internalIssues: Array\<{  
        code: string  
        path?: string  
        message: string  
      }\>  
      validatedAt: string  
    }  
\`\`\`

\`internalIssues\` must never be sent to the browser.

\---

\#\# 32\. Validated payload envelope

\`\`\`ts  
type ValidatedReportPayload \=  
  | {  
      valid: true  
      report: ReportUIPayload  
      validation: {  
        schemaValid: true  
        evidenceValid: true  
        privacyValid: true  
        linkValidationComplete: true  
        noDuplicateDestinations: true  
      }  
    }  
  | {  
      valid: false  
      reportId: string  
      errorCategory:  
        | "request"  
        | "role"  
        | "analysis"  
        | "evidence"  
        | "privacy"  
        | "link"  
        | "visual-band"  
        | "composition"  
        | "schema"  
        | "state"  
      safeMessageKey: string  
    }  
\`\`\`

Invalid payloads must never enter \`report-ready\`.

\---

\#\# 33\. Valid example payload — normal fit report

\`\`\`json  
{  
  "valid": true,  
  "report": {  
    "schemaVersion": "1.0",  
    "reportId": "rpt\_01JZ7A2X",  
    "createdAt": "2026-07-25T09:30:00Z",  
    "language": "en",  
    "state": "ready",  
    "roleSnapshot": {  
      "company": "Example Systems",  
      "title": "Senior UX Strategist",  
      "seniority": "Senior",  
      "yearsOfExperience": 8,  
      "location": "Israel",  
      "workModel": "Hybrid"  
    },  
    "overallFitVisual": {  
      "mode": "fit",  
      "level": "strong",  
      "fitVisualValue": 86,  
      "illustrationKey": "fit-strong",  
      "colorToken": "fit.strong",  
      "label": "Strong fit",  
      "rationale": "Most central requirements are supported by direct evidence or strong semantic alignment, including complex-system UX, strategic ownership, and cross-functional leadership."  
    },  
    "evidenceConfidence": {  
      "level": "high",  
      "rationale": "The central conclusions are supported by multiple approved public case-study sources."  
    },  
    "skillsMatch": {  
      "items": \[  
        {  
          "itemId": "itm\_complex\_systems",  
          "originalText": "Lead UX for complex operational systems",  
          "displayLabel": "Complex operational systems",  
          "normalizedConcept": "complex-systems-ux",  
          "source": "skill",  
          "importance": "must-have",  
          "matchType": "direct",  
          "impact": "strength",  
          "evidenceConfidence": "high",  
          "shortRationale": "Documented ownership of UX strategy and workflows in mission-critical command-and-control environments.",  
          "clusterIds": \["clu\_maritime\_c2"\]  
        },  
        {  
          "itemId": "itm\_ai\_workflows",  
          "originalText": "Experience designing AI-supported workflows",  
          "displayLabel": "AI-supported workflows",  
          "normalizedConcept": "ai-supported-workflows",  
          "source": "skill",  
          "importance": "core",  
          "matchType": "transferable",  
          "impact": "strength",  
          "evidenceConfidence": "medium",  
          "shortRationale": "Relevant workflow and automation experience is documented, while the exact product context differs.",  
          "clusterIds": \["clu\_monitoring\_learning"\]  
        }  
      \],  
      "visualCoverage": {  
        "mode": "qualitative",  
        "label": "Broad coverage of central role capabilities"  
      }  
    },  
    "requirementMapping": {  
      "items": \[  
        {  
          "itemId": "itm\_complex\_systems",  
          "originalText": "Lead UX for complex operational systems",  
          "displayLabel": "Complex operational systems",  
          "normalizedConcept": "complex-systems-ux",  
          "source": "requirement",  
          "importance": "must-have",  
          "matchType": "direct",  
          "impact": "strength",  
          "evidenceConfidence": "high",  
          "shortRationale": "Comparable responsibility is documented across complex operational products.",  
          "clusterIds": \["clu\_maritime\_c2"\]  
        },  
        {  
          "itemId": "itm\_product\_analytics",  
          "originalText": "Define product analytics and measurement strategy",  
          "displayLabel": "Product analytics strategy",  
          "normalizedConcept": "product-analytics",  
          "source": "responsibility",  
          "importance": "core",  
          "matchType": "partial",  
          "impact": "gap",  
          "evidenceConfidence": "medium",  
          "shortRationale": "Monitoring and learning-system work is relevant, but the approved evidence does not show full ownership of a product-wide analytics function.",  
          "clusterIds": \["clu\_monitoring\_learning"\]  
        },  
        {  
          "itemId": "itm\_b2c\_growth",  
          "originalText": "Own B2C growth experimentation",  
          "displayLabel": "B2C growth experimentation",  
          "normalizedConcept": "b2c-growth",  
          "source": "requirement",  
          "importance": "core",  
          "matchType": "insufficient-evidence",  
          "impact": "gap",  
          "evidenceConfidence": "insufficient",  
          "shortRationale": "The approved portfolio evidence does not establish ownership of B2C growth experimentation.",  
          "clusterIds": \[\]  
        }  
      \],  
      "defaultSelectedItemId": "itm\_complex\_systems"  
    },  
    "evidencePanel": {  
      "clusters": \[  
        {  
          "clusterId": "clu\_maritime\_c2",  
          "title": "Maritime C2 Monitoring",  
          "summary": "Shows UX strategy, operational workflow design, role-based interfaces, and recovery support in a mission-critical environment.",  
          "supportedItemIds": \["itm\_complex\_systems"\],  
          "evidenceIds": \["ev\_maritime\_01", "ev\_maritime\_02"\],  
          "project": {  
            "slug": "maritime-c2-monitoring",  
            "title": "Maritime C2 Monitoring"  
          },  
          "destination": {  
            "mode": "anchor",  
            "href": "/work/maritime-c2-monitoring",  
            "anchorId": "ux-strategy",  
            "dedupeKey": "maritime-c2-monitoring\#ux-strategy"  
          },  
          "reliability": "high"  
        },  
        {  
          "clusterId": "clu\_monitoring\_learning",  
          "title": "From Feedback Loop to Learning System",  
          "summary": "Shows the design of monitoring, diagnostics, and learning-oriented operational feedback.",  
          "supportedItemIds": \["itm\_ai\_workflows", "itm\_product\_analytics"\],  
          "evidenceIds": \["ev\_learning\_01"\],  
          "project": {  
            "slug": "learning-system",  
            "title": "From Feedback Loop to Learning System"  
          },  
          "destination": {  
            "mode": "project-top",  
            "href": "/work/learning-system",  
            "dedupeKey": "learning-system\#\_\_top"  
          },  
          "reliability": "medium"  
        }  
      \],  
      "defaultClusterId": "clu\_maritime\_c2"  
    },  
    "topStrengths": {  
      "items": \[  
        {  
          "itemId": "itm\_complex\_systems",  
          "originalText": "Lead UX for complex operational systems",  
          "displayLabel": "Complex operational systems",  
          "normalizedConcept": "complex-systems-ux",  
          "source": "requirement",  
          "importance": "must-have",  
          "matchType": "direct",  
          "impact": "strength",  
          "evidenceConfidence": "high",  
          "shortRationale": "Comparable responsibility is documented across complex operational products.",  
          "clusterIds": \["clu\_maritime\_c2"\]  
        },  
        {  
          "itemId": "itm\_ai\_workflows",  
          "originalText": "Experience designing AI-supported workflows",  
          "displayLabel": "AI-supported workflows",  
          "normalizedConcept": "ai-supported-workflows",  
          "source": "skill",  
          "importance": "core",  
          "matchType": "transferable",  
          "impact": "strength",  
          "evidenceConfidence": "medium",  
          "shortRationale": "Relevant workflow and automation experience is documented, while the exact product context differs.",  
          "clusterIds": \["clu\_monitoring\_learning"\]  
        }  
      \]  
    },  
    "keyGaps": {  
      "items": \[  
        {  
          "itemId": "itm\_b2c\_growth",  
          "originalText": "Own B2C growth experimentation",  
          "displayLabel": "B2C growth experimentation",  
          "normalizedConcept": "b2c-growth",  
          "source": "requirement",  
          "importance": "core",  
          "matchType": "insufficient-evidence",  
          "impact": "gap",  
          "evidenceConfidence": "insufficient",  
          "shortRationale": "The approved portfolio evidence does not establish ownership of B2C growth experimentation.",  
          "clusterIds": \[\]  
        }  
      \]  
    },  
    "disclaimer": {  
      "copyKey": "report.disclaimer.v1",  
      "text": "This qualitative report is based on the submitted role description and approved portfolio evidence. It is not an ATS decision, does not replace human judgment, and the visual fit indicator is not a literal numeric score."  
    },  
    "contactCta": {  
      "variant": "strong",  
      "label": "Continue the conversation",  
      "href": "/contact",  
      "enabled": true  
    }  
  },  
  "validation": {  
    "schemaValid": true,  
    "evidenceValid": true,  
    "privacyValid": true,  
    "linkValidationComplete": true,  
    "noDuplicateDestinations": true  
  }  
}  
\`\`\`

\---

\#\# 34\. Valid example payload — insufficient evidence

This is a valid analytical outcome, but it does not use the normal three-level visual.

\`\`\`json  
{  
  "schemaVersion": "1.0",  
  "reportId": "rpt\_01JZ7B11",  
  "createdAt": "2026-07-25T09:45:00Z",  
  "language": "en",  
  "state": "limited",  
  "roleSnapshot": {  
    "company": "Example Robotics",  
    "title": "Robotics Interaction Designer"  
  },  
  "overallFitVisual": {  
    "mode": "insufficient",  
    "label": "Insufficient evidence",  
    "rationale": "The role is valid, but the approved public portfolio evidence does not provide enough coverage for an accountable overall fit conclusion."  
  },  
  "evidenceConfidence": {  
    "level": "insufficient",  
    "rationale": "Several central role concepts have no approved public evidence."  
  },  
  "skillsMatch": {  
    "items": \[\],  
    "visualCoverage": {  
      "mode": "qualitative",  
      "label": "Not enough evidence to assess"  
    }  
  },  
  "requirementMapping": {  
    "items": \[  
      {  
        "itemId": "itm\_robotics\_hri",  
        "originalText": "Design human-robot interaction workflows",  
        "displayLabel": "Human-robot interaction",  
        "normalizedConcept": "human-robot-interaction",  
        "source": "requirement",  
        "importance": "must-have",  
        "matchType": "insufficient-evidence",  
        "impact": "gap",  
        "evidenceConfidence": "insufficient",  
        "shortRationale": "The approved evidence does not establish direct or transferable experience in human-robot interaction.",  
        "clusterIds": \[\]  
      }  
    \]  
  },  
  "evidencePanel": {  
    "clusters": \[\]  
  },  
  "topStrengths": {  
    "items": \[\]  
  },  
  "keyGaps": {  
    "items": \[  
      {  
        "itemId": "itm\_robotics\_hri",  
        "originalText": "Design human-robot interaction workflows",  
        "displayLabel": "Human-robot interaction",  
        "normalizedConcept": "human-robot-interaction",  
        "source": "requirement",  
        "importance": "must-have",  
        "matchType": "insufficient-evidence",  
        "impact": "gap",  
        "evidenceConfidence": "insufficient",  
        "shortRationale": "The approved evidence does not establish direct or transferable experience in human-robot interaction.",  
        "clusterIds": \[\]  
      }  
    \]  
  },  
  "disclaimer": {  
    "copyKey": "report.disclaimer.v1",  
    "text": "This qualitative report is based on the submitted role description and approved portfolio evidence. It is not an ATS decision, does not replace human judgment, and the visual fit indicator is not a literal numeric score."  
  },  
  "contactCta": {  
    "variant": "insufficient",  
    "label": "Continue the conversation",  
    "href": "/contact",  
    "enabled": true  
  }  
}  
\`\`\`

\---

\#\# 35\. Valid example payload — out of scope

\`\`\`json  
{  
  "schemaVersion": "1.0",  
  "reportId": "rpt\_01JZ7C42",  
  "createdAt": "2026-07-25T10:00:00Z",  
  "language": "en",  
  "state": "out-of-scope",  
  "roleSnapshot": {  
    "company": "Example Biotech",  
    "title": "Senior Molecular Biology Researcher"  
  },  
  "overallFitVisual": {  
    "mode": "out-of-scope",  
    "label": "Outside documented experience scope",  
    "rationale": "The role centers on laboratory molecular-biology research, which is outside the documented core of the approved professional evidence."  
  },  
  "evidenceConfidence": {  
    "level": "high",  
    "rationale": "The scope difference is clear from the role requirements and the approved professional evidence set."  
  },  
  "skillsMatch": {  
    "items": \[\],  
    "visualCoverage": {  
      "mode": "qualitative",  
      "label": "Role outside documented scope"  
    }  
  },  
  "requirementMapping": {  
    "items": \[\]  
  },  
  "evidencePanel": {  
    "clusters": \[\]  
  },  
  "topStrengths": {  
    "items": \[\]  
  },  
  "keyGaps": {  
    "items": \[\]  
  },  
  "disclaimer": {  
    "copyKey": "report.disclaimer.v1",  
    "text": "This qualitative report is based on the submitted role description and approved portfolio evidence. It is not an ATS decision, does not replace human judgment, and the visual fit indicator is not a literal numeric score."  
  },  
  "contactCta": {  
    "variant": "out-of-scope",  
    "label": "Explore relevant experience",  
    "href": "/work",  
    "enabled": true  
  }  
}  
\`\`\`

\---

\#\# 36\. Invalid payload examples

\#\#\# 36.1 Invalid visual band

\`\`\`json  
{  
  "mode": "fit",  
  "level": "good",  
  "fitVisualValue": 88  
}  
\`\`\`

Reason: \`88\` is outside the Good band \`55–79\`.

\#\#\# 36.2 Positive item without evidence

\`\`\`json  
{  
  "itemId": "itm\_1",  
  "matchType": "direct",  
  "evidenceIds": \[\]  
}  
\`\`\`

Reason: Direct matches require eligible evidence.

\#\#\# 36.3 Deprecated enum in final payload

\`\`\`json  
{  
  "matchType": "real\_gap"  
}  
\`\`\`

Reason: final V1 payload must emit \`real-gap\`.

\#\#\# 36.4 Duplicate evidence destination

\`\`\`json  
{  
  "clusters": \[  
    { "destination": { "dedupeKey": "project-a\#section-1" } },  
    { "destination": { "dedupeKey": "project-a\#section-1" } }  
  \]  
}  
\`\`\`

Reason: duplicate destinations must be merged.

\#\#\# 36.5 Internal source exposure

\`\`\`json  
{  
  "traceId": "trace\_private",  
  "sourceSnapshotId": "src\_private"  
}  
\`\`\`

Reason: internal identifiers are forbidden in the browser-facing report payload.

\---

\#\# 36A. Overall-fit derivation principles

The final fit is a holistic interpretation, not a literal count of matched phrases.

1\. Classify the role family and professional discipline first.  
2\. Identify central underlying capabilities for must-have and core items.  
3\. Evaluate capability fit separately from context fit.  
4\. Apply bridgeability and domain dependency.  
5\. Treat hard constraints separately from learnable context differences.  
6\. Consider seniority alignment and career direction without confusing them with qualification.  
7\. Keep evidence gaps visible without automatically converting them into real gaps.

A role may be \`good\` when most core capabilities are strongly supported and one or more stated must-haves are bridgeable context differences. The rationale and qualifiers must explain the transition clearly.

A role should be \`partial\` when a central underlying capability is only partly demonstrated, several high-dependency context requirements remain weak, or the transition requires substantial unproven execution depth.

Use \`out-of-scope\` when the role belongs to an unrelated professional discipline or depends on a non-bridgeable credential or capability that is outside the approved evidence set. Title similarity alone must not prevent out-of-scope classification.

\#\# 37\. Deterministic derivation rules

\#\#\# 37.1 Top Strengths

Eligible:

\`\`\`ts  
\["direct", "semantic", "transferable"\]  
\`\`\`

Required:

\- role relevance,  
\- sufficient evidence,  
\- no duplicate item,  
\- no duplicate claim,  
\- ranked by must-have/core importance and evidence confidence.

Maximum: 5\.

\#\#\# 37.2 Key Gaps

Eligible:

\`\`\`ts  
\["partial", "insufficient-evidence", "real-gap"\]  
\`\`\`

Rank by:

1\. must-have,  
2\. core,  
3\. material seniority implication,  
4\. likely effect on fit interpretation.

Maximum: 3\.

\#\#\# 37.3 Mapping selection

Maximum: 5 visible items.

Selection must include:

\- the highest-impact central requirements/responsibilities,  
\- material gaps where relevant,  
\- representative strengths,  
\- no filler.

\#\#\# 37.4 Default selection

Prefer the highest-ranked mapped item with at least one public Evidence Cluster.

If no mapped item has a public cluster, omit \`defaultSelectedItemId\` and show the neutral evidence-panel empty state.

\---

\#\# 38\. Report follow-up compatibility

Follow-up uses:

\`\`\`ts  
type ReportFollowUpContext \= {  
  reportId: string  
  sectionId?: ReportSectionKey  
  itemId?: string  
  clusterId?: string  
}  
\`\`\`

Rules:

\- \`itemId\` must exist in the selected report.  
\- \`clusterId\` must exist in the selected report.  
\- The follow-up service may access the persisted analysis and linked Evidence Cards.  
\- It must not silently use evidence from another report.  
\- It may explain but not mutate the report.  
\- Role corrections require a new role version and, if requested, a new report.

\---

\#\# 39\. Navigation compatibility

\`\`\`ts  
type EvidenceNavigationRequest \= {  
  conversationId: string  
  reportId: string  
  sectionId?: ReportSectionKey  
  itemId?: string  
  clusterId: string  
  returnContext: {  
    conversationState: "report-ready" | "report-follow-up"  
    scrollPosition?: number  
  }  
}  
\`\`\`

The selected cluster destination is the only approved navigation source.

The renderer must not construct links from project titles or model text.

\---

\#\# 40\. Logging boundaries

Log structured events and references, not raw reasoning.

Allowed examples:

\- report state transition,  
\- validation gate result,  
\- item count,  
\- cluster count,  
\- retry count,  
\- error category,  
\- duration,  
\- source snapshot reference.

Do not log by default:

\- raw prompts,  
\- chain-of-thought,  
\- full private CV content,  
\- unnecessary uploaded-job text,  
\- API keys,  
\- internal endpoints.

\---

\#\# 41\. Implementation checklist

\#\#\# Schema

\- \[ \] Implement canonical TypeScript types.  
\- \[ \] Implement JSON Schema for \`ReportUIPayload\`.  
\- \[ \] Set \`additionalProperties: false\`.  
\- \[ \] Add compatibility normalization for deprecated aliases.  
\- \[ \] Reject aliases after normalization boundary.

\#\#\# Validation

\- \[ \] Request/approval gate.  
\- \[ \] Role completeness gate.  
\- \[ \] Analysis-item evidence rules.  
\- \[ \] Fit visual-band rule.  
\- \[ \] Evidence eligibility rule.  
\- \[ \] Cluster deduplication.  
\- \[ \] Link fallback validation.  
\- \[ \] Privacy allowlist for UI payload.  
\- \[ \] State/outcome consistency.  
\- \[ \] Strength/gap derivation checks.

\#\#\# UI

\- \[ \] Never display \`fitVisualValue\` as text.  
\- \[ \] Omit absent optional role fields.  
\- \[ \] Distinguish partial, insufficient evidence, and real gap.  
\- \[ \] Render no three-state visual for limited/out-of-scope.  
\- \[ \] Use only approved CTA configuration.  
\- \[ \] Preserve report and evidence return context.

\#\#\# QA

\- \[ \] Test all three fit levels at band boundaries.  
\- \[ \] Test insufficient and out-of-scope payloads.  
\- \[ \] Test positive items without evidence.  
\- \[ \] Test duplicate clusters.  
\- \[ \] Test internal-only evidence leakage.  
\- \[ \] Test two reports and blocked third request.  
\- \[ \] Test optional fields collapsing.  
\- \[ \] Test empty strengths/gaps without filler.  
\- \[ \] Test active-report isolation in follow-up.

\---

\#\# 42\. Decisions preserved as configurable

The following are intentionally configurable but structurally supported:

1\. Exact weighting formula for overall fit.  
2\. Exact selected value inside each fit visual band.  
3\. Skills coverage mode.  
4\. Final localized labels.  
5\. Final CTA route.  
6\. Final limited-report UI treatment.  
7\. Final contact destination.  
8\. Final retention duration.  
9\. Exact session expiry behavior.  
10\. Visual design and motion.

These settings may change without altering the V1 report schema, provided the closed report structure and validation rules remain intact.

\---

\#\# 43\. Acceptance criteria

\`Report Data Model v1.0\` is implementation-ready when:

\- one canonical enum vocabulary is used,  
\- role facts remain separate from portfolio evidence,  
\- every analysis item traces to a role item,  
\- every visible positive or partial claim maps to eligible evidence,  
\- Evidence Clusters are deterministic and deduplicated,  
\- the three fit levels and hidden visual bands are validated,  
\- insufficient evidence and out-of-scope do not use the normal fit visual,  
\- strengths and gaps are derived from the same analysis items,  
\- internal fields are excluded from the UI payload,  
\- report states are consistent with analytical outcomes,  
\- invalid payloads cannot enter \`report-ready\`,  
\- and all nine approved report sections are represented without adding a new major section.

\---

\#\# 44\. Recommended next stage

After approval of this model, proceed to:

\# Case Study Knowledge File Template v1.0

That template should produce Evidence Cards compatible with this model, including:

\- stable evidence IDs,  
\- concept IDs,  
\- claim kind,  
\- context/action/result,  
\- source locator,  
\- public visibility,  
\- reliability,  
\- approval status,  
\- project route,  
\- and semantic anchor.

\---

\#\# Version 1.1 update record

Version 1.1 adds role-family classification, career-transition type, seniority and career-direction alignment, capability-versus-context analysis, bridgeability, domain dependency, hard-constraint types, and outcome-evidence separation. It narrows \`real-gap\` to missing underlying capability or non-bridgeable constraints and allows Good Fit with explicit qualifications when central capabilities are strong and context gaps are credibly transferable. It also formally supports Innovation Lead and junior-to-mid AI implementation pathways without inflating AI engineering depth.  
