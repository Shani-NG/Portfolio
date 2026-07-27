**Runtime Data, Logging and Persistence Schema**

**Runtime\_Data\_Logging\_and\_Persistence\_Schema\_v1.0**

*Conversation-Based Portfolio Agent | Build-ready MVP specification*

| Field | Value |
| :---- | :---- |
| Status | Approved specification candidate — implementation-ready |
| Owner and final approver | Shani Nakash-Gomel |
| Scope | Runtime contracts, temporary state, persistence, event logging, privacy, API boundaries and MVP storage |
| Supersedes | Earlier persistence recommendations where they conflict with approved Stage 4.2 decisions |
| Canonical dependencies | Final\_Portfolio\_Agent\_System\_Prompt; Conversation\_Blueprint\_Package; Report\_Data\_Model; Portfolio\_Knowledge\_Index; Agent\_Architecture\_and\_Runtime\_Orchestration |

# **1\. Purpose and authority**

This document defines the exact runtime objects, storage boundaries, logging events and API contracts required to implement the portfolio-agent MVP. It does not reopen approved product or orchestration decisions. Where an older source recommends persisting raw role snapshots, this document applies the newer privacy decision: original job-description content and the Temporary Role Snapshot are not retained after their operational purpose ends.

## **1.1 Authority order**

* Explicit decisions approved in Stage 4.2  
* This document for runtime storage, logging, privacy and API contracts  
* Report\_Data\_Model for report field names, analysis objects, evidence rules and final UI payload  
* Conversation\_Blueprint\_Package for states, triggers, limits and recovery behavior  
* Portfolio\_Knowledge\_Index and approved knowledge files for evidence identity and public eligibility

# **2\. Closed decisions preserved**

* One user-facing agent with three internal task modes: Role Understanding, Fit Analysis and Report Follow-up.  
* Maximum two successfully completed reports per session. A blocked third request creates no report ID and triggers no model call.  
* Two retries after the initial generation attempt per role snapshot.  
* Session expires after 24 hours of inactivity.  
* No completed fit report when there is no meaningful fit or when approved evidence is insufficient.  
* Final completed reports are stored as structured JSON.  
* Original job-description text, uploaded file contents and personal details extracted from a job description are not stored.  
* A minimal Normalized Role Summary is stored for QA and human-reviewed learning.  
* Company name may be stored; personal names, email addresses and telephone numbers from the job description may not be stored.  
* Contact data is stored only after explicit submission of the shared contact form.  
* Contact leads may be stored in Google Sheets or Excel for the MVP.  
* Report download is outside MVP scope.

# **3\. Storage classes and lifecycle**

| Class | Meaning | Typical lifetime | Examples |
| :---- | :---- | :---- | :---- |
| Ephemeral memory | Required only for the active runtime operation; never written to persistent storage | Single request or active session | Raw pasted JD, extracted file text, Temporary Role Snapshot, prompt assembly |
| Session state | Server-side or client-bound state required to continue the active conversation | Until 24 hours idle | Session contract, active mode, counters, active report ID |
| Persistent JSON | Versioned structured record retained after the session | Retention policy below | Normalized Role Summary, completed Stored Report Record |
| Operational event log | Structured observability record without raw content | 30 days MVP default | Validation result, transition, duration, retry, error category |
| Lead table | Explicitly submitted contact form data | 12 months MVP default or until deletion request | Name, email, message, consent timestamp |
| Not stored | Prohibited from persistence | Never | Raw JD, chain-of-thought, API secrets, JD contact person details |

# **4\. Shared primitives and identifiers**

type ISODateTime \= string  
type UUID \= string  
type Language \= "he" | "en" | "mixed"  
type TaskMode \= "portfolio-qa" | "role-understanding" | "fit-analysis" | "report-follow-up"  
type SessionStatus \= "active" | "expired" | "closed"  
type StorageClass \= "ephemeral" | "session" | "persistent-json" | "event-log" | "lead-table" | "not-stored"

All IDs are opaque server-generated values. No ID may contain an email address, company name, role title or other user-provided text.

# **5\. Session Data Contract**

