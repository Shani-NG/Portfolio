# Knowledge File Generation Guidelines v1.0

**Purpose:** One shared instruction file for generating consistent knowledge-source files.  
**Output model:** One independent file per Case Study, one CV knowledge file, and one complementary general-information file.  
**Index relationship:** Every approved knowledge file is registered later in a central index.  
**Source relationship:** Original sources remain separate and are referenced through the relevant file’s Source Inventory.  
**No master content file:** No file consolidates the full content of all projects and profile sources.

---

**Project:** Conversation-Based Portfolio Agent  
**Document type:** Canonical Case Study Knowledge File template and validation specification  
**Status:** Build-ready template for approval  
**Owner and final approver:** Shani Nakash-Gomel  
**Scope:** Internal knowledge layer for 3–5 primary portfolio case studies  
**Canonical downstream authority:** `Report_Data_Model_v1.0.md`  
**Supporting sources:**  
- `Conversation_Blueprint_Package_v0.3_Reconciled.md`
- `Report_UI_to_Analysis_Contract_v0.2_Reconciled.md`
- `Report_Handoff_Contract_v0.2_Reconciled.md`

---

## 1. Purpose

This template defines the canonical structure for each Case Study Knowledge File used by the portfolio agent.

A completed file is an internal, structured, retrieval-ready source of truth. It is not:

- new marketing copy,
- a replacement for the public case-study page,
- a free-form project summary,
- a speculative professional profile,
- or a new report structure.

Its purpose is to enable the system to:

1. answer evidence-based questions about a project;
2. identify the professional capabilities the project demonstrates;
3. map job requirements and responsibilities to approved evidence;
4. produce eligible `EvidenceCard` objects;
5. group eligible cards into deterministic `EvidenceCluster` objects;
6. preserve traceability to the exact source and public portfolio location;
7. distinguish documented facts from interpretive conclusions;
8. represent missing or insufficient evidence honestly;
9. respect confidentiality and visibility constraints;
10. prevent invented claims, metrics, outcomes, ownership, and links.

This file serves the existing `Report_Data_Model_v1.0.md` directly. It must not introduce additional report sections or parallel report enums.

---

## 2. Authority and conflict rule

When information about a case study conflicts, use this order:

1. an explicit decision approved by Shani;
2. the newest approved Case Study Knowledge File;
3. the newest approved source document for that project;
4. the current public case-study page;
5. the approved CV;
6. approved professional-profile or About content;
7. earlier drafts and archived materials, for context only.

Conflicts must never be silently merged.

Every unresolved conflict must be recorded with:

- the conflicting sources;
- the differing values or claims;
- the likely newer source;
- the current safe behavior;
- the decision required from Shani.

Until resolved, the disputed claim must be:

- excluded from public evidence, or
- marked `needs-review` or `blocked`.

---

## 3. Canonical terminology

### 3.1 Claim kinds

Use only:

```ts
type ClaimKind =
  | "documented-fact"
  | "interpretive-conclusion"
  | "unverified-assumption"
```

Rules:

- `documented-fact` requires explicit source support.
- `interpretive-conclusion` requires one or more documented facts and must be worded as an interpretation.
- `unverified-assumption` may be recorded internally for review but may not support a visible positive report claim.

### 3.2 Match types

Case-study files do not assign final role fit in advance. They provide evidence that may later support these canonical report classifications:

```ts
type MatchType =
  | "direct"
  | "semantic"
  | "transferable"
  | "partial"
  | "insufficient-evidence"
  | "real-gap"
```

Important:

- `semantic` is a valid canonical match type.
- `real-gap` is the canonical equivalent of a responsibly established clear mismatch.
- `confidential / high-level only` is not a match type. It is represented through visibility, confidentiality, wording, and source restrictions.
- A Case Study Knowledge File may propose likely evidence uses, but the final match type is assigned only against a specific job requirement.

### 3.3 Evidence confidence and reliability

```ts
type ConfidenceLevel =
  | "high"
  | "medium"
  | "low"
  | "insufficient"

type ReliabilityLevel =
  | "high"
  | "medium"
  | "low"
```

`reliability` describes the source quality of an Evidence Card.

`evidenceConfidence` is assigned during role-specific analysis and may depend on the combined evidence set.

### 3.4 Visibility and approval

```ts
type Visibility =
  | "public"
  | "internal"

type ApprovalStatus =
  | "approved"
  | "needs-review"
  | "blocked"
```

Visible report evidence is eligible only when:

```ts
visibility === "public"
&& approvalStatus === "approved"
&& (reliability === "high" || reliability === "medium")
&& claimKind !== "unverified-assumption"
```

---

## 4. File naming and identity

Use one file per case study:

```text
Case_Study_Knowledge_<caseStudyId>_v<major.minor>.md
```

Example:

```text
Case_Study_Knowledge_maritime-c2-monitoring_v1.0.md
```

### Identity rules

- `caseStudyId` is stable and never reused.
- `project.slug` must match the approved portfolio route.
- Evidence IDs remain stable across minor revisions when the meaning of the evidence has not changed.
- A materially changed claim receives a new Evidence ID or a new major version.
- Removed evidence is deprecated or blocked; it is not silently reassigned.

---

# 5. Canonical file structure

Every completed Case Study Knowledge File must contain the sections below.

---

## A. Document Control

```yaml
document:
  templateVersion: "1.0"
  knowledgeFileVersion: "1.0"
  status: "draft | needs-review | approved | superseded"
  owner: "Shani Nakash-Gomel"
  createdAt: "YYYY-MM-DD"
  updatedAt: "YYYY-MM-DD"
  approvedAt: null
  supersedes: null
  changeSummary: ""
```

### Required review labels

```yaml
reviewState:
  decided: []
  assumed: []
  open: []
  missingEvidence: []
  recommended: []
```

Rules:

- `assumed` content is never eligible for approved evidence.
- `open` items identify decisions or conflicts that block completion.
- `missingEvidence` records expected questions or capabilities lacking support.
- `recommended` content is non-authoritative until approved.

---

## B. Project Metadata

