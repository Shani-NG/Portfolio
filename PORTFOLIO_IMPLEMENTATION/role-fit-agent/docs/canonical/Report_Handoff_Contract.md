# Report Handoff Contract v0.2 — Reconciled

**Project:** Conversation-Based Portfolio Agent  
**Document type:** Structured handoff and orchestration contract  
**Status:** Reconciled and build-aligned  
**Owner and final approver:** Shani Nakash-Gomel  
**Scope:** From conversation context to validated report payload and report follow-up  
**Implementation status:** Specification only — no production code  
**Canonical data authority:** `Report_Data_Model_v1.0.md`

---

## 1. Purpose

This document defines the exact structured information passed between:

1. Conversation Layer
2. Role Understanding
3. Evidence Retrieval
4. Fit Analysis
5. Report Composition
6. Report UI
7. Report Follow-up
8. Logging and Evaluation

The goal is to guarantee that:

- each stage receives only the information it needs,
- no component passes free-form internal reasoning as its main handoff,
- every professional conclusion remains traceable,
- the two-report session limit is enforced consistently,
- conversation context is preserved,
- and the final report matches the approved UI-to-Analysis Contract.

---

## 2. Canonical data authority

For report field names, object shapes, enum values, validation gates, and final payload envelopes, `Report_Data_Model_v1.0.md` is authoritative.

This handoff contract remains authoritative for:

- stage responsibilities,
- minimum necessary context,
- orchestration order,
- approval and report-limit gates,
- follow-up and navigation handoffs,
- and logging boundaries.

Deprecated aliases may be accepted only at an explicit compatibility boundary and must be normalized before validation or persistence.

---

## 3. Governing principles

### 3.1 Typed handoffs

Each component passes a validated object, not an unstructured narrative.

### 3.2 Minimum necessary context

Each stage receives only the fields required for its responsibility.

### 3.3 Source traceability

Every role field, evidence item, and report conclusion must retain its source reference.

### 3.4 No hidden report generation

A report handoff may start only after:

- a valid role exists,
- the two-report limit has been checked,
- and explicit user approval has been recorded.

### 3.5 Report and conversation remain linked

Each report is tied to:

- `conversationId`,
- `conversationSnapshotId`,
- `roleSnapshotId`,
- `sourceSnapshotId`,
- and `reportId`.

### 3.6 No analytical leakage before confirmation

Internal preparation may validate role structure, but fit conclusions must not be exposed before user confirmation.

---

# 4. End-to-end handoff flow

```text
Conversation Input
  ↓
Conversation Context
  ↓
Role Intake Request
  ↓
Role Understanding Result
  ↓
Role Validation Decision
  ↓
Report Confirmation Request
  ↓
Explicit User Approval
  ↓
Report Generation Request
  ↓
Evidence Retrieval Result
  ↓
Fit Analysis Result
  ↓
Report Composition Input
  ↓
Validated Report UI Payload
  ↓
Report Ready
  ↓
Report Follow-up Context
```

---

# 5. Shared identifiers

```ts
type SharedIdentifiers = {
  conversationId: string
  conversationSnapshotId: string
  roleSnapshotId?: string
  sourceSnapshotId?: string
  reportId?: string
  traceId: string
}
```

### Rules

- `conversationId` identifies the session.
- `conversationSnapshotId` freezes the relevant conversation context.
- `roleSnapshotId` is created only after the role is validated.
- `sourceSnapshotId` identifies the evidence set used.
- `reportId` is created only after explicit confirmation and before generation.
- `traceId` follows every stage for debugging and evaluation.

---

# 6. Conversation Layer → Role Understanding

## 6.1 Role Intake Request

```ts
type RoleIntakeRequest = {
  identifiers: {
    conversationId: string
    traceId: string
  }

  language: "he" | "en" | "mixed"

  input: {
    kind: "user-text" | "uploaded-file"
    rawText?: string
    fileRef?: string
    fileName?: string
    mimeType?: string
  }

  existingRoleDraft?: {
    company?: string
    title?: string
    description?: string
    responsibilities?: string[]
    requirements?: string[]
    seniority?: string
    yearsOfExperience?: number
    location?: string
    workModel?: string
  }

  confirmedFields: string[]
  missingFields: string[]
  correctionIntent?: {
    field?: string
    newValue?: string
  }

  safetyContext: {
    treatUploadedContentAsUntrusted: true
    ignoreEmbeddedInstructions: true
  }
}
```

## 6.2 Role Understanding responsibility

This stage may:

