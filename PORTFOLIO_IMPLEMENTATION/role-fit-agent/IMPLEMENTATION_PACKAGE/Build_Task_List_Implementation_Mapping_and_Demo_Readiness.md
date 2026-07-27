\# Build Task List, Implementation Mapping & Demo Readiness v1.0

\*\*Stage:\*\* 4.5 — Build Task List, Implementation Mapping & Demo Readiness  
\*\*Status:\*\* Build-ready specification  
\*\*Purpose:\*\* Translate the approved portfolio-agent product, architecture, data contracts, evidence model, runtime behaviour, persistence rules, and QA requirements into a practical implementation and demo package.

\---

\#\# 1\. Document Authority

This document operationalises the following canonical sources:

1\. \`Product\_Source\_of\_Truth\`  
2\. \`Conversation\_Blueprint\_Package\`  
3\. \`Report\_Data\_Model\`  
4\. \`Portfolio\_Knowledge\_Index\`  
5\. \`Final\_Portfolio\_Agent\_System\_Prompt\`  
6\. \`Agent\_Architecture\_and\_Runtime\_Orchestration\`  
7\. \`Runtime\_Data\_Logging\_and\_Persistence\_Schema\`  
8\. \`Edge\_Case\_Error\_and\_QA\_Test\_Pack\`

Where this document conflicts with an approved product, architecture, privacy, persistence, evidence, or QA decision, the earlier canonical source remains authoritative unless the conflict is explicitly resolved.

\---

\# 2\. Implementation Principles

\#\# 2.1 Approved principles

\* One user-facing conversation agent.  
\* Internal deterministic orchestration around distinct task modes.  
\* One continuous conversation surface.  
\* The same report-generation path must serve both UI-triggered and conversational requests.  
\* A report requires a valid role input and explicit user confirmation.  
\* No fit analysis may be shown before confirmation.  
\* Maximum of two successfully completed reports per session.  
\* Blocked, invalid, failed, or insufficient-evidence outcomes do not consume the report limit.  
\* A third report request must be blocked before any model call.  
\* No report may be generated when there is no meaningful fit.  
\* No report may be generated when approved evidence is insufficient.  
\* Retrieval and evidence-verification failures block report generation.  
\* Logging failure alone does not block a valid report.  
\* Persistence failure must be disclosed; the report must not be presented as saved.  
\* Original job-description text must never be stored.  
\* Temporary Role Snapshot data remains ephemeral.  
\* Contact details are stored only after explicit contact-form submission.  
\* The Contact CTA must not imply confirmed fit.  
\* Prompt injection embedded in a job description must be ignored.  
\* Repeated manipulation or forced-fit attempts should receive a short boundary, not a debate.  
\* Severe abuse may end without a Contact CTA.

\#\# 2.2 Implementation recommendations

\* Prefer a modular monolith over multiple deployed agents or services.  
\* Keep orchestration deterministic in application code.  
\* Use the language model for interpretation, extraction, synthesis, and grounded answer generation—not for workflow control.  
\* Use static approved knowledge files for MVP retrieval.  
\* Use a predefined report UI populated from validated structured JSON.  
\* Make failure states visible and testable.  
\* Keep every demo-critical dependency replaceable by a local or static fallback.

\#\# 2.3 Assumptions

\* The existing portfolio website already contains or will contain the required case-study pages and evidence anchors.  
\* The report UI design or a sufficiently complete visual reference already exists.  
\* The canonical knowledge files are approved and do not require new content research.  
\* Authentication is not required for the public MVP.  
\* A session is represented by a generated \`conversationId\`.  
\* The MVP may use a managed database free tier or a lightweight equivalent.  
\* The implementation environment supports server-side API routes or serverless functions.  
\* The primary demo language can be English even if selected supporting UI content is bilingual.

\---

\# 3\. Critical Gaps Identified Before Implementation

These are not product redesign questions. They are implementation decisions that must be fixed to avoid runtime inconsistency.

\#\# 3.1 Session timeout enforcement

The approved runtime specifies a 24-hour idle timeout, but the implementation must define where it is enforced.

\*\*Required decision:\*\*  
Enforce expiry server-side based on \`lastActivityAt\`. The frontend may display the expiry state, but must not be the authority.

\*\*Required behaviour after expiry:\*\*

\* Generate a new \`conversationId\`.  
\* Reset successful report count.  
\* Do not restore ephemeral Role Snapshot data.  
\* Previously saved report URLs may remain viewable if implemented.  
\* Do not silently continue an expired report-analysis state.

\#\# 3.2 Meaningful-fit blocking logic

“No meaningful fit” is approved, but it must not remain a vague model judgement.

\*\*Required implementation rule:\*\*  
The model may recommend a blocked outcome, but the result must be returned through a constrained schema containing:

\* recognised role needs;  
\* available approved evidence;  
\* material overlap;  
\* material gaps;  
\* evidence sufficiency;  
\* recommended outcome.

The application validates that the outcome is one of:

\* \`report\_allowed\`  
\* \`blocked\_no\_meaningful\_fit\`  
\* \`blocked\_insufficient\_evidence\`

A narrative answer alone is not sufficient.

\#\# 3.3 Evidence sufficiency threshold

A report cannot be created when evidence is insufficient, but the minimum requirement must be deterministic enough to test.

\*\*MVP recommendation:\*\*  
A report is allowed only when:

\* at least one meaningful role requirement is supported by approved evidence;  
\* the overall conclusion is supported by at least two distinct approved evidence references;  
\* every positive report claim has at least one valid evidence reference;  
\* unsupported requirements are explicitly represented as gaps or unknowns;  
\* evidence references resolve successfully against the Knowledge Index.

This is a quality gate, not a numerical fit score.

\#\# 3.4 Report “saved” versus “generated”

The UI must distinguish:

\* generated and saved;  
\* generated but not saved;  
\* generation failed;  
\* generation blocked.

These must not share the same success screen.

\#\# 3.5 Contact destination

The runtime behaviour references a Contact page, but implementation requires one canonical destination.

\*\*Required MVP mapping:\*\*  
All Contact CTAs route to one portfolio Contact page. No inline lead form is required inside the chat unless it already exists and is approved.

\#\# 3.6 Evidence-link anchors

The architecture requires links to exact evidence sections. Generic case-study links are not sufficient for the final evidence behaviour.

\*\*Required before demo:\*\*  
Each evidence record used in reports must contain:

\* case-study identifier;  
\* section identifier;  
\* human-readable section label;  
\* public URL;  
\* stable anchor or route fragment;  
\* optional return-context parameters.

Missing anchors are a demo blocker for evidence-navigation claims.

\#\# 3.7 Model-output repair

Structured model output can fail even with schemas.

\*\*Required behaviour:\*\*

1\. Validate output.  
2\. Attempt one deterministic or model-assisted schema repair.  
3\. If repair fails, return a controlled generation failure.  
4\. Do not render partial malformed report data.  
5\. Do not consume the report limit.

\#\# 3.8 Idempotency

A double click, browser retry, or repeated network request could create duplicate reports.

\*\*Required implementation:\*\*  
Every generation request must carry an \`idempotencyKey\`. Repeated requests with the same key must return the same completed result or current processing state and must not create a second report.

\---

\# 4\. MVP Scope Classification

\#\# 4.1 Must Have

\* Conversation surface.  
\* Free-text input.  
\* Upload-job and paste-job entry actions.  
\* Role-input validation.  
\* Prompt-injection sanitisation and instruction isolation.  
\* Role Snapshot extraction.  
\* Explicit report confirmation.  
\* Shared \`requestReport()\` path.  
\* Two-successful-report limit.  
\* Deterministic orchestration.  
\* Retrieval from approved knowledge files.  
\* Evidence-reference verification.  
\* Structured report generation.  
\* Report schema validation.  
\* Report UI populated from structured JSON.  
\* No-fit and insufficient-evidence blocked states.  
\* Report-specific follow-up questions.  
\* Evidence links to case-study sections.  
\* Contact CTA.  
\* Session state.  
\* Runtime logging.  
\* Report and Normalized Role Summary persistence.  
\* Explicit handling of persistence failure.  
\* QA coverage for critical and high-severity cases.  
\* Demo fallback assets.

\#\# 4.2 Should Have

\* Upload support for PDF, DOCX, TXT, and image-based job descriptions.  
\* Streaming response text for general Q\&A.  
\* Visual degraded-mode indicator for non-critical logging failure.  
\* Report history during the active session.  
\* Return-to-report context after visiting a case study.  
\* Mobile-optimised report navigation.  
\* Basic operational dashboard or database view for logs.  
\* Downloadable report.  
\* Retry UI for recoverable generation failures.  
\* Lightweight analytics around report funnel stages.

\#\# 4.3 Deferred

\* Learning from report follow-up conversations.  
\* Automatic prompt or scoring optimisation.  
\* Recruiter accounts.  
\* Cross-device session restoration.  
\* Long-term conversation memory.  
\* Personalised portfolio rewriting based on the role.  
\* CV generation or adaptation.  
\* Automated email follow-up.  
\* Multi-language gender-personalisation engine.  
\* Embedding-based vector infrastructure if static or indexed retrieval is sufficient.  
\* Advanced monitoring platform.  
\* Automated report comparison.  
\* More than two reports per session.  
\* Hidden numeric fit score.  
\* Complex multi-agent deployment.  
\* Full admin console.  
\* Automatic recovery from every third-party outage.

\---

\# 5\. Recommended MVP Technical Shape

\#\# 5.1 Frontend

Recommended shape:

\* Existing portfolio application.  
\* One chat or conversation component.  
\* One report template component.  
\* One role-input component supporting paste and file upload.  
\* One session-state store.  
\* One API client layer.  
\* One error-state system.  
\* Existing case-study routes with evidence anchors.  
\* Existing Contact page.

\#\# 5.2 Backend

Recommended shape:

\* Server-side API routes or serverless functions.  
\* A single orchestration service.  
\* Input-validation service.  
\* Role-normalisation service.  
\* Retrieval service.  
\* Evidence-verification service.  
\* Report-generation service.  
\* Report-follow-up service.  
\* Persistence adapter.  
\* Runtime logger.

These should be logical modules, not separately deployed services.

\#\# 5.3 Model layer

The model is used for:

\* job-description classification;  
\* role requirement extraction;  
\* semantic mapping between role needs and approved portfolio evidence;  
\* qualitative report synthesis;  
\* grounded report follow-up;  
\* portfolio Q\&A.

The model must not control:

\* report-count enforcement;  
\* session expiry;  
\* storage policy;  
\* whether original job-description text is persisted;  
\* API routing;  
\* evidence URL validity;  
\* idempotency;  
\* retry limits;  
\* CTA routing.

\#\# 5.4 Storage

Minimum persistent entities:

\* \`Session\`  
\* \`NormalizedRoleSummary\`  
\* \`StoredReport\`  
\* \`ReportEvidenceReference\`  
\* \`RuntimeEvent\`  
\* \`Lead\`, only after explicit form submission

Ephemeral only:

\* original job-description text;  
\* uploaded file buffer;  
\* OCR output;  
\* Temporary Role Snapshot;  
\* intermediate retrieval candidates;  
\* unapproved model reasoning;  
\* schema-repair prompts.

\---

\# 6\. Full Build Task List

\#\# Workstream A — Repository and Environment

\#\#\# A1. Confirm application structure

\*\*Scope:\*\* Identify frontend framework, backend/runtime capability, build command, deployment target, and environment-variable handling.

\*\*Dependencies:\*\* None.

\*\*Definition of Done:\*\*

\* Local application runs.  
\* Production build succeeds.  
\* API routes or server-side functions are available.  
\* Environment variables are documented.  
\* No secret is exposed in frontend code.

\#\#\# A2. Create environment configuration

Required variables may include:

\* model provider API key;  
\* database URL;  
\* database service key or server credential;  
\* public portfolio base URL;  
\* logging mode;  
\* demo fallback flag.

\*\*Definition of Done:\*\*

\* \`.env.example\` exists.  
\* Required versus optional variables are documented.  
\* Missing variables produce clear startup or runtime errors.  
\* Secrets are excluded from source control.

\#\#\# A3. Create feature flags

Minimum flags:

\* \`USE\_MOCK\_MODEL\`  
\* \`USE\_MOCK\_RETRIEVAL\`  
\* \`USE\_MOCK\_STORAGE\`  
\* \`ENABLE\_REPORT\_DOWNLOAD\`  
\* \`ENABLE\_RUNTIME\_LOGGING\`  
\* \`DEMO\_SAFE\_MODE\`

\*\*Definition of Done:\*\*

\* Flags are server-controlled where necessary.  
\* Mock mode cannot accidentally be presented as live production mode.  
\* Demo-safe mode is documented.

\---

\#\# Workstream B — Canonical Data and Knowledge Preparation

\#\#\# B1. Package canonical knowledge files

\*\*Scope:\*\* Make the approved CV, general profile, case studies, and Knowledge Index readable by the runtime.

\*\*Definition of Done:\*\*

\* Every knowledge file has a stable identifier.  
\* Every case study has a version.  
\* Every evidence section has a stable section identifier.  
\* The runtime can load all files without manual editing.  
\* No unapproved draft is included.

\#\#\# B2. Create evidence manifest

Minimum fields:

\* \`evidenceId\`  
\* \`sourceType\`  
\* \`sourceId\`  
\* \`sourceVersion\`  
\* \`sectionId\`  
\* \`sectionLabel\`  
\* \`claimTypes\`  
\* \`publicUrl\`  
\* \`anchor\`  
\* \`approved\`  
\* \`confidentialityLevel\`

\*\*Definition of Done:\*\*

\* Every reportable evidence item exists in the manifest.  
\* URLs resolve.  
\* Anchors reach the intended section.  
\* Unapproved items cannot be retrieved.  
\* Confidential evidence is excluded from public report output.

\#\#\# B3. Create retrieval-ready chunks

\*\*Recommendation:\*\* Use curated JSON or Markdown chunks rather than adding a vector database unless retrieval quality requires it.

\*\*Definition of Done:\*\*

\* Each chunk is semantically coherent.  
\* Each chunk contains evidence metadata.  
\* Chunks do not separate claims from their qualifiers.  
\* Retrieval can filter by approval state and source type.  
\* A deterministic fallback search is available.

\#\#\# B4. Create test job-description fixtures

Required fixture categories:

\* strong fit;  
\* good fit;  
\* partial fit;  
\* no meaningful fit;  
\* insufficient evidence;  
\* incomplete role;  
\* irrelevant content;  
\* prompt injection;  
\* oversized input;  
\* third report request.

\*\*Definition of Done:\*\*

\* Fixtures are stored outside production persistence.  
\* Expected outcome is documented for each fixture.  
\* No fixture contains sensitive real applicant data.

\---

\#\# Workstream C — Session and Conversation Runtime

\#\#\# C1. Implement session creation

Minimum session fields:

\* \`conversationId\`  
\* \`createdAt\`  
\* \`lastActivityAt\`  
\* \`status\`  
\* \`successfulReportCount\`  
\* \`activeReportId\`  
\* \`conversationState\`

\*\*Definition of Done:\*\*

\* A session is created on first meaningful interaction.  
\* The same session is reused while active.  
\* Session IDs are not predictable.  
\* Successful report count starts at zero.

\#\#\# C2. Implement 24-hour idle expiry

\*\*Definition of Done:\*\*

\* Expiry is enforced server-side.  
\* Expired sessions cannot generate a report.  
\* Expired Role Snapshot data is unavailable.  
\* A new session may be created cleanly.  
\* The frontend shows a clear restart message.

\#\#\# C3. Implement conversation state machine

Minimum states:

\* \`idle\`  
\* \`general-portfolio-qa\`  
\* \`awaiting-role-input\`  
\* \`validating-role-input\`  
\* \`role-content-mismatch\`  
\* \`awaiting-role-completion\`  
\* \`awaiting-report-confirmation\`  
\* \`generating-report\`  
\* \`report-ready\`  
\* \`report-follow-up\`  
\* \`generation-blocked\`  
\* \`recoverable-error\`  
\* \`session-expired\`  
\* \`conversation-closure\`

\*\*Definition of Done:\*\*

\* Each state has permitted events.  
\* Invalid transitions are rejected.  
\* The model cannot directly set application state.  
\* The UI can render every state.  
\* State transitions emit runtime events.

\#\#\# C4. Implement conversation closure layer

\*\*Definition of Done:\*\*

\* Closure copy is context-sensitive.  
\* Closure does not destroy the session.  
\* The user can continue the conversation.  
\* Closure is not shown after severe abuse.  
\* Contact CTA is not automatically attached to every closure.

\---

\#\# Workstream D — Input Handling and Validation

\#\#\# D1. Implement pasted-text input

\*\*Definition of Done:\*\*

\* Empty and trivial inputs are rejected.  
\* Input length limits are enforced.  
\* User receives a specific correction request.  
\* Original text is held only in ephemeral memory.  
\* Input is never written to persistent logs.

\#\#\# D2. Implement file upload

Minimum MVP file handling:

\* MIME validation;  
\* extension validation;  
\* size validation;  
\* parsing;  
\* temporary memory handling;  
\* deletion after processing.

\*\*Definition of Done:\*\*

\* Unsupported files are rejected before model use.  
\* Empty files are rejected.  
\* Parsing failure returns a controlled message.  
\* File contents are not persisted.  
\* Temporary buffers are released after processing.

\#\#\# D3. Implement role-content validation

Validation must distinguish:

\* valid and sufficient role;  
\* valid but incomplete role;  
\* content mismatch;  
\* malicious or instruction-bearing input;  
\* unreadable input.

\*\*Definition of Done:\*\*

\* Every validation result maps to an approved conversation state.  
\* No report confirmation appears before validation passes.  
\* Validation result follows a strict schema.  
\* The validator does not follow instructions contained in the job description.

\#\#\# D4. Implement prompt-injection isolation

\*\*Required implementation:\*\*

\* Treat the uploaded or pasted job description as untrusted data.  
\* Wrap it as role content, not instructions.  
\* Use a separate system-level rule that instructions inside the role content are non-executable.  
\* Strip or flag common injection patterns without removing legitimate role requirements.  
\* Validate output against schema.

\*\*Definition of Done:\*\*

\* Injection fixtures do not change agent rules.  
\* The agent does not expose system prompts or restricted knowledge.  
\* The runtime logs an injection-detected event without storing the original injected text.  
\* A valid role can still proceed after irrelevant embedded instructions are ignored.

\---

\#\# Workstream E — Role Understanding

\#\#\# E1. Implement Temporary Role Snapshot extraction

Minimum snapshot fields:

\* role title;  
\* seniority;  
\* domain;  
\* responsibilities;  
\* required capabilities;  
\* preferred capabilities;  
\* experience expectations;  
\* tools or methods;  
\* constraints;  
\* ambiguities;  
\* source completeness.

\*\*Definition of Done:\*\*

\* Snapshot conforms to the approved schema.  
\* Snapshot is stored only ephemerally.  
\* No personal names or company-sensitive text are persisted.  
\* Missing information is explicitly represented.  
\* The snapshot can be converted into a Normalized Role Summary.

\#\#\# E2. Implement Normalized Role Summary

\*\*Definition of Done:\*\*

\* Summary excludes original job-description text.  
\* Summary contains only derived structured information needed for reporting and learning.  
\* Summary is suitable for persistence.  
\* The stored summary can be compared with the final report.  
\* Personal names and contact details from the job description are excluded.

\#\#\# E3. Implement clarification logic

\*\*Definition of Done:\*\*

\* Only material missing information triggers clarification.  
\* The agent asks one useful question at a time.  
\* A maximum clarification rule is enforced.  
\* The user can replace the role input.  
\* The system does not repeatedly debate role validity.

\---

\#\# Workstream F — Report Request Control

\#\#\# F1. Implement shared \`requestReport()\` path

All report requests must enter through the same application function regardless of whether they originate from:

\* upload action;  
\* paste action;  
\* chat request;  
\* report CTA;  
\* retry action.

\*\*Definition of Done:\*\*

\* There is one report eligibility gate.  
\* All request sources produce the same validation behaviour.  
\* Report count is checked before model calls.  
\* Confirmation state is checked before model calls.  
\* Duplicate requests are idempotent.

\#\#\# F2. Implement explicit confirmation

\*\*Definition of Done:\*\*

\* The system summarises what role it understood.  
\* The user must explicitly approve report generation.  
\* No report generation begins through implied consent.  
\* Editing the role invalidates the previous confirmation.  
\* Confirmation is associated with a specific role snapshot.

\#\#\# F3. Implement two-report limit

\*\*Definition of Done:\*\*

\* Only successfully completed reports increment the count.  
\* Blocked and failed attempts do not increment it.  
\* The third report request is blocked before retrieval or model use.  
\* The UI explains the limit briefly.  
\* The block cannot be bypassed through an alternate UI action.

\#\#\# F4. Implement retry limits

\*\*Approved rule:\*\* Two retries after the initial generation attempt per role snapshot.

\*\*Definition of Done:\*\*

\* Retry count is tied to the same role snapshot.  
\* Editing the role creates a new snapshot and resets retry count.  
\* Automatic schema repair does not count as a user retry.  
\* Failed retries do not consume the successful-report limit.  
\* Retry exhaustion returns a controlled fallback.

\---

\#\# Workstream G — Retrieval and Evidence

\#\#\# G1. Implement query construction

Input:

\* Normalized Role Summary;  
\* role capabilities;  
\* seniority;  
\* domain;  
\* responsibilities.

Output:

\* retrieval queries;  
\* filters;  
\* desired evidence categories.

\*\*Definition of Done:\*\*

\* Queries exclude original raw text where unnecessary.  
\* Retrieval is constrained to approved sources.  
\* Query construction is logged without storing the original role text.  
\* Queries support synonyms and adjacent terminology.

\#\#\# G2. Implement approved-source retrieval

\*\*Definition of Done:\*\*

\* Only approved knowledge files are searchable.  
\* Retrieval results contain source metadata.  
\* Retrieval can distinguish CV, profile, and case-study evidence.  
\* Empty retrieval returns a controlled insufficient-evidence result.  
\* Retrieval failure blocks report generation.

\#\#\# G3. Implement evidence verification

For every candidate evidence item, verify:

\* approved source;  
\* valid source version;  
\* valid evidence ID;  
\* accessible public URL where required;  
\* claim supported by the source content;  
\* confidentiality rules;  
\* no invented metric or outcome.

\*\*Definition of Done:\*\*

\* Invalid evidence is removed.  
\* Verification failure is distinguishable from no evidence.  
\* Report generation receives only verified evidence.  
\* Failure of the verification service blocks report creation.  
\* Every positive conclusion can be traced to verified evidence.

\#\#\# G4. Implement evidence-sufficiency gate

\*\*Definition of Done:\*\*

\* The gate runs before report synthesis.  
\* It returns an explicit reason.  
\* It distinguishes no meaningful fit from insufficient evidence.  
\* It does not create a limited pseudo-report when the approved outcome is blocked.  
\* The outcome is logged without storing the original role text.

\---

\#\# Workstream H — Report Generation

\#\#\# H1. Implement structured report prompt

The prompt must include:

\* approved system constraints;  
\* Normalized Role Summary;  
\* verified evidence only;  
\* required report schema;  
\* forbidden claims;  
\* fit-state vocabulary;  
\* no numeric score;  
\* required gap representation;  
\* blocked-outcome rules.

\*\*Definition of Done:\*\*

\* Output is requested as structured JSON.  
\* The model cannot introduce unsupported evidence IDs.  
\* The prompt states that absence of evidence is not negative evidence.  
\* The prompt distinguishes fact, interpretation, and unknown.  
\* The prompt does not receive unnecessary confidential source content.

\#\#\# H2. Implement report schema validation

\*\*Definition of Done:\*\*

\* Required fields are validated.  
\* Enum values are validated.  
\* Evidence IDs are cross-checked.  
\* Unsupported fields are rejected or stripped.  
\* A malformed report is never rendered.  
\* One repair attempt is supported.

\#\#\# H3. Implement report business-rule validation

Checks include:

\* fit state is approved;  
\* no numeric score;  
\* no unsupported positive claim;  
\* no invented metric;  
\* no confidential detail;  
\* no missing evidence reference for positive findings;  
\* no contradictory overall conclusion;  
\* CTA wording does not imply confirmed fit.

\*\*Definition of Done:\*\*

\* Business-rule failure blocks publication.  
\* Validation errors are logged.  
\* Failed publication does not increment report count.  
\* The user receives a recoverable or final error state.

\#\#\# H4. Persist successful report

Order of operations:

1\. Generate.  
2\. Validate.  
3\. Assign report ID.  
4\. Persist Normalized Role Summary.  
5\. Persist report and evidence references.  
6\. Mark generation successful.  
7\. Increment successful report count.  
8\. Return response with persistence status.

\*\*Definition of Done:\*\*

\* Duplicate requests do not duplicate records.  
\* Report count increments once.  
\* Persistence failure is returned explicitly.  
\* The runtime does not claim the report was saved when it was not.  
\* Original job-description text is absent from storage.

\#\#\# H5. Implement generated-but-unsaved state

\*\*Definition of Done:\*\*

\* The report can still be displayed when generation succeeded but storage failed, if technically available in the current response.  
\* The UI clearly states that it was not saved.  
\* The report limit policy for this case is explicit.

\*\*Required implementation decision:\*\*  
A fully generated and presented report should count toward the two-report limit even if persistence fails, because the user received the report. The count must therefore be held in active session state even when durable report storage fails.

This closes an important ambiguity between “successfully completed report” and “successfully persisted report.”

\---

\#\# Workstream I — Report UI

\#\#\# I1. Implement report template

The report must render from structured data, not generated HTML.

\*\*Definition of Done:\*\*

\* Optional sections collapse without leaving empty gaps.  
\* Fit state is qualitative.  
\* Evidence links are visible.  
\* Gaps and unknowns are distinct.  
\* Loading, blocked, error, unsaved, and ready states are supported.  
\* Mobile layout is usable.

\#\#\# I2. Implement three qualitative fit states

Approved visible states:

\* Strong Fit  
\* Good Fit  
\* Partial Fit

\*\*Definition of Done:\*\*

\* Labels match the canonical report model.  
\* No percentage is displayed.  
\* Visual treatment does not imply scientific precision.  
\* The state is accompanied by a grounded explanation.

\#\#\# I3. Implement evidence cards or references

\*\*Definition of Done:\*\*

\* Each reference identifies the relevant case study or source.  
\* Links reach the correct section.  
\* Link labels explain what the evidence demonstrates.  
\* Broken links are caught before demo.  
\* Return context is preserved where feasible.

\#\#\# I4. Implement blocked-outcome UI

Separate states:

\* no meaningful fit;  
\* insufficient approved evidence;  
\* third-report limit;  
\* invalid input;  
\* generation unavailable.

\*\*Definition of Done:\*\*

\* Blocked states are not rendered inside the report template.  
\* They do not resemble a completed report.  
\* They offer only approved next steps.  
\* Contact CTA wording remains neutral.

\---

\#\# Workstream J — Report Follow-up

\#\#\# J1. Bind follow-up to active report

\*\*Definition of Done:\*\*

\* Follow-up includes a specific \`reportId\`.  
\* The agent does not merge evidence from another report unless explicitly requested and supported.  
\* Switching reports updates the active context.  
\* Missing or invalid report IDs return a controlled state.

\#\#\# J2. Implement grounded report Q\&A

The model receives:

\* stored report;  
\* associated Normalized Role Summary;  
\* referenced approved evidence;  
\* user question;  
\* follow-up system rules.

\*\*Definition of Done:\*\*

\* Answers stay within report and approved evidence.  
\* The agent distinguishes report interpretation from source facts.  
\* Unsupported questions receive a transparent limitation.  
\* Follow-up does not modify the stored report.  
\* Follow-up conversation is not used for MVP learning.

\#\#\# J3. Implement manipulation boundary

\*\*Definition of Done:\*\*

\* Repeated demands to change the fit result receive a brief boundary.  
\* The agent does not repeatedly defend or debate.  
\* The user may be redirected to the Contact page when appropriate.  
\* The CTA does not imply fit.  
\* Severe abuse may end without CTA.

\---

\#\# Workstream K — General Portfolio Q\&A

\#\#\# K1. Implement portfolio-question classification

\*\*Definition of Done:\*\*

\* General portfolio questions do not enter report flow.  
\* A role-analysis request transitions to role-input flow.  
\* Restricted-information requests are identified.  
\* Ambiguous requests receive one clarification.

\#\#\# K2. Implement grounded portfolio answers

\*\*Definition of Done:\*\*

\* Answers use only approved knowledge.  
\* The agent does not invent metrics or confidential details.  
\* Relevant case-study links are included where useful.  
\* Missing evidence is stated transparently.  
\* The system prompt remains authoritative.

\---

\#\# Workstream L — Storage and Persistence

\#\#\# L1. Implement database schema

Minimum tables or equivalent collections:

\* sessions;  
\* normalized\_role\_summaries;  
\* reports;  
\* report\_evidence\_references;  
\* runtime\_events;  
\* leads.

\*\*Definition of Done:\*\*

\* Schema matches approved data contracts.  
\* Foreign-key relationships or equivalent integrity rules exist.  
\* Original job-description fields do not exist.  
\* Retention fields are present.  
\* Timestamps are consistent.

\#\#\# L2. Implement retention behaviour

Approved defaults:

\* reports: 12 months;  
\* Normalized Role Summaries: 12 months;  
\* leads: 12 months;  
\* runtime logs: 30 days.

\*\*Definition of Done:\*\*

\* Records contain expiry or retention metadata.  
\* A deletion mechanism is documented.  
\* Demo data can be removed.  
\* Retention is not falsely described as automatically enforced if only documented for MVP.

\#\#\# L3. Implement persistence adapter

\*\*Definition of Done:\*\*

\* Application code does not depend directly on one database implementation.  
\* Storage errors are normalised.  
\* Mock storage can be substituted.  
\* Sensitive data is redacted before logging.

\#\#\# L4. Implement lead storage

\*\*Definition of Done:\*\*

\* Leads are created only after explicit submission.  
\* Contact details are not inferred from the job description.  
\* Source CTA and timestamp are recorded.  
\* Failure is disclosed to the user.  
\* Severe-abuse sessions do not automatically create leads.

\---

\#\# Workstream M — Logging and Runtime Events

\#\#\# M1. Implement event logger

Events should include:

\* session created;  
\* session expired;  
\* role input received;  
\* input rejected;  
\* validation completed;  
\* injection detected;  
\* clarification requested;  
\* report confirmed;  
\* report limit blocked;  
\* retrieval started/completed/failed;  
\* evidence verification failed;  
\* report generation started/completed/failed;  
\* schema repair attempted;  
\* persistence completed/failed;  
\* report opened;  
\* evidence link clicked;  
\* follow-up asked;  
\* contact CTA shown;  
\* contact CTA clicked;  
\* lead submitted.

\*\*Definition of Done:\*\*

\* Events use the approved schema.  
\* No original job-description text is logged.  
\* Error details are sanitised.  
\* Events include correlation identifiers.  
\* Logging failure can be handled without blocking a valid report.

\#\#\# M2. Implement degraded logging mode

\*\*Definition of Done:\*\*

\* Logging failure is detected.  
\* Core generation can continue.  
\* The user is not shown unnecessary internal detail.  
\* The system avoids repeatedly calling a failed logging service.  
\* Critical runtime errors may use a local console or minimal fallback log where available.

\#\#\# M3. Implement correlation

Required identifiers:

\* \`conversationId\`  
\* \`roleSnapshotId\`  
\* \`reportRequestId\`  
\* \`reportId\`  
\* \`idempotencyKey\`

\*\*Definition of Done:\*\*

\* One user flow can be traced across services.  
\* Correlation does not require raw user content.  
\* IDs are available in internal QA logs.  
\* IDs are not unnecessarily exposed in the public UI.

\---

\#\# Workstream N — API and Data Contracts

\#\#\# N1. Define API endpoints

Recommended endpoints:

\* \`POST /api/session\`  
\* \`POST /api/role/validate\`  
\* \`POST /api/role/normalise\`  
\* \`POST /api/report/confirm\`  
\* \`POST /api/report/generate\`  
\* \`POST /api/report/follow-up\`  
\* \`GET /api/report/:reportId\`  
\* \`POST /api/contact\`  
\* \`POST /api/runtime-event\`, if logging is not internal

\*\*Definition of Done:\*\*

\* Every endpoint has request and response schemas.  
\* Authentication requirements are explicit.  
\* Error responses are normalised.  
\* Raw job-description content is accepted only by ephemeral-processing endpoints.

\#\#\# N2. Define standard response envelope

Recommended fields:

\* \`success\`  
\* \`status\`  
\* \`data\`  
\* \`error\`  
\* \`warnings\`  
\* \`persistenceStatus\`  
\* \`conversationState\`  
\* \`correlationId\`

\*\*Definition of Done:\*\*

\* Frontend handles the same envelope consistently.  
\* Blocked outcomes are not represented as technical errors.  
\* Recoverable and non-recoverable errors are distinguishable.

\#\#\# N3. Implement server-side schema validation

\*\*Definition of Done:\*\*

\* All incoming requests are validated.  
\* All model responses are validated.  
\* Invalid client state is rejected.  
\* Unknown fields do not silently alter behaviour.  
\* Validation errors are safe to display.

\#\#\# N4. Implement rate and concurrency protection

\*\*MVP recommendation:\*\*

\* prevent simultaneous generation for one session;  
\* disable duplicate UI submission;  
\* use idempotency keys;  
\* apply basic per-session request throttling.

\*\*Definition of Done:\*\*

\* Two simultaneous clicks do not create two reports.  
\* A generating session receives the current state.  
\* Basic abuse does not trigger uncontrolled model calls.

\---

\# 7\. Frontend Implementation Mapping

| Product capability  | Frontend component             | Data source                    | Main states                               |  
| \------------------- | \------------------------------ | \------------------------------ | \----------------------------------------- |  
| Portfolio Q\&A       | Conversation panel             | Chat API                       | idle, answering, error                    |  
| Role upload         | File input or upload chip      | Role validation API            | empty, uploading, invalid, parsed         |  
| Role paste          | Paste modal or inline composer | Role validation API            | empty, validating, valid, incomplete      |  
| Role summary        | Confirmation card              | Temporary Role Snapshot        | review, edit, confirm                     |  
| Report generation   | Progress component             | Report API                     | queued, retrieving, verifying, generating |  
| Fit report          | Structured report template     | Stored or returned report JSON | ready, unsaved                            |  
| Blocked outcome     | Dedicated result card          | Eligibility or evidence gate   | no fit, insufficient evidence, limit      |  
| Follow-up           | Report-bound chat context      | Follow-up API                  | answering, unsupported, error             |  
| Evidence navigation | Evidence card/link             | Evidence manifest              | available, broken                         |  
| Contact CTA         | CTA component                  | Static route                   | shown, clicked                            |  
| Session expiry      | Session message                | Session API                    | active, expired                           |  
| Runtime failure     | Error-state component          | API envelope                   | retryable, final                          |

\---

\# 8\. Backend Implementation Mapping

| Module                     | Responsibility                           | Must remain deterministic                     |  
| \-------------------------- | \---------------------------------------- | \--------------------------------------------- |  
| Session Manager            | Create, update, expire sessions          | Yes                                           |  
| Input Parser               | Parse text and files                     | Yes                                           |  
| Validation Controller      | Route validation outcomes                | Yes                                           |  
| Role Understanding Service | Produce structured role snapshot         | Schema-constrained                            |  
| Report Eligibility Gate    | Check confirmation, count, fit, evidence | Yes                                           |  
| Retrieval Service          | Find approved evidence                   | Yes, except semantic ranking                  |  
| Evidence Verifier          | Confirm support and valid metadata       | Yes with model-assisted claim check if needed |  
| Report Generator           | Produce structured qualitative report    | Model-assisted                                |  
| Report Validator           | Validate schema and business rules       | Yes                                           |  
| Follow-up Service          | Answer report-bound questions            | Model-assisted                                |  
| Persistence Adapter        | Store approved entities                  | Yes                                           |  
| Runtime Logger             | Emit sanitised events                    | Yes                                           |  
| CTA Router                 | Return approved Contact destination      | Yes                                           |

\---

\# 9\. Mocked Versus Real MVP Components

\#\# 9.1 Must be real

The following must work with actual runtime behaviour because they demonstrate the project’s core value:

\* free-text portfolio Q\&A;  
\* job-description validation;  
\* Role Snapshot extraction;  
\* explicit report confirmation;  
\* two-report limit;  
\* approved-evidence retrieval;  
\* evidence verification;  
\* structured qualitative report generation;  
\* report data validation;  
\* rendered report;  
\* grounded report follow-up;  
\* evidence links;  
\* failure-state handling;  
\* original job-description non-persistence;  
\* report persistence or explicit unsaved state;  
\* basic runtime events.

\#\# 9.2 Safe to mock or simplify

\* sophisticated vector search;  
\* automatic retention deletion job;  
\* operational analytics dashboard;  
\* email delivery;  
\* downloadable PDF, if browser print is sufficient;  
\* full multi-device persistence;  
\* automatic learning loop;  
\* advanced monitoring;  
\* production-grade OCR;  
\* advanced abuse detection;  
\* multilingual personalisation;  
\* real recruiter CRM;  
\* complex admin interface.

\#\# 9.3 Must not be deceptively mocked

The demo must not imply the following are real if they are not:

\* report persistence;  
\* exact evidence retrieval;  
\* database logging;  
\* contact submission;  
\* file parsing;  
\* live model generation.

A mocked component should be labelled internally and documented in the handoff. Public demo labelling depends on presentation context, but the presenter must not claim production behaviour that does not exist.

\---

\# 10\. Build Sequence

\#\# Phase 1 — Freeze inputs

1\. Confirm canonical source files.  
2\. Freeze report schema.  
3\. Freeze runtime event names.  
4\. Freeze API envelopes.  
5\. Freeze evidence manifest.  
6\. Confirm Contact URL.  
7\. Confirm case-study anchors.

\*\*Gate:\*\* No implementation begins against unnamed or unstable contracts.

\#\# Phase 2 — Build deterministic skeleton

1\. Session manager.  
2\. State machine.  
3\. API envelopes.  
4\. report-count enforcement.  
5\. explicit confirmation.  
6\. idempotency.  
7\. mock report response.  
8\. frontend state rendering.

\*\*Gate:\*\* Entire flow works with mock data before live model integration.

\#\# Phase 3 — Integrate role validation

1\. Text input.  
2\. File parsing.  
3\. role-content validation.  
4\. Temporary Role Snapshot.  
5\. clarification.  
6\. Normalized Role Summary.

\*\*Gate:\*\* Valid, incomplete, irrelevant, malicious, and unreadable inputs route correctly.

\#\# Phase 4 — Integrate retrieval and evidence

1\. Knowledge loader.  
2\. retrieval chunks.  
3\. retrieval queries.  
4\. evidence verification.  
5\. sufficiency gate.  
6\. evidence links.

\*\*Gate:\*\* Every retrieved claim resolves to an approved source and valid section.

\#\# Phase 5 — Integrate report generation

1\. structured generation prompt;  
2\. schema validation;  
3\. business-rule validation;  
4\. repair attempt;  
5\. report rendering;  
6\. persistence;  
7\. report count update.

\*\*Gate:\*\* Strong, Good, Partial, no-fit, and insufficient-evidence cases behave correctly.

\#\# Phase 6 — Integrate follow-up and Contact CTA

1\. bind report context;  
2\. grounded follow-up;  
3\. manipulation boundaries;  
4\. evidence navigation;  
5\. Contact CTA;  
6\. conversation closure.

\*\*Gate:\*\* Follow-up never escapes approved evidence or changes the report.

\#\# Phase 7 — Logging, failure handling, and QA

1\. event logger;  
2\. degraded mode;  
3\. persistence failure;  
4\. retrieval failure;  
5\. model failure;  
6\. storage failure;  
7\. session expiry;  
8\. critical QA suite.

\*\*Gate:\*\* All Critical and High cases pass before the demo.

\---

\# 11\. Required Assets and Setup

\#\# 11.1 Content assets

\* approved CV Knowledge file;  
\* approved General Profile Knowledge file;  
\* five approved Case Study Knowledge files;  
\* \`Portfolio\_Knowledge\_Index\`;  
\* approved system prompt;  
\* report copy labels;  
\* validation and error messages;  
\* Contact CTA copy;  
\* case-study URLs and anchors.

\#\# 11.2 Design assets

\* conversation UI design;  
\* role-input states;  
\* confirmation card;  
\* report template;  
\* qualitative fit-state visual assets;  
\* evidence card;  
\* blocked-state components;  
\* error components;  
\* loading/progress component;  
\* mobile states.

\#\# 11.3 Technical assets

\* repository;  
\* environment configuration;  
\* database project;  
\* model API key;  
\* deployment project;  
\* seed scripts;  
\* test fixtures;  
\* mock responses;  
\* QA checklist;  
\* demo dataset.

\#\# 11.4 Environment setup checklist

\* local runtime verified;  
\* production build verified;  
\* deployment URL available;  
\* environment variables configured;  
\* database migration applied;  
\* seed data loaded;  
\* knowledge bundle version recorded;  
\* case-study links verified;  
\* Contact page reachable;  
\* demo-safe flags configured.

\---

\# 12\. Integration Checklist

\#\# Conversation to role flow

\* A chat request can initiate role analysis.  
\* Upload and paste actions reach the same validator.  
\* Invalid content cannot reach confirmation.  
\* Editing role input invalidates previous confirmation.

\#\# Role to report flow

\* Confirmed role maps to one snapshot.  
\* Snapshot maps to one Normalized Role Summary.  
\* Report limit is checked before retrieval.  
\* Retrieval uses approved knowledge only.  
\* Evidence verification occurs before generation.  
\* Blocked outcomes do not consume the report limit.

\#\# Report to persistence flow

\* Report validates before saving.  
\* Evidence references persist with the report.  
\* Report count increments once.  
\* Persistence status reaches the frontend.  
\* Raw job-description text never reaches storage.

\#\# Report to follow-up flow

\* Follow-up includes \`reportId\`.  
\* Only associated report and evidence are supplied.  
\* Unsupported questions receive transparent limitations.  
\* Follow-up does not mutate the report.

\#\# Report to portfolio navigation

\* Evidence link reaches exact case-study section.  
\* Return navigation preserves report context where implemented.  
\* Broken links fail QA.

\#\# Contact flow

\* CTA links to one canonical Contact page.  
\* CTA copy does not imply fit.  
\* Contact details persist only after explicit submission.

\---

\# 13\. QA Gates Before Demo

\#\# Gate 1 — Contract integrity

Must pass:

\* API schemas;  
\* report schema;  
\* evidence schema;  
\* storage schema;  
\* event schema.

Any contract mismatch is a Critical blocker.

\#\# Gate 2 — Privacy

Must pass:

\* raw job-description text absent from database;  
\* raw job-description text absent from runtime logs;  
\* uploaded files deleted after processing;  
\* contact data stored only on explicit submission;  
\* model prompts do not expose confidential content unnecessarily.

Any failure is a Critical blocker.

\#\# Gate 3 — Report control

Must pass:

\* explicit confirmation;  
\* shared report path;  
\* two-report limit;  
\* third request blocked before model call;  
\* blocked outcomes do not consume limit;  
\* retries obey limits;  
\* duplicate requests are idempotent.

Any failure is Critical or High.

\#\# Gate 4 — Evidence integrity

Must pass:

\* approved sources only;  
\* no invented metrics;  
\* no unsupported positive claims;  
\* valid evidence IDs;  
\* valid links;  
\* retrieval failure blocks report;  
\* verification failure blocks report.

Any unsupported claim is a Critical blocker.

\#\# Gate 5 — Failure handling

Must pass:

\* model timeout;  
\* malformed output;  
\* retrieval outage;  
\* database failure;  
\* logging failure;  
\* link failure;  
\* expired session;  
\* parsing failure.

Critical failures must be controlled. No stack trace or false success may reach the user.

\#\# Gate 6 — Demo journey

The complete primary demo must pass twice consecutively in the deployed environment.

\---

\# 14\. Primary Demo Scenario

\#\# Scenario objective

Demonstrate that the portfolio agent can move from open exploration to evidence-based role-fit analysis while remaining transparent, constrained, and trustworthy.

\#\# Demo sequence

1\. Visitor opens the portfolio.  
2\. Visitor asks a general question about experience with complex systems.  
3\. Agent answers from approved knowledge and links to a relevant case study.  
4\. Visitor chooses to paste a job description.  
5\. System validates the role input.  
6\. System presents a concise interpretation of the role.  
7\. Visitor explicitly confirms report generation.  
8\. The interface shows staged progress:

   \* understanding the role;  
   \* retrieving portfolio evidence;  
   \* verifying evidence;  
   \* generating the report.  
9\. A qualitative report is displayed.  
10\. The report shows:

    \* overall fit state;  
    \* strongest areas of alignment;  
    \* gaps or unknowns;  
    \* exact supporting evidence;  
    \* recommended case studies.  
11\. Visitor asks: “Why did you identify this as a strength?”  
12\. Agent answers using report-specific evidence.  
13\. Visitor opens an evidence link.  
14\. Visitor returns to the report.  
15\. Agent presents a neutral Contact CTA.  
16\. Presenter shows that the report and derived role summary were stored, while the original job-description text was not.

\#\# Preferred demo role

Use a role that creates a \*\*Good Fit\*\* or \*\*Strong Fit\*\* result with clear evidence across at least two case studies. Avoid a perfect match that may appear artificially constructed.

\---

\# 15\. Secondary Demo Scenarios

\#\# Scenario A — Insufficient evidence

\* Valid role.  
\* Some semantic overlap.  
\* Approved evidence cannot support a reliable report.  
\* System blocks report generation.  
\* Clear explanation is shown.  
\* Report count remains unchanged.

\#\# Scenario B — Prompt injection

\* Job description contains instructions to ignore the system rules.  
\* System ignores embedded instructions.  
\* Valid role content is extracted if possible.  
\* Injection-detected event is logged without storing the original text.

\#\# Scenario C — Third report request

\* Two successful reports already exist.  
\* User requests a third.  
\* Request is blocked before model, retrieval, or generation calls.

\#\# Scenario D — Persistence failure

\* Valid report is generated.  
\* Database save is intentionally unavailable.  
\* Report displays with an explicit “not saved” state.  
\* No false storage confirmation is shown.

\---

\# 16\. Demo Fallback Plan

\#\# 16.1 General rule

The fallback must preserve the product story without hiding what failed.

\#\# 16.2 Fallback layers

\#\#\# Layer 1 — Retry

Use only for:

\* transient model timeout;  
\* temporary network failure;  
\* recoverable parsing issue.

Maximum retries must follow the approved retry policy.

\#\#\# Layer 2 — Prevalidated live fixture

Use a fixed job-description fixture that has been tested against the current knowledge bundle.

The model may still run live, but input variability is removed.

\#\#\# Layer 3 — Cached report result

Use a cached, previously validated report JSON generated from the same fixture and current schema.

The presenter must describe it as a fallback or pre-generated example if asked.

\#\#\# Layer 4 — Static report render

The frontend loads a local structured JSON fixture into the real report component.

This still demonstrates:

\* report hierarchy;  
\* evidence links;  
\* follow-up design concept;  
\* error states;  
\* navigation.

It does not demonstrate live generation and must not be presented as such.

\#\#\# Layer 5 — Recorded walkthrough

A short screen recording is retained as the final technical fallback.

\#\# 16.3 Required fallback assets

\* one validated JD fixture;  
\* one validated report JSON;  
\* one blocked-outcome JSON;  
\* one report-follow-up response fixture;  
\* one persistence-failure fixture;  
\* one short screen recording;  
\* screenshots of stored report and sanitised logs.

\---

\# 17\. Scope-Lock Rules

After implementation begins, no new capability enters Must Have unless it resolves:

\* a privacy violation;  
\* a false or unsupported report claim;  
\* a demo-blocking failure;  
\* a broken canonical contract;  
\* a Critical QA failure.

The following do not justify scope expansion:

\* visual polish beyond approved design;  
\* new report sections;  
\* new fit categories;  
\* additional model providers;  
\* a full vector database;  
\* a new agent role;  
\* analytics dashboards;  
\* more upload formats;  
\* advanced learning;  
\* custom authentication;  
\* recruiter accounts;  
\* automatic outreach;  
\* CV rewriting.

Any proposed addition must state:

\* which approved requirement it satisfies;  
\* which current task it replaces;  
\* its implementation cost;  
\* its risk to demo readiness.

If it does not replace existing work, it is Deferred.

\---

\# 18\. Build Risks and Mitigations

| Risk                                          | Severity | Mitigation                                                       |  
| \--------------------------------------------- | \-------- | \---------------------------------------------------------------- |  
| Model returns malformed report JSON           | High     | Strict schema, one repair attempt, cached fallback               |  
| Report contains unsupported claim             | Critical | Evidence IDs, business-rule validator, claim verification        |  
| Raw JD stored in logs                         | Critical | Redaction layer, schema excludes field, privacy tests            |  
| Retrieval returns unapproved draft            | Critical | Approved-source allowlist and version manifest                   |  
| Evidence link reaches wrong section           | High     | Anchor manifest and pre-demo link test                           |  
| Duplicate reports from retries                | High     | Idempotency key and generation lock                              |  
| Third report bypassed through another UI path | High     | Single server-side eligibility gate                              |  
| Persistence fails after generation            | High     | Explicit unsaved state and active-session count                  |  
| Logging outage blocks report                  | Medium   | Degraded mode                                                    |  
| Session expires during generation             | High     | Lock expiry at request start; complete or fail deterministically |  
| File parser fails on demo input               | High     | Prevalidated pasted-text fixture and cached report               |  
| Follow-up escapes evidence scope              | High     | Report-bound context and source allowlist                        |  
| Contact CTA implies confirmed fit             | Medium   | Fixed approved copy                                              |  
| Model follows injection inside JD             | Critical | Untrusted-data isolation and injection tests                     |  
| Build time consumed by infrastructure         | High     | Modular monolith, curated retrieval, minimal database            |  
| UI polish delays core logic                   | High     | Mock-first skeleton and scope lock                               |  
| “No fit” logic becomes arbitrary              | High     | Structured eligibility output and explicit evidence gate         |  
| Database free tier is unavailable             | Medium   | Storage adapter and local/mock fallback                          |  
| Model API rate limit during demo              | High     | Cached report and static structured fixture                      |  
| Report count diverges after save failure      | High     | Session-level successful-delivery count                          |  
| Knowledge and website anchors drift           | High     | Versioned evidence manifest and final link audit                 |

\---

\# 19\. Important Resolutions Introduced by Stage 4.5

\#\# 19.1 Generated but unsaved reports

A report that was fully generated and presented to the user counts toward the two-report limit even when persistence fails. Otherwise a user could receive unlimited reports during a storage outage.

\#\# 19.2 Evidence threshold

A report requires multiple verified evidence references and evidence support for every positive finding. One weak or generic semantic match is not enough.

\#\# 19.3 Session expiry

Session expiry is enforced server-side and destroys ephemeral role state.

\#\# 19.4 Idempotency

Every report request requires an idempotency key. This is essential, not optional.

\#\# 19.5 Model authority

The model proposes structured interpretations. Application code remains the authority for eligibility, limits, persistence, state, and publication.

\---

\# 20\. Remaining Open Issues

These issues should be resolved during implementation setup, not through another strategic phase.

\#\# O1. Final technology stack

The exact framework, hosting platform, model provider, and database must be mapped to the existing portfolio repository.

\*\*Decision owner:\*\* Implementation environment  
\*\*Deadline:\*\* Before Task A1 is closed

\#\# O2. Upload limits

Final supported MIME types, maximum file size, and parsing libraries must be selected.

\*\*MVP recommendation:\*\* Prioritise paste input and support only the file types already proven locally.

\#\# O3. Report download

Confirm whether the demo requires a dedicated downloadable file or browser print is sufficient.

\*\*Recommendation:\*\* Defer custom PDF generation unless already implemented.

\#\# O4. Return context from case study

Confirm whether report state survives navigation through client state, URL state, or server retrieval.

\*\*Recommendation:\*\* Use \`reportId\` in the route and reload the stored report when the user returns.

\#\# O5. Automatic retention deletion

Confirm whether retention is implemented as an actual scheduled deletion mechanism or documented only as policy for the POC.

\*\*Recommendation:\*\* Document the policy and provide a manual cleanup script if automated scheduling threatens the build.

\---

\# 21\. MVP Readiness Checklist

\#\# Product

\* \[ \] One continuous conversation surface works.  
\* \[ \] General portfolio Q\&A works.  
\* \[ \] Upload and paste role flows work.  
\* \[ \] Explicit report confirmation works.  
\* \[ \] Qualitative report renders correctly.  
\* \[ \] Follow-up is report-bound.  
\* \[ \] Evidence navigation works.  
\* \[ \] Contact CTA is neutral and functional.

\#\# Safety and trust

\* \[ \] Approved evidence only.  
\* \[ \] No invented metrics.  
\* \[ \] No unsupported claims.  
\* \[ \] No raw JD persistence.  
\* \[ \] Injection is ignored.  
\* \[ \] No-fit and insufficient-evidence blocking work.  
\* \[ \] Repeated manipulation receives a short boundary.

\#\# Runtime

\* \[ \] Session state works.  
\* \[ \] 24-hour expiry works.  
\* \[ \] Two-report limit works.  
\* \[ \] Third request is blocked before model use.  
\* \[ \] Retry limits work.  
\* \[ \] Idempotency works.  
\* \[ \] Invalid state transitions are rejected.

\#\# Data

\* \[ \] Normalized Role Summary persists.  
\* \[ \] Final report persists.  
\* \[ \] Evidence references persist.  
\* \[ \] Runtime events persist or degrade safely.  
\* \[ \] Contact details persist only after submission.  
\* \[ \] Retention policy is documented.

\#\# Failure handling

\* \[ \] Model timeout handled.  
\* \[ \] Malformed output handled.  
\* \[ \] Retrieval failure blocks report.  
\* \[ \] Evidence-verification failure blocks report.  
\* \[ \] Persistence failure shows unsaved state.  
\* \[ \] Logging failure does not block report.  
\* \[ \] Broken evidence links are removed or fixed.  
\* \[ \] Expired sessions restart cleanly.

\#\# Demo

\* \[ \] Primary demo scenario passes twice.  
\* \[ \] Demo fixture is approved.  
\* \[ \] Cached report fixture exists.  
\* \[ \] Static report fallback exists.  
\* \[ \] Screen recording exists.  
\* \[ \] Database and log screenshots are ready.  
\* \[ \] Presenter language accurately distinguishes real and mocked components.

\---

\# 22\. Final Handoff Package Structure

\`\`\`text  
Portfolio\_Agent\_MVP/  
│  
├── 00\_README/  
│   ├── Project\_Overview.md  
│   ├── Setup\_and\_Run\_Instructions.md  
│   ├── Environment\_Variables.md  
│   └── Demo\_Runbook.md  
│  
├── 01\_PRODUCT\_AND\_UX/  
│   ├── Product\_Source\_of\_Truth  
│   ├── Conversation\_Blueprint\_Package  
│   └── Report\_Data\_Model  
│  
├── 02\_KNOWLEDGE/  
│   ├── Portfolio\_Knowledge\_Index  
│   ├── CV\_Knowledge\_v1.0  
│   ├── General\_Profile\_Knowledge\_v1.0  
│   ├── Case\_Study\_Knowledge\_\*.md  
│   ├── Evidence\_Manifest.json  
│   └── Retrieval\_Chunks/  
│  
├── 03\_AGENT\_AND\_RUNTIME/  
│   ├── Final\_Portfolio\_Agent\_System\_Prompt  
│   ├── Agent\_Architecture\_and\_Runtime\_Orchestration  
│   ├── Runtime\_Data\_Logging\_and\_Persistence\_Schema  
│   └── API\_and\_Data\_Contracts/  
│  
├── 04\_IMPLEMENTATION/  
│   ├── Build\_Task\_List\_Implementation\_Mapping\_and\_Demo\_Readiness\_v1.0  
│   ├── Frontend\_Mapping.md  
│   ├── Backend\_Mapping.md  
│   ├── Environment\_Setup.md  
│   └── Scope\_Lock.md  
│  
├── 05\_QA/  
│   ├── Edge\_Case\_Error\_and\_QA\_Test\_Pack  
│   ├── Test\_Fixtures/  
│   ├── Test\_Results/  
│   └── MVP\_Acceptance\_Checklist.md  
│  
├── 06\_DEMO/  
│   ├── Primary\_Demo\_JD.txt  
│   ├── Validated\_Report\_Fixture.json  
│   ├── Blocked\_Outcome\_Fixture.json  
│   ├── Follow\_Up\_Fixture.json  
│   ├── Demo\_Script.md  
│   ├── Demo\_Fallback\_Plan.md  
│   └── Demo\_Recording.mp4  
│  
└── 07\_OPERATIONS/  
    ├── Database\_Migrations/  
    ├── Seed\_Data/  
    ├── Retention\_and\_Cleanup.md  
    ├── Logging\_Event\_Catalogue.md  
    └── Known\_Limitations.md  
\`\`\`

\---

\# 23\. Final Definition of Ready to Build

Implementation may begin when:

\* all canonical files are accessible;  
\* the report schema is frozen;  
\* the evidence manifest exists;  
\* exact evidence URLs and anchors exist;  
\* the Contact destination is fixed;  
\* the technical repository and deployment target are known;  
\* API and event contracts are frozen;  
\* one primary demo role fixture is approved;  
\* mock report JSON renders successfully;  
\* no unresolved issue blocks privacy, report integrity, or evidence verification.

\---

\# 24\. Final Definition of MVP Done

The MVP is done when a visitor can:

1\. ask a grounded question about the portfolio;  
2\. provide a valid job description;  
3\. review and confirm the interpreted role;  
4\. receive a structured qualitative report generated only from approved evidence;  
5\. understand strengths, gaps, and unknowns;  
6\. open exact supporting portfolio evidence;  
7\. ask grounded follow-up questions about the report;  
8\. reach a neutral Contact CTA;

while the system:

\* enforces session and report limits;  
\* blocks unsupported reports;  
\* ignores embedded prompt injection;  
\* stores only approved derived and final data;  
\* handles critical failures safely;  
\* produces traceable runtime events;  
\* and can complete the primary demo using a documented fallback if an external dependency fails.  