```yaml
project:
  caseStudyId: ""
  projectName: ""
  publicTitle: ""
  shortDescription: ""
  portfolioUrl: ""
  slug: ""
  domain: []
  productOrSystemType: []
  organizationOrClient:
    publicName: null
    internalName: null
    visibility: "public | internal"
    safePublicLabel: ""
  projectPeriod:
    start: null
    end: null
    precision: "exact | year-only | approximate | unknown"
    approved: false
  projectStatus: "completed | ongoing | historical | unknown"
  confidentiality:
    level: "public | restricted | confidential-high-level-only"
    publicDescriptionRule: ""
    prohibitedDetails: []
  language:
    sourceLanguages: []
    preferredAgentLanguage: "en"
  lastApprovedDate: null
```

### Metadata rules

- Dates are included only when approved.
- Internal organization names must not leak into public fields.
- `safePublicLabel` is used when the real organization cannot be named.
- `portfolioUrl` and `slug` must be validated against the live or approved site structure.
- Unknown values remain `null` or `unknown`; they are never inferred.

---

## C. Source Inventory

Create one record per source.

```yaml
sourceInventory:
  - sourceId: "src_<caseStudyId>_<nn>"
    name: ""
    sourceType:
      "public-case-study | content-document | cv | about-profile | image |
       diagram | process-documentation | approved-decision | old-draft |
       interview-note | other"
    location: ""
    versionOrDate: null
    approvalStatus: "approved | needs-review | archived | blocked"
    reliability: "high | medium | low"
    recency: "current | older-but-valid | outdated | unknown"
    contentRole:
      "content | visual-reference | process | implementation | decision | context"
    containsUniqueInformation: false
    duplicatesSourceIds: []
    conflictsWithSourceIds: []
    recommendedUse: ""
    restrictions: []
    notes: ""
```

### Source inventory requirements

For every source, record:

- what it contains;
- its reliability;
- whether it is current;
- whether it is authoritative for content, design, process, or decisions;
- what unique information it adds;
- whether it duplicates or conflicts with another source;
- how it should be used.

Old drafts may inform review but may not silently override newer approved material.

---

## D. Source Conflict Register

```yaml
sourceConflicts:
  - conflictId: "conf_<caseStudyId>_<nn>"
    topic: ""
    sourceValues:
      - sourceId: ""
        value: ""
    likelyCurrentSourceId: null
    currentSafeBehavior:
      "exclude-claim | use-shared-fact-only | internal-only | blocked"
    decisionRequired: ""
    status: "open | resolved"
    resolution: null
    approvedBy: null
    approvedAt: null
```

No unresolved disputed claim may appear in an approved public Evidence Card.

---

## E. Project Summary

### E1. Canonical summary

```yaml
projectSummary:
  oneSentence: ""
  conciseSummary: ""
  whyItMattered: ""
  safePublicSummary: ""
```

### E2. Summary constraints

The summary must:

- describe the project without marketing inflation;
- avoid unsupported impact language;
- preserve confidentiality;
- distinguish the system/problem from Shani’s personal contribution;
- use only verified facts and approved interpretations.

---

## F. Project Context

```yaml
projectContext:
  background: ""
  problem: ""
  businessOrOperationalNeed: ""
  users:
    - userGroup: ""
      needs: []
      environment: ""
      visibility: "public | internal"
  stakeholders:
    - stakeholderType: ""
      relationshipToProject: ""
      visibility: "public | internal"
  operatingEnvironment: []
  constraints:
    - constraint: ""
      sourceIds: []
  risks:
    - risk: ""
      sourceIds: []
  complexity:
    systemComplexity: []
    workflowComplexity: []
    organizationalComplexity: []
    domainComplexity: []
  whyProjectMattered:
    documentedFact: ""
    expectedBenefit: ""
```

Rules:

- Do not infer users or stakeholders merely because they are typical for the domain.
- Separate documented project importance from expected benefit.
- Sensitive environments are described only at the approved abstraction level.

---

## G. Role and Ownership

```yaml
roleAndOwnership:
  approvedRoleTitle: ""
  officialRoleTitle: null
  roleDescription: ""
  scopeOfOwnership:
    owned: []
    coOwned: []
    contributedTo: []
    advisedOn: []
  responsibilities: []
  decisionsLed: []
  collaboration:
    - collaboratorType: ""
      collaborationDescription: ""
      sourceIds: []
  leadership:
    teamLeadership: []
    mentoring: []
    facilitation: []
  explicitlyNotPerformed: []
  unclearOrUnverified: []
```

### Ownership wording rules

Use precise verbs:

- `led`
- `owned`
- `co-led`
- `defined`
- `designed`
- `facilitated`
- `researched`
- `validated`
- `contributed to`
- `supported`
- `advised`

Do not upgrade:

- contribution into ownership;
- participation into leadership;
- recommendation into implementation;
- team outcome into individual outcome.

Every responsibility or ownership claim used in evidence must have a source locator.

---

## H. Decisions and Actions

```yaml
decisionsAndActions:
  - decisionActionId: "da_<caseStudyId>_<nn>"
    type: "decision | action | recommendation | trade-off"
    title: ""
    description: ""
    rationale: ""
    roleOfShani:
      level: "owned | co-owned | contributed | advised"
      wording: ""
    alternativesConsidered: []
    tradeOffs: []
    sourceIds: []
    sourceLocators: []
    visibility: "public | internal"
    approvalStatus: "approved | needs-review | blocked"
```

---

## I. Methods and Workflows

```yaml
methodsAndWorkflows:
  research: []
  discovery: []
  uxStrategy: []
  informationArchitecture: []
  interactionDesign: []
  prototyping: []
  validation: []
  iteration: []
  delivery: []
  monitoringAndLearning: []
  aiOrAutomationActivities: []
  tools:
    - name: ""
      use: ""
      evidenceStatus: "documented | inferred | unknown"
      sourceIds: []
```

Rules:

- A method is included only when explicitly documented.
- A tool is not proof of a capability by itself.
- AI-related activity is included only when supported by approved evidence.
- Do not complete a “standard UX process” from convention.

---

## J. Solution and System Logic

```yaml
solution:
  mainSolution: ""
  coreFlows:
    - flowId: ""
      name: ""
      summary: ""
      userGroups: []
      sourceIds: []
      publicSectionIds: []
  keyFeatures:
    - featureId: ""
      name: ""
      description: ""
      roleOfShani: ""
      sourceIds: []
  importantDesignDecisions: []
  systemLogic: []
  complexityHandled: []
  alternativesConsidered: []
  tradeOffs: []
  futureRecommendations: []
```

Future recommendations must never be represented as delivered outcomes.