- read the submitted content,
- identify whether it is a job description,
- extract role fields,
- normalize concepts,
- identify missing information,
- detect contradictions,
- and preserve original wording.

It may not:

- calculate fit,
- retrieve candidate evidence,
- recommend case studies,
- or produce report content.

---

# 7. Role Understanding → Conversation Layer

## 7.1 Role Understanding Result

```ts
type RoleUnderstandingResult = {
  identifiers: {
    conversationId: string
    traceId: string
  }

  parseStatus:
    | "valid-complete"
    | "valid-incomplete"
    | "not-a-job-description"
    | "unreadable"
    | "contradictory"

  roleDraft: {
    company?: RoleField<string>
    title?: RoleField<string>
    description?: RoleField<string>
    responsibilities: RoleField<string>[]
    requirements: RoleField<string>[]
    seniority?: RoleField<string>
    yearsOfExperience?: RoleField<number>
    location?: RoleField<string>
    workModel?: RoleField<string>
  }

  missingFields: Array<
    | "company"
    | "title"
    | "responsibilities"
    | "requirements"
  >

  detectedLanguage: "he" | "en" | "mixed"

  normalizedConcepts: NormalizedConceptCandidate[]

  contradictionRecords: ContradictionRecord[]

  recommendedNextAction:
    | "ask-for-missing-field"
    | "request-new-input"
    | "request-source-choice"
    | "role-ready"

  nextQuestionKey?: string
}
```

## 7.2 Role Field

```ts
type RoleField<T> = {
  originalValue: T
  normalizedValue?: T
  source: {
    kind: "user-text" | "uploaded-file" | "clarification"
    locator?: string
  }
  confidence: "high" | "medium" | "low"
  confirmed: boolean
}
```

## 7.3 Normalized concept candidate

```ts
type NormalizedConceptCandidate = {
  conceptId: string
  originalText: string
  confidence: "high" | "medium" | "low"
  ambiguous: boolean
  alternatives?: string[]
}
```

## 7.4 Contradiction record

```ts
type ContradictionRecord = {
  field: string
  values: Array<{
    value: string
    source: string
  }>
  blocking: boolean
}
```

---

# 8. Conversation Layer → Report Confirmation

## 8.1 Report Confirmation Candidate

```ts
type ReportConfirmationCandidate = {
  conversationId: string
  roleSnapshotCandidate: {
    company: string
    title: string
    description: string
    responsibilities: string[]
    requirements: string[]
    seniority?: string
    yearsOfExperience?: number
    location?: string
    workModel?: string
    language: "he" | "en" | "mixed"
  }

  sourceSummary: {
    inputKind: "user-text" | "uploaded-file"
    inputLabel: string
  }

  reportGenerationCount: number
  maxReportsPerSession: 2

  reportTrigger:
    | "dedicated-button"
    | "natural-language-request"

  roleComplete: true
  unresolvedBlockingIssues: []
}
```

## 8.2 Confirmation decision

```ts
type ReportConfirmationDecision = {
  approved: boolean
  approvedAt?: string
  cancelledAt?: string
  correctionRequested?: {
    field?: string
    newValue?: string
  }
}
```

### Rules

A report generation request may continue only if:

```ts
approved === true
&& reportGenerationCount < 2
&& roleComplete === true
&& unresolvedBlockingIssues.length === 0
```

---

# 9. Conversation Layer → Report Orchestrator

## 9.1 Report Generation Request

```ts
type ReportGenerationRequest = {
  identifiers: {
    conversationId: string
    conversationSnapshotId: string
    roleSnapshotId: string
    reportId: string
    traceId: string
  }

  approval: {
    approved: true
    approvedAt: string
    reportTrigger:
      | "dedicated-button"
      | "natural-language-request"
  }

  session: {
    reportGenerationCountBeforeRun: 0 | 1
    maxReportsPerSession: 2
  }

  role: {
    company: string
    title: string
    description: string
    responsibilities: string[]
    requirements: string[]
    seniority?: string
    yearsOfExperience?: number
    location?: string
    workModel?: string
    language: "he" | "en" | "mixed"
  }

  normalizedConcepts: Array<{
    conceptId: string
    sourceText: string
    confidence: "high" | "medium" | "low"
  }>

  reportPreferences: {
    language: "he" | "en"
  }
}
```

### Hard validation before orchestration

Reject the request if:

- approval is missing,
- report count is already two,
- role fields are incomplete,
- role snapshot is missing,
- or conversation identifiers are invalid.

---

# 10. Orchestrator → Evidence Retrieval

## 10.1 Evidence Retrieval Request