type SessionRecord \= {  
  schemaVersion: "1.0"  
  sessionId: UUID  
  conversationId: UUID  
  status: "active" | "expired" | "closed"  
  language: Language  
  activeMode: TaskMode  
  activeRoleSnapshotId?: UUID  
  activeReportId?: UUID  
  completedReportIds: UUID\[\]  
  completedReportCount: 0 | 1 | 2  
  reportAttemptCount: number  
  lastActivityAt: ISODateTime  
  expiresAt: ISODateTime  
  createdAt: ISODateTime  
  updatedAt: ISODateTime  
}

| Field rule | Requirement |
| :---- | :---- |
| Expiry | expiresAt \= lastActivityAt \+ 24 hours; meaningful user or system activity refreshes it. Passive page viewing does not. |
| Report count | Increment only when a report reaches state ready. Limited, out-of-scope and failed outcomes do not consume the two-report allowance. |
| Attempt count | Counts generation attempts for observability; it is not the completed-report limit. |
| Active report | Must reference one of completedReportIds when set. |
| Post-expiry | Session data becomes inaccessible to the conversation. Persistent reports may remain stored but are not automatically reattached to a new anonymous session. |

# **6\. Temporary Role Snapshot Contract**

type TemporaryRoleSnapshot \= {  
  schemaVersion: "1.0"  
  roleSnapshotId: UUID  
  sessionId: UUID  
  sourceKind: "pasted-text" | "uploaded-file" | "clarification" | "combined"  
  rawContent: string  
  extractedFields: RoleDraft  
  parseStatus: "valid-complete" | "valid-incomplete" | "not-a-job-description" | "unreadable" | "contradictory"  
  missingFieldKeys: string\[\]  
  contradictionCodes: string\[\]  
  personalDataDetected: boolean  
  personalDataTypes: ("person-name" | "email" | "phone" | "address" | "other")\[\]  
  attemptCount: 0 | 1 | 2 | 3  
  createdAt: ISODateTime  
  updatedAt: ISODateTime  
}

* Exists only in ephemeral/session memory.  
* May include raw content because it is needed to validate, clarify and generate the report.  
* Must never be written into report JSON, event logs, analytics, browser storage, Google Sheets or backups.  
* Destroyed immediately after a final report outcome is committed, the user replaces the role, the session expires, or the user abandons the role flow.  
* A retry may reuse the same snapshot only while it remains in the active session.

# **7\. Normalized Role Summary Contract**

type NormalizedRoleSummary \= {  
  schemaVersion: "1.0"  
  normalizedRoleSummaryId: UUID  
  reportId: UUID  
  companyName?: string  
  roleTitleNormalized: string  
  roleFamily: "ux-design" | "product-design" | "ux-strategy" | "innovation" | "product" | "ai-product" | "ai-implementation" | "research" | "management" | "systems-engineering" | "other"  
  seniority?: "junior" | "mid" | "senior" | "lead" | "manager" | "head" | "director" | "unknown"  
  workModel?: "on-site" | "hybrid" | "remote" | "unknown"  
  employmentType?: "full-time" | "part-time" | "contract" | "temporary" | "internship" | "unknown"  
  domainTags: string\[\]  
  coreResponsibilityConcepts: string\[\]  
  mustHaveConcepts: string\[\]  
  preferredConcepts: string\[\]  
  hardConstraintCodes: string\[\]  
  sourceLanguage: Language  
  extractionQuality: "high" | "medium" | "low"  
  piiRemoved: true  
  createdAt: ISODateTime  
}

| Allowed | Not allowed |
| :---- | :---- |
| Abstracted professional concepts and categorical role properties | Verbatim sentences or long phrases copied from the job description |
| Company name when present | Recruiter, hiring-manager or employee names |
| Normalised role title | Email addresses, telephone numbers, personal addresses or social links |
| Broad domain tags and hard-constraint codes | Free-text notes that could reconstruct the original job description |

# **8\. Stored Report Record Contract**