---

## K. Outcomes, Metrics, and Learnings

```yaml
outcomes:
  verifiedOutcomes:
    - outcomeId: "out_<caseStudyId>_<nn>"
      statement: ""
      outcomeType: "qualitative | quantitative"
      metric:
        name: null
        value: null
        unit: null
        baseline: null
        timeframe: null
      sourceIds: []
      sourceLocators: []
      attribution:
        level: "project | team | Shani-contribution"
        wording: ""
      visibility: "public | internal"
      approvalStatus: "approved | needs-review | blocked"

  expectedBenefits:
    - statement: ""
      sourceIds: []

  designGoals:
    - statement: ""
      sourceIds: []

  targetOutcomesNotVerified:
    - statement: ""
      sourceIds: []

  learnings:
    - statement: ""
      claimKind: "documented-fact | interpretive-conclusion"
      sourceIds: []

  remainingLimitations: []
```

### Mandatory distinctions

Never merge these:

| Category | Meaning |
|---|---|
| `verifiedOutcome` | Supported result that occurred |
| `expectedBenefit` | Anticipated value, not verified |
| `designGoal` | Intended design objective |
| `targetOutcomeNotVerified` | Desired result without confirmed measurement |
| `futureRecommendation` | Proposed future action |

Quantitative claims require:

- value;
- unit;
- source;
- locator;
- timeframe when relevant;
- clear attribution.

A metric shown only in a visual mockup is not automatically a verified project outcome.

---

## L. Capability and Normalized Concept Index

This index supports deterministic retrieval.

```yaml
capabilityIndex:
  - capabilityId: "cap_<canonical-name>"
    canonicalLabel: ""
    category:
      "ux-strategy | complex-systems | product-thinking | system-thinking |
       research | validation | interaction-design | information-architecture |
       facilitation | leadership | mentoring | cross-functional-collaboration |
       ai-workflows | automation | monitoring | enterprise | defense |
       medical | saas | other"
    definition: ""
    demonstratedBy:
      evidenceIds: []
      decisionActionIds: []
      outcomeIds: []
      sectionIds: []
    strengthOfSupport: "strong | moderate | limited"
    allowedEvidenceUse:
      directCandidate: false
      semanticCandidate: false
      transferableCandidate: false
      partialCandidate: false
    limitations: []
    jdKeywords: []
    synonyms: []
    relatedJobTitles: []
    safeAgentWording: []
    forbiddenAgentWording: []
```

### Capability rules

- The index describes what the project may support; it does not predetermine fit.
- `directCandidate` means direct classification may be possible when the job requirement is genuinely comparable.
- `transferableCandidate` must never be automatically upgraded to direct.
- Normalized concepts must map to approved evidence IDs.
- Keywords and synonyms improve retrieval only; they are not evidence.

---

## M. Public Section Map

Create one record for every meaningful public section.

```yaml
publicSectionMap:
  - sectionId: "sec_<caseStudyId>_<nn>"
    publicTitle: ""
    eyebrow: null
    currentAnchorId: null
    recommendedAnchorId: ""
    portfolioUrl: ""
    destinationMode: "anchor | project-top | no-link"
    sectionSummary: ""
    sectionContentType:
      "context | problem | process | decision | workflow | solution |
       outcome | learning | visual-evidence | other"
    claimsSupported: []
    claimsNotSupported: []
    capabilitiesDemonstrated: []
    relevantJobRequirementPatterns: []
    evidenceIds: []
    primaryKeywords: []
    directReportNavigationAllowed: false
    safeNavigationText:
      en: ""
      he: ""
    visibility: "public | internal"
    approvalStatus: "approved | needs-review | blocked"
```

### Anchor rules

- Never invent an existing anchor.
- `currentAnchorId` records what exists now.
- `recommendedAnchorId` may propose a future semantic anchor.
- Until implemented and validated, navigation must fall back to project top.
- Anchor IDs should be semantic, stable, short, and unique.
- A section may support some claims while explicitly not supporting others.

---

## N. Evidence Cards

Each card is the smallest approved evidence unit and must align with the canonical `EvidenceCard` model.

```yaml
evidenceCards:
  - evidenceId: "ev_<caseStudyId>_<nn>"
    conceptIds: []
    claim: ""
    claimKind:
      "documented-fact | interpretive-conclusion | unverified-assumption"
    context: ""
    action: null
    result: null
    project:
      slug: ""
      title: ""
    source:
      type: "case-study | cv | homepage | agent-guidance"
      label: ""
      locator: ""
      anchorId: null
    sourceIds: []
    sourceQuotesOrExtracts: []
    visibility: "public | internal"
    reliability: "high | medium | low"
    approvalStatus: "approved | needs-review | blocked"
    updatedAt: "YYYY-MM-DD"
    publicSafeWording: ""
    interpretationBasisEvidenceIds: []
    limitations: []
    prohibitedExtensions: []
```

### Evidence Card construction rules

1. `claim` contains one accountable professional claim.
2. A card should be independently understandable.
3. A card may include context, action, and result, but no field is filled by assumption.
4. `source.locator` must identify the supporting source location.
5. `anchorId` is included only when the anchor exists and is validated.
6. `conceptIds` must correspond to the normalized capability index.
7. Interpretive conclusions must identify their supporting factual evidence.
8. Unverified assumptions are never approved for visible report support.
9. Confidential details are stored only internally and must have safe public wording or be blocked.
10. One card should not bundle several unrelated capabilities merely to reduce card count.

### Evidence Card eligibility checklist

A card is eligible for visible report retrieval only when all are true:

```yaml
eligibility:
  publicVisibility: true
  approvedStatus: true
  reliabilityAllowed: true
  claimKindAllowed: true
  sourceLocatorPresent: true
  conceptIdsPresent: true
  publicWordingSafe: true
  conflictFree: true
```

---

## O. Evidence Cluster Guidance

Evidence Clusters are generated during report composition, not authored as final report objects inside the case-study file.

The file may provide clustering guidance:

```yaml
evidenceClusterGuidance:
  - clusterCandidateId: "cluc_<caseStudyId>_<nn>"
    title: ""
    summary: ""
    evidenceIds: []
    sectionIds: []
    preferredDestination:
      mode: "anchor | project-top | no-link"
      href: ""
      anchorId: null
    reliabilityRule: "minimum | weighted | manual-review"
    notes: ""
```