```ts
type EvidenceRetrievalRequest = {
  identifiers: {
    reportId: string
    sourceSnapshotId: string
    traceId: string
  }

  roleConcepts: Array<{
    conceptId: string
    importance:
      | "must-have"
      | "core"
      | "supporting"
    source:
      | "requirement"
      | "responsibility"
      | "title"
      | "professional-context"
  }>

  filters: {
    visibility: ["public"]
    approvalStatus: ["approved"]
    allowedReliability: ["high", "medium"]
  }

  limits: {
    maxEvidenceCardsTotal: number
    maxEvidenceCardsPerConcept: number
  }
}
```

## 10.2 Retrieval rule

V1 retrieval is deterministic:

```text
conceptId match
+ visibility = public
+ approvalStatus = approved
```

No evidence may be returned only because the model finds it semantically plausible.

---

# 11. Evidence Retrieval → Fit Analysis

## 11.1 Evidence Retrieval Result

```ts
type EvidenceRetrievalResult = {
  identifiers: {
    reportId: string
    sourceSnapshotId: string
    traceId: string
  }

  evidenceCards: EvidenceCard[]

  uncoveredConcepts: Array<{
    conceptId: string
    sourceText: string
    reason:
      | "no-approved-evidence"
      | "no-public-evidence"
      | "low-reliability-only"
  }>

  retrievalSummary: {
    requestedConceptCount: number
    coveredConceptCount: number
    evidenceCardCount: number
  }
}
```

## 11.2 Evidence Card

```ts
type EvidenceCard = {
  evidenceId: string
  conceptIds: string[]
  claim: string
  claimKind:
    | "documented-fact"
    | "interpretive-conclusion"
    | "unverified-assumption"
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
  reliability: "high" | "medium" | "low"
  updatedAt: string
  approvalStatus: "approved" | "needs-review" | "blocked"
}
```

---

# 12. Fit Analysis Input

```ts
type FitAnalysisInput = {
  identifiers: {
    conversationId: string
    reportId: string
    roleSnapshotId: string
    sourceSnapshotId: string
    traceId: string
  }

  role: {
    company: string
    title: string
    responsibilities: string[]
    requirements: string[]
    seniority?: string
    yearsOfExperience?: number
    location?: string
    workModel?: string
  }

  normalizedConcepts: Array<{
    conceptId: string
    originalText: string
    source:
      | "skills"
      | "requirements"
      | "responsibilities"
      | "professional-context"
    importance:
      | "must-have"
      | "core"
      | "supporting"
  }>

  evidenceCards: EvidenceCard[]
  uncoveredConcepts: string[]

  constraints: {
    noUnsupportedClaims: true
    distinguishRealGapFromInsufficientEvidence: true
    noNumericScoreInVisibleOutput: true
    maxVisibleStrengths: 5
    maxVisibleGaps: 3
    maxVisibleMappedItems: 5
  }
}
```

---

# 13. Fit Analysis Result

```ts
type FitAnalysisResult = {
  identifiers: {
    reportId: string
    roleSnapshotId: string
    sourceSnapshotId: string
    traceId: string
  }

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
    level: "high" | "medium" | "low" | "insufficient"
    rationale: string
  }

  sections: {
    skills: AnalysisItem[]
    requirements: AnalysisItem[]
    responsibilities: AnalysisItem[]
    professionalContext: AnalysisItem[]
  }

  topStrengthItemIds: string[]
  keyGapItemIds: string[]

  internalDiagnostics: {
    coveredCoreRequirementCount: number
    totalCoreRequirementCount: number
    realGapCount: number
    insufficientEvidenceCount: number
    highConfidenceEvidenceCount: number
  }
}
```

## 13.1 Fit analysis item

```ts
type AnalysisItem = {
  itemId: string
  originalText: string
  normalizedConceptId?: string

  source:
    | "skill"
    | "requirement"
    | "responsibility"
    | "professional-context"

  importance:
    | "must-have"
    | "core"
    | "supporting"

  matchType:
    | "direct"
    | "semantic"
    | "transferable"
    | "partial"
    | "insufficient-evidence"
    | "real-gap"

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
  evidenceIds: string[]
}
```

---

# 14. Hidden visual value rules

`fitVisualValue` is internal-only.

It must:

- be inside the permitted band for its level,
- never appear as a visible number,
- never appear as a percentage,
- never be called a score,
- and only control the circular fill.

```ts
const fitVisualBands = {
  partial: { min: 30, max: 54 },
  good: { min: 55, max: 79 },
  strong: { min: 80, max: 100 },
}
```