type StoredReportRecord \= {  
  schemaVersion: "1.0"  
  reportId: UUID  
  sessionId: UUID  
  normalizedRoleSummaryId: UUID  
  state: "ready"  
  language: "he" | "en"  
  outcome: "strong" | "good" | "partial"  
  evidenceSnapshot: {  
    sourceSnapshotId: string  
    evidenceReferences: EvidenceReference\[\]  
    createdAt: ISODateTime  
  }  
  fitAnalysis: FitAnalysisResult  
  reportPayload: ReportUIPayload  
  validation: ReportValidationResult  
  generation: {  
    trigger: "dedicated-button" | "natural-language-request"  
    approvedAt: ISODateTime  
    startedAt: ISODateTime  
    completedAt: ISODateTime  
    modelVersion?: string  
    composerVersion: string  
    fitComputationVersion: string  
    attemptCount: 1 | 2 | 3  
  }  
  createdAt: ISODateTime  
  updatedAt: ISODateTime  
}

Only reports with a meaningful fit outcome and state ready are persisted as completed reports. Insufficient-evidence, out-of-scope and failed outcomes are represented by runtime events and safe user-facing responses, not as StoredReportRecord objects and not as completed reports.

# **9\. Evidence Reference Contract**

type EvidenceReference \= {  
  evidenceId: string  
  knowledgeFileId: string  
  knowledgeFileVersion: string  
  caseStudyId?: string  
  sectionId?: string  
  anchorId?: string  
  clusterId?: string  
  claimIds: string\[\]  
  visibility: "public"  
  approvalStatus: "approved"  
  reliability: "high" | "medium"  
  contentHash?: string  
}

* References identify approved evidence without duplicating full private source text.  
* Every positive direct, semantic or transferable conclusion must resolve to at least one eligible Evidence Reference.  
* The browser receives only public evidence clusters and approved navigation destinations, not internal knowledge-file identifiers.  
* A report remains immutable even if a knowledge file is later updated; its evidence snapshot preserves the version used at generation time.

# **10\. Contact Lead Table Schema**

| Column | Type | Required | Rule |
| :---- | :---- | :---- | :---- |
| lead\_id | UUID | Yes | Generated server-side |
| submitted\_at | ISO datetime | Yes | Server timestamp |
| name | Text | Yes | 1-100 characters |
| email | Text | Yes | Valid email, normalised lowercase |
| phone | Text | No | Optional, 7-25 characters after safe normalisation |
| company | Text | No | 0-150 characters |
| role\_or\_context | Text | No | 0-150 characters |
| message | Text | Yes | 1-2000 characters |
| source\_cta | Enum | Yes | general | report-strong | report-good | report-partial | evidence | other |
| report\_id | UUID | No | Only when CTA originated from a stored report |
| consent\_to\_contact | Boolean | Yes | Must be true |
| privacy\_notice\_version | Text | Yes | Static configured version |
| status | Enum | Yes | new | contacted | closed | spam |
| owner\_notes | Text | No | Manual internal notes; not model-generated |

The contact table is operationally separate from role and report data. Do not merge contact details into session logs or report JSON. A report may hold only a non-personal lead-reference ID if later integration requires it; this is outside the initial MVP.

# **11\. Runtime Event Taxonomy**

| Event name | Meaning |
| :---- | :---- |
| session.started | Session created |
| session.activity | Meaningful activity refreshed expiry |
| session.expired | 24-hour idle timeout reached |
| intent.detected | Task mode selected |
| role.input\_received | Role input accepted into ephemeral processing |
| role.classified | Job-description classification completed |
| role.validation\_failed | Role incomplete, unreadable, contradictory or invalid |
| role.clarification\_requested | Minimal missing detail requested |
| role.confirmed | User explicitly approved role summary |
| report.limit\_blocked | Third completed-report request blocked before model call |
| report.generation\_started | Generation attempt started |
| report.generation\_retried | Attempt 2 or 3 started |
| report.validation\_completed | Validation gates completed |
| report.completed | Ready meaningful-fit report persisted |
| report.no\_meaningful\_fit | No report produced because meaningful fit was absent |
| report.insufficient\_evidence | No report produced because evidence was insufficient |
| report.failed | Generation failed after allowed attempts or hard failure |
| report.followup\_started | Follow-up bound to report |
| evidence.opened | Approved evidence destination opened |
| contact.cta\_impression | Contact CTA rendered |
| contact.cta\_clicked | Shared form opened |
| contact.submitted | Form successfully submitted |
| storage.degraded | Optional storage unavailable |
| error.occurred | Categorised recoverable or terminal error |

# **12\. Logging Schema**