### Cluster rules

The composer must still:

- validate all included Evidence Cards;
- derive `supportedItemIds` from the active report;
- generate the final `clusterId`;
- enforce one unique destination `dedupeKey`;
- fall back to project top when the anchor is absent;
- exclude internal, blocked, or low-reliability evidence from visible clusters.

The knowledge file must never pre-author role-specific `supportedItemIds`.

---

## P. Retrieval Support

```yaml
retrievalSupport:
  primaryKeywords: []
  synonyms: []
  relatedJobTitles: []
  domains: []
  methods: []
  tools: []
  systemTypes: []
  responsibilities: []
  userGroups: []
  workflowPatterns: []
  commonQuestionsThisFileCanAnswer:
    - question: ""
      evidenceIds: []
  questionsThisFileCannotAnswer:
    - question: ""
      reason: ""
  disambiguationRules: []
  negativeKeywordsOrFalseFriends: []
```

Rules:

- Retrieval support improves findability; it does not authorize a claim.
- Negative keywords help avoid false semantic matches.
- Answerable questions must map to Evidence Cards.
- Unanswerable questions should produce `insufficient evidence`, not speculation.

---

## Q. Agent Guardrails

```yaml
agentGuardrails:
  approvedClaims:
    - claim: ""
      evidenceIds: []
      safeWording: []
  unsupportedClaims:
    - claimPattern: ""
      reason: ""
  confidentialDetails:
    - detail: ""
      publicHandling: "omit | generalize | internal-only"
  requiredQualifications:
    - qualification: ""
      rule: ""
  knownAmbiguities: []
  insufficientEvidenceTriggers: []
  clarificationTriggers: []
  forbiddenWording: []
  safeFallbackWording:
    en: []
    he: []
```

### Required fallback behaviors

The agent must say that evidence is insufficient when:

- no approved Evidence Card supports the claim;
- only internal evidence exists;
- only low-reliability evidence exists;
- the source is contradicted or unresolved;
- the requested conclusion exceeds the documented scope;
- a target outcome is mistaken for a verified result;
- the user asks for confidential detail beyond approved wording.

The agent should request clarification from Shani during knowledge-file preparation when:

- a material conflict exists;
- ownership cannot be determined;
- a metric appears without a source;
- public and internal versions differ materially;
- an anchor or URL is unclear;
- an important claim cannot be classified safely.

---

## R. Internal vs Public Field Matrix

| Field or object | Internal | May be public | Conditions |
|---|---:|---:|---|
| Internal organization/client name | Yes | No | Unless explicitly approved |
| Safe organization label | Yes | Yes | Approved wording only |
| Raw source IDs | Yes | No | Operational traceability |
| Source locator | Yes | No | Used to validate evidence |
| Public URL and approved anchor | Yes | Yes | Must be validated |
| Role/ownership claim | Yes | Yes | Approved and source-backed |
| Confidential workflow detail | Yes | No | Generalize or omit |
| Evidence Card raw source extract | Yes | No | Short safe summary only |
| Evidence Card public wording | Yes | Yes | Eligible card only |
| Metrics | Yes | Yes | Verified and approved |
| Expected benefits | Yes | Yes | Clearly labeled as expected |
| Target outcomes | Yes | Yes | Clearly labeled as unverified |
| Capability IDs | Yes | No | Canonical labels may be visible |
| Reliability and approval status | Yes | No | Used by retrieval |
| Evidence Cluster title/summary | Derived | Yes | Public-safe eligible evidence |
| Missing-evidence list | Yes | No | Drives safe responses and backlog |

---

## S. Validation Rules

### S1. Document gate

A file cannot become `approved` unless:

- all required sections exist;
- the project identity is unique;
- source inventory is complete for the reviewed material;
- conflicts are resolved or block affected claims;
- review-state lists are current;
- the owner and approval date are recorded.

### S2. Source gate

Every factual claim used in evidence must:

- reference at least one source ID;
- include a source locator;
- use a source with sufficient reliability;
- respect source recency and authority;
- remain within confidentiality rules.

### S3. Ownership gate

Every ownership claim must specify one:

- owned;
- co-owned;
- contributed;
- advised.

Ambiguous ownership fails approval.

### S4. Outcome gate

A verified result requires:

- an explicit source;
- a clear result statement;
- correct attribution;
- a metric source when quantitative.

Goals, potential, expected benefit, and recommendations cannot be stored as verified outcomes.

### S5. Evidence Card gate

An approved Evidence Card requires:

- unique stable `evidenceId`;
- one clear claim;
- at least one canonical concept ID;
- canonical `claimKind`;
- source locator;
- public-safe wording;
- reliability of high or medium for visible use;
- no unresolved source conflict;
- no unsupported extension;
- validated URL/anchor behavior when linked.

### S6. Retrieval gate

Visible retrieval must filter:

```text
conceptId match
+ visibility = public
+ approvalStatus = approved
+ reliability in [high, medium]
+ claimKind != unverified-assumption
```

Semantic similarity alone is insufficient.

### S7. Report-model alignment gate

The Case Study Knowledge File may feed:

- `EvidenceCard`;
- `EvidenceRetrievalResult`;
- `EvidenceCluster`;
- `AnalysisItem.evidenceIds`;
- `ReportItem.clusterIds`;
- follow-up evidence explanations;
- evidence navigation.

It must not define:

- overall fit independently;
- a visible score;
- report sections;
- role-specific strengths or gaps before a role is analyzed;
- a new match enum;
- browser-facing internal source IDs.

### S8. Link gate

- Public URL must be approved.
- Existing anchor must be validated.
- Missing anchor uses project-top fallback.
- Proposed anchors remain recommendations until implemented.
- No link is better than an invented link.
- Duplicate destinations are merged during cluster composition.

### S9. Privacy gate

The public-safe layer must exclude:

- confidential client or operational details;
- private source documents;
- internal file paths;
- raw CV content not approved for display;
- raw logs;
- prompts and model reasoning;
- sensitive system details;
- unapproved personal information.

---

## T. QA Checklist

### Structure

- [ ] Unique `caseStudyId`
- [ ] Correct version and status
- [ ] Complete source inventory
- [ ] Current conflict register
- [ ] Decided / Assumed / Open / Missing Evidence / Recommended completed

### Facts and ownership