If the value is outside the band, the report payload is invalid.

The analysis may derive this value from weighted internal rules, but the visible report must preserve qualitative ambiguity.

---

# 15. Fit Analysis → Report Composition

## 15.1 Report Composition Input

```ts
type ReportCompositionInput = {
  identifiers: {
    conversationId: string
    conversationSnapshotId: string
    roleSnapshotId: string
    sourceSnapshotId: string
    reportId: string
    traceId: string
  }

  roleSnapshot: {
    company: string
    title: string
    seniority?: string
    yearsOfExperience?: number
    location?: string
    workModel?: string
  }

  fitAnalysis: FitAnalysisResult

  evidenceCards: EvidenceCard[]

  presentationRules: {
    approvedMajorSections: [
      "role-snapshot",
      "overall-fit",
      "skills-match",
      "requirements-responsibilities",
      "evidence-panel",
      "top-strengths",
      "key-gaps",
      "disclaimer",
      "contact-cta"
    ]

    noNewMajorSections: true
    noVisibleNumericFitScore: true
    deduplicateEvidenceLinks: true
    useSameTabForEvidence: true
  }
}
```

---

# 16. Report Composition responsibility

The Report Composer must:

- validate all required fields,
- derive `impact` from `matchType`,
- build Evidence Clusters,
- deduplicate links,
- rank visible strengths and gaps,
- select visible mapped items,
- map fit level to illustration key and color token,
- validate hidden ring fill,
- prepare approved disclaimer copy,
- and produce the final `ReportUIPayload`.

It must not:

- add new claims,
- rewrite gaps into strengths,
- invent metrics,
- invent evidence,
- invent links,
- add new report sections,
- or expose internal diagnostics.

---

# 17. Evidence Cluster construction

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

### Dedupe key

```text
projectSlug + anchorId
```

Fallback:

```text
projectSlug + "__top"
```

The same `dedupeKey` must not render twice in one report. Browser-facing clusters contain no `visibility`, raw source references, or internal-only evidence. Eligibility is enforced before composition.

---

# 18. Report Composer → Report UI

The output must conform exactly to the approved:

```text
Report UI-to-Analysis Contract v0.1
```

## 18.1 Final payload

```ts
type ValidatedReportPayload =
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
        | "request-gate"
        | "role-gate"
        | "analysis-gate"
        | "evidence-gate"
        | "visual-band"
        | "composition"
        | "link"
        | "privacy"
        | "ui-schema"
      safeMessageKey: string
    }
```

An invalid payload must not enter `report-ready`.


# 19. Report-ready → Conversation Layer

## 19.1 Report Ready Event

```ts
type ReportReadyEvent = {
  conversationId: string
  reportId: string
  createdAt: string

  reportGenerationCountAfterRun: 1 | 2

  activeReportId: string

  availableActions: {
    askFollowUp: true
    viewEvidence: true
    contact: true
    createAnotherReport: boolean
  }
}
```

### Rule

```ts
createAnotherReport =
  reportGenerationCountAfterRun < 2
```

After the second report:

- the dedicated button is disabled,
- natural-language report requests are blocked,
- and no model call is initiated.

---

# 20. Report Follow-up Handoff

## 20.1 Follow-up Request

```ts
type ReportFollowUpRequest = {
  identifiers: {
    conversationId: string
    reportId: string
    traceId: string
  }

  question: string
  language: "he" | "en" | "mixed"

  referenceContext: {
    sectionId?: string
    itemId?: string
    clusterId?: string
  }

  allowedSources: {
    reportPayload: true
    reportEvidenceCards: true
    approvedPublicEvidenceOnly: true
  }
}
```

## 20.2 Follow-up Result

```ts
type ReportFollowUpResult = {
  reportId: string
  answer: string

  answerType:
    | "documented-fact"
    | "interpretive-explanation"
    | "insufficient-evidence"

  referencedItemIds: string[]
  referencedClusterIds: string[]
  referencedEvidenceIds: string[]

  suggestedAction?:
    | "view-evidence"
    | "ask-clarification"
    | "contact"
    | "none"
}
```

### Rules

- Follow-up remains tied to the selected report.
- It must not silently use evidence from another report.
- It may explain the analysis but may not revise the report without a new report flow.
- A correction to the role starts a new role version and, if requested, a new report.

---

# 21. Evidence Navigation Handoff