type RuntimeEvent \= {  
  schemaVersion: "1.0"  
  eventId: UUID  
  eventName: RuntimeEventName  
  occurredAt: ISODateTime  
  sessionId?: UUID  
  conversationId?: UUID  
  reportId?: UUID  
  roleSnapshotId?: UUID  
  traceId: UUID  
  mode?: TaskMode  
  outcome: "success" | "failure" | "blocked" | "partial"  
  durationMs?: number  
  attemptNumber?: 1 | 2 | 3  
  validationGate?: "request" | "role" | "analysis" | "evidence" | "composition" | "privacy" | "link" | "ui-schema" | "state-transition"  
  errorCategory?: ErrorCategory  
  counts?: { roleItems?: number; evidenceItems?: number; clusters?: number; reportsCompleted?: number }  
  versions?: { model?: string; composer?: string; schema?: string; knowledgeSnapshot?: string }  
  metadata?: Record\<string, string | number | boolean | null\>  
}

| Log | Do not log |
| :---- | :---- |
| IDs, state transitions, gate results, durations, retry number, counts and version references | Raw prompts, model reasoning, chain-of-thought or hidden analysis |
| Normalised enum outcomes and non-sensitive error categories | Raw job-description text or extracted file text |
| Knowledge snapshot/version references | Full CV, case-study source passages or private source content |
| Boolean PII detection result | Detected names, email addresses or telephone numbers |
| Contact submission success/failure and lead ID | Contact form message or contact details in event logs |
| Safe client/platform metadata when useful | API keys, access tokens, internal endpoints or stack traces exposed to browser |

# **13\. Error Categories**

type ErrorCategory \=  
  | "invalid-input" | "unsupported-file" | "file-unreadable" | "role-incomplete"  
  | "role-contradictory" | "approval-missing" | "report-limit-reached"  
  | "retrieval-empty" | "retrieval-failed" | "model-timeout" | "model-invalid-output"  
  | "schema-validation-failed" | "evidence-validation-failed" | "privacy-validation-failed"  
  | "link-validation-failed" | "storage-unavailable" | "contact-validation-failed"  
  | "rate-limited" | "unknown"

# **14\. API Contracts**

## **14.1 Start or resume session**

POST /api/session  
Input: { language?: Language, sessionId?: UUID }  
Output: { session: SessionRecord, resumed: boolean }

## **14.2 Submit role input**

POST /api/role/understand  
Input: { sessionId: UUID, inputKind: "pasted-text" | "uploaded-file", text?: string, fileToken?: string }  
Output: { roleSnapshotId: UUID, parseStatus: RoleParseStatus, confirmationPreview?: RoleConfirmationPreview, missingFieldKeys: string\[\], safeMessageKey: string }

## **14.3 Clarify role**

POST /api/role/clarify  
Input: { sessionId: UUID, roleSnapshotId: UUID, fieldKey: string, value: string }  
Output: { parseStatus: RoleParseStatus, confirmationPreview?: RoleConfirmationPreview, remainingMissingFieldKeys: string\[\] }

## **14.4 Confirm and generate**

POST /api/report/generate  
Input: { sessionId: UUID, roleSnapshotId: UUID, approved: true, trigger: "dedicated-button" | "natural-language-request" }  
Success: { state: "ready", report: ReportUIPayload }  
No report: { state: "no-report", reason: "no-meaningful-fit" | "insufficient-evidence", safeMessageKey: string }  
Failure: { state: "failed", retryAvailable: boolean, attemptNumber: 1 | 2 | 3, safeMessageKey: string }  
Blocked: { state: "blocked", reason: "report-limit-reached" | "approval-missing" | "session-expired", safeMessageKey: string }

## **14.5 Report follow-up**

POST /api/report/follow-up  
Input: { sessionId: UUID, reportId: UUID, question: string, context?: { sectionId?: ReportSectionKey, itemId?: string, clusterId?: string } }  
Output: { answer: string, evidenceClusters: PublicEvidenceCluster\[\], reportId: UUID }

## **14.6 Contact form**

POST /api/contact  
Input: { name: string, email: string, phone?: string, company?: string, roleOrContext?: string, message: string, sourceCta: ContactCtaSource, reportId?: UUID, consentToContact: true, privacyNoticeVersion: string }  
Output: { submitted: true, leadId: UUID, safeMessageKey: "contact.submitted" }