- [ ] Every claim has a source
- [ ] Every source has a locator
- [ ] Ownership verbs are precise
- [ ] Team outcomes are not presented as individual outcomes
- [ ] Standard UX activities are not inferred

### Outcomes

- [ ] Verified results are separated from goals and expected benefits
- [ ] Every number has a source, unit, and attribution
- [ ] Prototype data is not treated as a measured outcome
- [ ] Future recommendations are not presented as delivered

### Evidence

- [ ] Every approved card has canonical concept IDs
- [ ] Every card has one accountable claim
- [ ] Interpretive conclusions identify their factual basis
- [ ] Public cards are safe for browser exposure
- [ ] Blocked or internal evidence cannot enter public clusters
- [ ] Transferable evidence is not labeled direct in advance

### Navigation

- [ ] Project route is validated
- [ ] Existing anchors are distinguished from recommendations
- [ ] Missing anchors use project-top fallback
- [ ] No invented URLs or anchors
- [ ] Direct report navigation is allowed only to approved sections

### Report alignment

- [ ] No new report structure was introduced
- [ ] Canonical enum values are used
- [ ] `semantic` and `real-gap` are supported
- [ ] Confidentiality is modeled as visibility/restriction, not match type
- [ ] Strengths and gaps remain role-specific downstream derivations

---

# 6. Blank Build-Ready Template

Copy this section into a new case-study file and complete it project by project.

```yaml
document:
  templateVersion: "1.0"
  knowledgeFileVersion: "1.0"
  status: "draft"
  owner: "Shani Nakash-Gomel"
  createdAt: ""
  updatedAt: ""
  approvedAt: null
  supersedes: null
  changeSummary: ""

reviewState:
  decided: []
  assumed: []
  open: []
  missingEvidence: []
  recommended: []

project:
  caseStudyId: ""
  projectName: ""
  publicTitle: ""
  shortDescription: ""
  portfolioUrl: ""
  slug: ""
  domain: []
  productOrSystemType: []
  organizationOrClient:
    publicName: null
    internalName: null
    visibility: "internal"
    safePublicLabel: ""
  projectPeriod:
    start: null
    end: null
    precision: "unknown"
    approved: false
  projectStatus: "unknown"
  confidentiality:
    level: "public"
    publicDescriptionRule: ""
    prohibitedDetails: []
  language:
    sourceLanguages: []
    preferredAgentLanguage: "en"
  lastApprovedDate: null

sourceInventory: []
sourceConflicts: []

projectSummary:
  oneSentence: ""
  conciseSummary: ""
  whyItMattered: ""
  safePublicSummary: ""

projectContext:
  background: ""
  problem: ""
  businessOrOperationalNeed: ""
  users: []
  stakeholders: []
  operatingEnvironment: []
  constraints: []
  risks: []
  complexity:
    systemComplexity: []
    workflowComplexity: []
    organizationalComplexity: []
    domainComplexity: []
  whyProjectMattered:
    documentedFact: ""
    expectedBenefit: ""

roleAndOwnership:
  approvedRoleTitle: ""
  officialRoleTitle: null
  roleDescription: ""
  scopeOfOwnership:
    owned: []
    coOwned: []
    contributedTo: []
    advisedOn: []
  responsibilities: []
  decisionsLed: []
  collaboration: []
  leadership:
    teamLeadership: []
    mentoring: []
    facilitation: []
  explicitlyNotPerformed: []
  unclearOrUnverified: []

decisionsAndActions: []

methodsAndWorkflows:
  research: []
  discovery: []
  uxStrategy: []
  informationArchitecture: []
  interactionDesign: []
  prototyping: []
  validation: []
  iteration: []
  delivery: []
  monitoringAndLearning: []
  aiOrAutomationActivities: []
  tools: []

solution:
  mainSolution: ""
  coreFlows: []
  keyFeatures: []
  importantDesignDecisions: []
  systemLogic: []
  complexityHandled: []
  alternativesConsidered: []
  tradeOffs: []
  futureRecommendations: []

outcomes:
  verifiedOutcomes: []
  expectedBenefits: []
  designGoals: []
  targetOutcomesNotVerified: []
  learnings: []
  remainingLimitations: []

capabilityIndex: []
publicSectionMap: []
evidenceCards: []
evidenceClusterGuidance: []

retrievalSupport:
  primaryKeywords: []
  synonyms: []
  relatedJobTitles: []
  domains: []
  methods: []
  tools: []
  systemTypes: []
  responsibilities: []
  userGroups: []
  workflowPatterns: []
  commonQuestionsThisFileCanAnswer: []
  questionsThisFileCannotAnswer: []
  disambiguationRules: []
  negativeKeywordsOrFalseFriends: []

agentGuardrails:
  approvedClaims: []
  unsupportedClaims: []
  confidentialDetails: []
  requiredQualifications: []
  knownAmbiguities: []
  insufficientEvidenceTriggers: []
  clarificationTriggers: []
  forbiddenWording: []
  safeFallbackWording:
    en: []
    he: []
```

---

# 7. Complete Example — Valid Case Study Knowledge File

The following is a structural example. It demonstrates valid field relationships and safe distinctions. Project facts must be independently verified before this example is reused as an approved source.