```ts
type EvidenceNavigationRequest = {
  conversationId: string
  reportId: string
  sectionId?: string
  itemId?: string
  clusterId: string

  returnContext: {
    conversationState: "report-ready" | "report-follow-up"
    scrollPosition?: number
  }
}
```

Resolved result:

```ts
type EvidenceNavigationResult = {
  destination:
    | {
        mode: "anchor"
        href: string
        anchorId: string
      }
    | {
        mode: "project-top"
        href: string
      }
    | {
        mode: "no-link"
      }

  returnContextSaved: true
}
```

---

# 22. Logging handoff

Each stage writes a structured event.

```ts
type TraceEvent = {
  traceId: string
  conversationId: string
  reportId?: string
  stage:
    | "conversation"
    | "role-understanding"
    | "role-validation"
    | "confirmation"
    | "retrieval"
    | "fit-analysis"
    | "composition"
    | "render"
    | "follow-up"
    | "navigation"

  status:
    | "started"
    | "passed"
    | "weak"
    | "failed"

  durationMs?: number
  errorCategory?: string
  inputReference?: string
  outputReference?: string
  createdAt: string
}
```

Logs must not expose:
- raw prompts,
- private CV content,
- internal-only evidence,
- API keys,
- or personal data beyond approved operational need.

---

# 23. Failure and recovery handoff

```ts
type RecoverableFailure = {
  identifiers: {
    conversationId: string
    reportId?: string
    traceId: string
  }

  stage:
    | "role-input"
    | "role-understanding"
    | "retrieval"
    | "fit-analysis"
    | "composition"
    | "render"
    | "navigation"

  category:
    | "unreadable-file"
    | "not-a-job-description"
    | "missing-role-data"
    | "contradictory-role-data"
    | "insufficient-evidence"
    | "model-network"
    | "invalid-payload"
    | "broken-link"
    | "storage"

  nearestSafeState: ConversationState
  retryAllowed: boolean
  safeMessageKey: string
}
```

The conversation layer uses `safeMessageKey` to display approved human-readable copy.

---

# 24. Report-limit handoff

Before any new report request:

```ts
type ReportLimitCheck = {
  conversationId: string
  reportGenerationCount: number
  maxReportsPerSession: 2
  requestSource:
    | "dedicated-button"
    | "natural-language-request"
}
```

Result:

```ts
type ReportLimitDecision =
  | {
      allowed: true
      remainingReports: 1 | 2
    }
  | {
      allowed: false
      remainingReports: 0
      nextState: "report-limit-reached"
      messageKey: "report-limit-reached"
    }
```

This check runs before:
- report ID creation,
- model invocation,
- loading state,
- or new role-analysis work intended only for a third report.

---

# 25. Privacy boundaries by handoff

| Stage | May access | Must not expose |
|---|---|---|
| Conversation | approved answers, user input, current context | prompts, raw logs, private sources |
| Role Understanding | submitted role content | candidate private evidence |
| Retrieval | approved Evidence Index | raw CV or blocked sources |
| Fit Analysis | validated role + approved evidence | full source repository |
| Report Composer | structured analysis + approved evidence refs | unsupported claims |
| Report UI | validated public payload | internal IDs and traces |
| Follow-up | active report + linked evidence | unrelated report evidence |
| Evaluator | traces and snapshots | user-facing raw internals |

---

# 26. Acceptance criteria

This handoff contract is implementation-ready when:

- every stage has a typed input and output,
- report generation cannot start without explicit approval,
- report-limit checking occurs before any expensive action,
- role validation is separate from fit analysis,
- retrieval returns only approved public evidence,
- every fit item retains evidence IDs,
- the hidden fit value is validated against its visual band,
- the Report Composer cannot add new claims,
- the final payload matches the approved UI contract,
- follow-up remains tied to the selected report,
- evidence navigation preserves return context,
- and every failure identifies the nearest safe recovery state.

---

# 27. Next step

The next recommended work item is:

```text
Conversation Copy v0.1
```

It should define the final Hebrew and English wording for:

- opening,
- role input,
- missing fields,
- content mismatch,
- report confirmation,
- report generation,
- report ready,
- report follow-up,
- insufficient evidence,
- out-of-scope,
- report limit,
- technical recovery,
- evidence navigation,
- contact CTA,
- and conversation closure.


---

## Reconciliation record

Version 0.2 aligns every report handoff with `Report_Data_Model_v1.0.md`. It normalizes enum and input-kind spelling, adopts `AnalysisItem`, uses `mode` for overall-fit unions, adopts the canonical browser-facing Evidence Cluster, and updates the validated payload envelope. Stage ownership and orchestration logic remain unchanged.