# **15\. Validation Rules and Allowed Values**

| Boundary | Hard rules |
| :---- | :---- |
| Session | Valid non-expired session; completedReportCount 0-2; activeReportId belongs to completedReportIds. |
| Role input | At least one supported input source; size and type checked before extraction; raw content never logged. |
| Role completeness | Usable role title plus central responsibilities and requirements; unresolved blocking contradictions fail. Company may be unknown and omitted. |
| Approval | approved must be true and tied to the current immutable role snapshot. |
| Attempts | Initial attempt plus maximum two retries for the same snapshot; attemptNumber never exceeds 3\. |
| Report limit | Check completedReportCount before report ID creation, retrieval or model call. |
| Meaningful fit | Persist a report only when outcome is strong, good or partial and all gates pass. |
| Evidence | Positive claims require eligible approved public evidence; evidence IDs resolve against the frozen source snapshot. |
| Privacy | Persistent objects and logs must pass explicit allowlists; additionalProperties false for browser payloads. |
| Contact | Consent true, required fields valid, rate limits and spam protection applied. |

# **16\. Storage Mapping**

| Data | Storage | Persisted? | Retention / deletion |
| :---- | :---- | :---- | :---- |
| Raw pasted JD | Ephemeral | No | Delete after report outcome, replacement, abandonment or expiry |
| Uploaded JD file bytes | Ephemeral | No | Delete after extraction or immediate failure |
| Extracted JD text | Ephemeral | No | Same request/session only |
| Temporary Role Snapshot | Session memory | No | Destroy on completion/replacement/expiry |
| Normalized Role Summary | Persistent JSON | Yes | Default 12 months; reviewable/deletable |
| Completed report | Persistent JSON | Yes | Default 12 months |
| No-fit/insufficient outcome | Event log only | No report JSON | 30 days |
| Failed attempt details | Event log | No raw payload | 30 days |
| Runtime events | Event log | Yes | 30 days |
| Contact lead | Google Sheet/Excel table | Yes | 12 months or deletion request |
| Raw prompts / chain-of-thought | Not stored | Prohibited | Never |
| JD personal data | Not stored | Prohibited | Never |
| API secrets | Secret manager/environment | Not application storage | Rotate per deployment policy |

# **17\. Privacy and Retention Rules**

* Data minimisation: keep only what is required to render a completed report, support follow-up, diagnose quality and process a voluntarily submitted contact lead.  
* Purpose separation: report data, operational logs and contact leads remain separate stores or tables.  
* No silent learning: logs and summaries may support human-reviewed improvement; they must not automatically rewrite prompts, fit rules or portfolio evidence.  
* Human review uses Normalized Role Summaries and report outcomes, never raw job descriptions.  
* Deletion must remove the Stored Report Record and linked Normalized Role Summary; event logs may retain non-identifying aggregate operational facts until their normal expiry.  
* Backups must follow the same retention intent. For the MVP, avoid exporting persistent JSON or lead data into unmanaged local copies.  
* Client storage must not contain raw JD text or complete reports beyond what is necessary for the active page. Prefer opaque IDs and server fetches.

# **18\. Learning and QA Dataset Boundary**

type HumanReviewRecord \= {  
  reviewId: UUID  
  reportId: UUID  
  normalizedRoleSummaryId: UUID  
  reviewStatus: "pending" | "reviewed" | "excluded"  
  issueCodes: ("role-normalisation" | "fit-level" | "evidence-selection" | "gap-classification" | "copy-quality" | "broken-link" | "other")\[\]  
  reviewerDecision?: "accept" | "correct" | "exclude"  
  reviewerNotes?: string  
  reviewedAt?: ISODateTime  
}

This optional internal table is recommended for the MVP demo because it demonstrates a controlled learning loop without storing the original job description. Reviewer notes must not contain pasted job-description text or unnecessary personal data.

# **19\. State and Persistence Rules**

| Runtime outcome | User-facing result | Persistent report? | Consumes report allowance? |
| :---- | :---- | :---- | :---- |
| ready / strong | Full report | Yes | Yes |
| ready / good | Full report | Yes | Yes |
| ready / partial | Full report | Yes | Yes |
| no meaningful fit | Responsible no-report response | No | No |
| insufficient evidence | Responsible no-report response | No | No |
| failed attempt 1 or 2 | Retry option | No | No |
| failed attempt 3 | Final recoverable failure response | No | No |
| third completed-report request | Limit message before model call | No | No additional count |
| session expired | Start a new session | No new report | No |