```yaml
document:
  templateVersion: "1.0"
  knowledgeFileVersion: "1.0"
  status: "draft"
  owner: "Shani Nakash-Gomel"
  createdAt: "2026-07-26"
  updatedAt: "2026-07-26"
  approvedAt: null
  supersedes: null
  changeSummary: "Initial structured knowledge-file example"

reviewState:
  decided:
    - "The public project label is Maritime C2 Monitoring."
    - "Operational and client details remain high-level."
  assumed: []
  open:
    - "Confirm the final public portfolio route and implemented anchors."
  missingEvidence:
    - "No approved quantitative reduction in downtime is currently documented."
  recommended:
    - "Add a semantic anchor for the recovery workflow section."

project:
  caseStudyId: "maritime-c2-monitoring"
  projectName: "Maritime C2 Monitoring"
  publicTitle: "Maritime C2 Monitoring"
  shortDescription: "A monitoring and recovery experience for a complex operational system."
  portfolioUrl: "/work/maritime-c2-monitoring"
  slug: "maritime-c2-monitoring"
  domain:
    - "defense"
    - "mission-critical systems"
  productOrSystemType:
    - "command-and-control"
    - "monitoring"
    - "diagnostics"
  organizationOrClient:
    publicName: null
    internalName: null
    visibility: "internal"
    safePublicLabel: "Maritime operational environment"
  projectPeriod:
    start: null
    end: null
    precision: "unknown"
    approved: false
  projectStatus: "historical"
  confidentiality:
    level: "confidential-high-level-only"
    publicDescriptionRule: "Describe workflows, UX decisions, and system complexity without operational identifiers."
    prohibitedDetails:
      - "Operational deployment details"
      - "Sensitive system architecture"
  language:
    sourceLanguages:
      - "en"
      - "he"
    preferredAgentLanguage: "en"
  lastApprovedDate: null

sourceInventory:
  - sourceId: "src_maritime_01"
    name: "Current public case-study page"
    sourceType: "public-case-study"
    location: "/work/maritime-c2-monitoring"
    versionOrDate: null
    approvalStatus: "needs-review"
    reliability: "high"
    recency: "current"
    contentRole: "content"
    containsUniqueInformation: true
    duplicatesSourceIds: []
    conflictsWithSourceIds: []
    recommendedUse: "Primary public evidence and navigation source after URL and anchors are validated."
    restrictions:
      - "Use only content visible on the approved public page."
    notes: ""

  - sourceId: "src_maritime_02"
    name: "Approved CV"
    sourceType: "cv"
    location: "Approved CV source"
    versionOrDate: null
    approvalStatus: "approved"
    reliability: "high"
    recency: "current"
    contentRole: "content"
    containsUniqueInformation: true
    duplicatesSourceIds: []
    conflictsWithSourceIds: []
    recommendedUse: "Validate role and high-level project responsibility."
    restrictions:
      - "Do not expose raw CV text."
    notes: ""

sourceConflicts: []

projectSummary:
  oneSentence: "A UX initiative for monitoring, diagnosis, and targeted recovery in a complex maritime operational system."
  conciseSummary: "The project addressed the need to make system failures easier to identify, understand, and recover from without relying on a broad reset as the default response."
  whyItMattered: "Recovery in a mission-critical environment must be understandable, controlled, and traceable."
  safePublicSummary: "The case study demonstrates UX strategy and workflow design for monitoring and recovery in a complex operational environment."

projectContext:
  background: "Operators and technical users needed clearer visibility into system failures and recovery actions."
  problem: "Failure handling could require broad intervention and did not provide sufficient guided visibility into the affected process."
  businessOrOperationalNeed: "Support faster, more targeted, and more accountable recovery decisions."
  users:
    - userGroup: "Technical operational users"
      needs:
        - "Understand failure severity"
        - "Identify the affected process"
        - "Follow a clear recovery path"
      environment: "Complex operational system"
      visibility: "public"
  stakeholders:
    - stakeholderType: "Engineering and operational stakeholders"
      relationshipToProject: "Cross-functional collaboration around system behavior and user workflow."
      visibility: "public"
  operatingEnvironment:
    - "Mission-critical"
    - "Multi-system"
    - "High information density"
  constraints:
    - constraint: "Confidential operational context"
      sourceIds:
        - "src_maritime_01"
  risks:
    - risk: "Overstating unverified performance outcomes"
      sourceIds:
        - "src_maritime_01"
  complexity:
    systemComplexity:
      - "Multiple system components and failure states"
    workflowComplexity:
      - "Diagnosis, intervention, progress, and reporting"
    organizationalComplexity:
      - "Coordination between UX, engineering, and operational expertise"
    domainComplexity:
      - "Mission-critical maritime context"
  whyProjectMattered:
    documentedFact: "The work focused on improving visibility and guided recovery."
    expectedBenefit: "Reduce unnecessary broad resets and improve recovery clarity."

roleAndOwnership:
  approvedRoleTitle: "Senior UX Strategist and Innovation Lead"
  officialRoleTitle: null
  roleDescription: "Led UX strategy and workflow definition for the monitoring and recovery experience."
  scopeOfOwnership:
    owned:
      - "UX framing of the monitoring and recovery workflow"
    coOwned:
      - "Translation of system behavior into user-facing recovery states"
    contributedTo:
      - "Cross-functional definition of diagnostic information"
    advisedOn: []
  responsibilities:
    - "Define the user flow from failure visibility through recovery and reporting"
    - "Clarify information hierarchy and role-based needs"
  decisionsLed:
    - "Use targeted recovery as the primary UX direction rather than a broad reset-first experience"
  collaboration:
    - collaboratorType: "Engineering and domain stakeholders"
      collaborationDescription: "Aligned technical system behavior with operational user needs."
      sourceIds:
        - "src_maritime_01"
        - "src_maritime_02"
  leadership:
    teamLeadership: []
    mentoring: []
    facilitation: []
  explicitlyNotPerformed:
    - "No claim of independently implementing backend recovery logic"
  unclearOrUnverified:
    - "Exact team size"
    - "Exact project dates"

decisionsAndActions:
  - decisionActionId: "da_maritime_01"
    type: "decision"
    title: "Targeted recovery workflow"
    description: "Structure recovery around the affected process and show clear progress and completion states."
    rationale: "A broad reset is disruptive and provides limited diagnostic accountability."
    roleOfShani:
      level: "owned"
      wording: "Led the UX definition of the targeted recovery workflow."
    alternativesConsidered:
      - "Broad reset as the primary action"
    tradeOffs:
      - "More explicit system-state communication is required."
    sourceIds:
      - "src_maritime_01"
    sourceLocators:
      - "Public case study — recovery workflow section"
    visibility: "public"
    approvalStatus: "needs-review"

methodsAndWorkflows:
  research: []
  discovery:
    - "Operational problem framing"
  uxStrategy:
    - "Role-based workflow definition"
    - "Failure-state information hierarchy"
  informationArchitecture:
    - "Severity and process organization"
  interactionDesign:
    - "Failure notification, recovery progress, and completion reporting"
  prototyping: []
  validation: []
  iteration: []
  delivery: []
  monitoringAndLearning:
    - "Recovery history and reporting as part of the experience"
  aiOrAutomationActivities:
    - "AI guidance may be represented only if the approved public source explicitly documents it."
  tools: []

solution:
  mainSolution: "A guided monitoring and recovery experience that surfaces failure severity, identifies the affected process, supports targeted intervention, and records completion."
  coreFlows:
    - flowId: "flow_maritime_recovery"
      name: "Failure to recovery"
      summary: "Detect failure, inspect details, initiate targeted recovery, monitor progress, and review the report."
      userGroups:
        - "Technical operational users"
      sourceIds:
        - "src_maritime_01"
      publicSectionIds:
        - "sec_maritime_recovery"
  keyFeatures:
    - featureId: "feat_maritime_progress"
      name: "Recovery progress"
      description: "Shows the status of a targeted recovery action."
      roleOfShani: "Defined the user-facing interaction and information needs."
      sourceIds:
        - "src_maritime_01"
  importantDesignDecisions:
    - "Make severity and affected process visible before action."
    - "Show progress and completion rather than treating recovery as an opaque command."
  systemLogic:
    - "Failure state → selected process → recovery action → progress → report"
  complexityHandled:
    - "System-state visibility"
    - "Role-relevant information"
    - "Recovery accountability"
  alternativesConsidered:
    - "Reset-first workflow"
  tradeOffs:
    - "Requires validated system-state data."
  futureRecommendations: []

outcomes:
  verifiedOutcomes: []
  expectedBenefits:
    - statement: "Faster and more targeted recovery decisions."
      sourceIds:
        - "src_maritime_01"
  designGoals:
    - statement: "Reduce dependence on broad resets."
      sourceIds:
        - "src_maritime_01"
  targetOutcomesNotVerified:
    - statement: "Reduce downtime."
      sourceIds:
        - "src_maritime_01"
  learnings:
    - statement: "Operational recovery UX must make system state and action progress visible."
      claimKind: "interpretive-conclusion"
      sourceIds:
        - "src_maritime_01"
  remainingLimitations:
    - "No approved quantitative outcome is currently available."

capabilityIndex:
  - capabilityId: "cap_complex-systems-ux"
    canonicalLabel: "Complex systems UX"
    category: "complex-systems"
    definition: "Designing understandable workflows and information structures for interconnected operational systems."
    demonstratedBy:
      evidenceIds:
        - "ev_maritime_01"
      decisionActionIds:
        - "da_maritime_01"
      outcomeIds: []
      sectionIds:
        - "sec_maritime_recovery"
    strengthOfSupport: "strong"
    allowedEvidenceUse:
      directCandidate: true
      semanticCandidate: true
      transferableCandidate: true
      partialCandidate: true
    limitations:
      - "Direct classification depends on the role requirement being comparable."
    jdKeywords:
      - "complex systems"
      - "operational systems"
      - "mission-critical"
    synonyms:
      - "enterprise complexity"
      - "system UX"
    relatedJobTitles:
      - "Senior UX Strategist"
      - "Product Designer — Complex Systems"
    safeAgentWording:
      - "The project documents UX ownership in a complex operational system."
    forbiddenAgentWording:
      - "The project proves expertise in every mission-critical domain."

publicSectionMap:
  - sectionId: "sec_maritime_recovery"
    publicTitle: "Targeted recovery workflow"
    eyebrow: null
    currentAnchorId: null
    recommendedAnchorId: "targeted-recovery"
    portfolioUrl: "/work/maritime-c2-monitoring"
    destinationMode: "project-top"
    sectionSummary: "Shows the workflow from identifying a failure through targeted recovery and completion."
    sectionContentType: "workflow"
    claimsSupported:
      - "UX definition of a guided recovery workflow"
      - "Complex system-state communication"
    claimsNotSupported:
      - "Verified downtime reduction"
      - "Independent backend implementation"
    capabilitiesDemonstrated:
      - "cap_complex-systems-ux"
    relevantJobRequirementPatterns:
      - "Design workflows for complex operational systems"
      - "Translate system behavior into usable interfaces"
    evidenceIds:
      - "ev_maritime_01"
    primaryKeywords:
      - "recovery"
      - "monitoring"
      - "complex systems"
    directReportNavigationAllowed: false
    safeNavigationText:
      en: "View the recovery workflow in the Maritime C2 Monitoring case study."
      he: "לצפייה בפלואו ההתאוששות בקייס סטאדי Maritime C2 Monitoring."
    visibility: "public"
    approvalStatus: "needs-review"

evidenceCards:
  - evidenceId: "ev_maritime_01"
    conceptIds:
      - "cap_complex-systems-ux"
    claim: "Shani led the UX definition of a guided monitoring and targeted recovery workflow for a complex operational system."
    claimKind: "documented-fact"
    context: "The workflow needed to surface failure severity and the affected process in a mission-critical environment."
    action: "Defined the user flow from failure visibility through targeted recovery, progress, and reporting."
    result: null
    project:
      slug: "maritime-c2-monitoring"
      title: "Maritime C2 Monitoring"
    source:
      type: "case-study"
      label: "Maritime C2 Monitoring case study"
      locator: "Recovery workflow section"
      anchorId: null
    sourceIds:
      - "src_maritime_01"
      - "src_maritime_02"
    sourceQuotesOrExtracts: []
    visibility: "public"
    reliability: "high"
    approvalStatus: "needs-review"
    updatedAt: "2026-07-26"
    publicSafeWording: "The project shows UX strategy and workflow design for monitoring and targeted recovery in a complex operational environment."
    interpretationBasisEvidenceIds: []
    limitations:
      - "Does not establish a verified quantitative reduction in downtime."
    prohibitedExtensions:
      - "Do not claim backend implementation ownership."
      - "Do not state a numeric performance improvement."

evidenceClusterGuidance:
  - clusterCandidateId: "cluc_maritime_recovery"
    title: "Monitoring and targeted recovery"
    summary: "Evidence of complex-system UX, system-state visibility, and a guided recovery workflow."
    evidenceIds:
      - "ev_maritime_01"
    sectionIds:
      - "sec_maritime_recovery"
    preferredDestination:
      mode: "project-top"
      href: "/work/maritime-c2-monitoring"
      anchorId: null
    reliabilityRule: "minimum"
    notes: "Switch to anchor mode only after the recommended anchor is implemented and validated."

retrievalSupport:
  primaryKeywords:
    - "complex systems"
    - "monitoring"
    - "diagnostics"
    - "recovery"
    - "mission-critical"
  synonyms:
    - "system health"
    - "incident recovery"
    - "operational UX"
  relatedJobTitles:
    - "Senior UX Strategist"
    - "Product Designer"
    - "UX Architect"
  domains:
    - "defense"
    - "enterprise"
  methods:
    - "UX strategy"
    - "workflow design"
  tools: []
  systemTypes:
    - "command-and-control"
    - "monitoring system"
  responsibilities:
    - "Translate technical system behavior into user workflows"
    - "Define failure and recovery states"
  userGroups:
    - "Technical operational users"
  workflowPatterns:
    - "Detect → diagnose → recover → report"
  commonQuestionsThisFileCanAnswer:
    - question: "Does the portfolio show experience with complex operational systems?"
      evidenceIds:
        - "ev_maritime_01"
  questionsThisFileCannotAnswer:
    - question: "By exactly what percentage did downtime decrease?"
      reason: "No approved quantitative result is documented."
  disambiguationRules:
    - "Do not equate monitoring UX with ownership of the underlying infrastructure."
  negativeKeywordsOrFalseFriends:
    - "consumer growth analytics"
    - "robotics interaction"

agentGuardrails:
  approvedClaims:
    - claim: "The project demonstrates UX strategy and workflow design for a complex operational system."
      evidenceIds:
        - "ev_maritime_01"
      safeWording:
        - "The case study documents UX ownership in a complex operational context."
  unsupportedClaims:
    - claimPattern: "Downtime was reduced by a specific amount."
      reason: "No approved metric is available."
  confidentialDetails:
    - detail: "Operational system specifics"
      publicHandling: "generalize"
  requiredQualifications:
    - qualification: "Any direct match must compare genuinely similar responsibility and complexity."
      rule: "Do not assign direct solely because the keywords overlap."
  knownAmbiguities:
    - "Final public anchor is not implemented."
  insufficientEvidenceTriggers:
    - "Questions about quantitative outcomes"
    - "Questions about unapproved operational details"
  clarificationTriggers:
    - "A source claims a metric without a traceable measurement."
  forbiddenWording:
    - "Proven reduction in downtime"
    - "Built the backend recovery engine"
  safeFallbackWording:
    en:
      - "The project supports the workflow and UX conclusion, but no approved quantitative outcome is available."
    he:
      - "הפרויקט תומך במסקנה לגבי הפלואו וה־UX, אך אין כרגע תוצאה כמותית מאושרת."
```

### Example validity note

The example is structurally valid because it:

- separates fact, interpretation, target, and verified outcome;
- preserves ownership limits;
- uses canonical concept and evidence identifiers;
- avoids pre-assigning a role-specific final match;
- treats confidentiality through visibility and guardrails;
- proposes but does not invent an active anchor;
- provides project-top fallback;
- does not claim an unverified metric.

It remains `draft` until the underlying sources, wording, URL, and anchors are reviewed and approved.

---

# 8. Relationship to downstream report objects

## 8.1 Knowledge file → Evidence Card

Approved entries under `evidenceCards` become the retrieval index.

## 8.2 Evidence Cards → Retrieval Result

The retrieval layer filters cards by:

- concept ID;
- public visibility;
- approved status;
- high or medium reliability.

## 8.3 Retrieval Result → Analysis Item

A role-specific `AnalysisItem` references one or more eligible `evidenceIds`.

The Case Study Knowledge File does not decide the final `matchType` without the role context.

## 8.4 Evidence Cards → Evidence Cluster

The composer builds clusters and:

- assigns final `clusterId`;
- derives `supportedItemIds`;
- validates the destination;
- deduplicates links;
- emits a public-safe summary.

## 8.5 Evidence Cluster → Report UI and follow-up

The browser receives only public-safe cluster data and `clusterIds`.