# **20\. Material gaps resolved in this version**

| Gap or contradiction | Resolution |
| :---- | :---- |
| Earlier Report Data Model allowed persistence of role snapshots and raw uploaded content according to a future policy. | Superseded: Temporary Role Snapshot and raw content are ephemeral only. Persistent storage uses the minimal Normalized Role Summary. |
| Older sources treated limited and out-of-scope as report lifecycle states and possible report shells. Stage 4.2 states no report for insufficient evidence or no meaningful fit. | For this MVP, these are terminal no-report outcomes, logged as events but not stored as completed reports. The Report Data Model types may remain reusable for future UI expansion. |
| Company was previously required for role completeness. Stage 4.2 says company may be stored, implying it may be absent. | Company is optional. Role completeness depends on role title, central responsibilities and central requirements. |
| Exact retention duration was open. | MVP defaults proposed here: 12 months for reports, summaries and leads; 30 days for runtime logs. These are implementation defaults, not immutable product decisions. |
| Contact storage technology was open. | Google Sheets or Excel is approved for MVP; structured reports remain JSON. |

# **21\. MVP Implementation Scope**

## **Must build**

* TypeScript interfaces and JSON Schemas for SessionRecord, NormalizedRoleSummary, StoredReportRecord, EvidenceReference and RuntimeEvent.  
* In-memory or server-side ephemeral Temporary Role Snapshot with automatic deletion.  
* 24-hour idle expiry and two-completed-report limit.  
* Maximum three total generation attempts per role snapshot.  
* Persistent JSON store for ready reports and Normalized Role Summaries.  
* Structured event logger with allowlisted metadata.  
* Shared contact form writing to Google Sheets or Excel.  
* Human-review fields or lightweight review sheet for QA and learning.  
* Privacy tests proving raw JD and JD PII are absent from persistent stores and logs.

## **May simulate for POC**

* Persistent JSON may use local server files, a lightweight hosted database or a managed free-tier database, provided the contract remains unchanged.  
* Event monitoring may be represented by a simple admin table/dashboard sourced from the event log.  
* Human review may be performed in a spreadsheet rather than a custom admin UI.

## **Deferred**

* Report download or PDF export  
* Automated model fine-tuning or autonomous prompt updates  
* Cross-session anonymous report recovery  
* CRM integration beyond the lead table  
* Long-term analytics warehouse  
* Advanced consent preference centre

# **22\. Acceptance Criteria**

* A ready report can be reconstructed from StoredReportRecord without the original job description.  
* No raw job-description content appears in persistent JSON, logs, lead tables or browser analytics.  
* A third completed-report request is blocked before any report ID, retrieval or model invocation.  
* Attempts 1-3 are traceable; attempt 4 is impossible.  
* No-fit and insufficient-evidence outcomes do not create completed reports or consume the allowance.  
* Every persisted positive conclusion retains an evidence reference to the exact approved source snapshot.  
* Follow-up cannot access or cite evidence from another report.  
* Expired sessions cannot continue role generation without a new session.  
* Contact details are stored only after explicit successful form submission.  
* Storage failure produces a safe recoverable response and a structured storage.degraded event without exposing raw data.

# **23\. Recommended implementation order**

| Order | Deliverable |
| :---- | :---- |
| 1 | Shared enums, ID utilities and JSON Schema validators |
| 2 | Session service with expiry and counters |
| 3 | Ephemeral Role Snapshot service and PII removal |
| 4 | Report generation API with request, retry, evidence and privacy gates |
| 5 | Persistent report and Normalized Role Summary repository |
| 6 | Runtime event logger and monitoring table |
| 7 | Report follow-up isolation |
| 8 | Shared contact form and lead table |
| 9 | QA suite and privacy regression tests |

# **24\. Final status**

The runtime data, logging and persistence layer is sufficiently specified for MVP implementation. No material contradiction blocks the next build step. The only configurable operational defaults that may be adjusted without changing the contracts are retention duration, storage provider, file upload limits and the final contact-table platform.