Raw source IDs, internal locators, blocked evidence, and private content remain server-side.

---

# 9. Approval workflow per Case Study

```text
1. Collect sources
2. Build source inventory
3. Identify duplication, conflicts, and gaps
4. Extract supported facts
5. Map public sections and anchors
6. Draft capabilities and Evidence Cards
7. Run validation and privacy checks
8. Present:
   - Decided
   - Assumed
   - Open
   - Missing Evidence
   - Recommended
9. Receive Shani’s approval or corrections
10. Produce clean approved file
11. Add eligible cards to the Evidence Index
12. Update cross-case-study indexes
```

Only the approved version becomes a source of truth.

---

# 10. Stage Outputs Derived from Approved Files

After completing the first 3–5 case studies, generate:

1. **Source Inventory per Case Study**  
   Included in each individual knowledge file and optionally consolidated.

2. **Clean Case Study Knowledge Files**  
   One approved file per selected project.

3. **Cross-Case-Study Evidence Index**  
   Maps canonical capabilities and role requirement patterns to eligible Evidence IDs and projects.

4. **Evidence Gaps List**  
   Lists important claims, abilities, domains, and questions lacking sufficient approved evidence.

5. **Portfolio Anchor Recommendations**  
   Consolidates missing, inconsistent, and recommended semantic anchors.

These are evidence-layer artifacts. They do not add report sections.

---

# 11. MVP Scope Rule

For the first implementation, create complete files only for 3–5 projects that jointly provide broad evidence coverage across:

- UX strategy;
- complex systems;
- mission-critical environments;
- product and system thinking;
- research and validation;
- cross-functional collaboration;
- leadership;
- AI or automation workflows;
- enterprise, defense, medical, or SaaS experience.

A small reliable knowledge base is preferable to a broad, inconsistent one.

---

# 12. Acceptance Criteria

`Case_Study_Knowledge_File_Template_v1.0.md` is ready for use when:

- it produces canonical `EvidenceCard` fields compatible with `Report_Data_Model_v1.0`;
- it preserves deterministic retrieval and traceability;
- it distinguishes facts, interpretations, assumptions, goals, targets, and results;
- it models confidentiality separately from report match type;
- it supports semantic anchors and safe project-top fallback;
- it defines internal versus public boundaries;
- it prevents unsupported claims and metrics;
- it does not introduce a new report section or parallel enum;
- it includes a blank reusable template;
- it includes a structurally complete example;
- it supports approval, validation, and downstream evidence indexing.

---

## 13. Recommended Next Step

Use this template to build the first real:

```text
Source Inventory + Case Study Knowledge File
```

for one primary project.

Recommended selection criteria for the first project:

- source material is relatively complete;
- the public case study has clear sections;
- the project demonstrates several high-priority capabilities;
- confidentiality can be managed safely;
- it can expose any practical gaps in the template before the remaining files are created.