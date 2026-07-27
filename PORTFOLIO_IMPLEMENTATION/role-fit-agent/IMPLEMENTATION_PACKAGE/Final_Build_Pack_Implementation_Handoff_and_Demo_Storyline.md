\# Final Build Pack, Implementation Handoff & Demo Storyline v1.0

\#\# 1\. Purpose

This package is the final planning-to-implementation handoff for the Portfolio Agent MVP.

It consolidates the approved product, conversation, knowledge, report, architecture, runtime, persistence, QA, implementation, and demo specifications into one operational build package.

It does not redefine the product. It defines how the approved product is built, tested, demonstrated, documented, and presented.

\---

\# 2\. Final Status

\#\# Approved and closed

The following areas are considered approved and must not be redesigned during implementation:

\* Product purpose and MVP boundaries  
\* Main visitor and employer flows  
\* Conversation behaviour  
\* Job-description validation principles  
\* Role-fit report structure  
\* Qualitative fit interpretation  
\* Evidence and citation requirements  
\* Agent responsibilities  
\* Runtime orchestration  
\* Report eligibility rules  
\* Two-report session limit  
\* Retry rules  
\* Session-expiry rules  
\* Privacy and ephemeral-data rules  
\* Persistence and logging logic  
\* Failure handling  
\* Edge-case handling  
\* QA severity model  
\* Build sequence  
\* Demo-readiness requirements  
\* Scope-lock rules

\#\# Still to be built

\* Application frontend  
\* Chat and report interfaces  
\* Server-side orchestration layer  
\* Input-validation services  
\* Retrieval and evidence-resolution layer  
\* Report-generation pipeline  
\* Report renderer  
\* Persistence implementation  
\* Runtime event logging  
\* Contact CTA integration  
\* Demo fixtures  
\* QA automation or manual QA execution  
\* Deployment configuration  
\* Final demo recording or live demo environment

\#\# Deferred beyond MVP

\* User accounts  
\* Recruiter login  
\* Long-term visitor history  
\* Cross-session report history  
\* Automated portfolio-content ingestion  
\* Autonomous knowledge-base updates  
\* Large-scale analytics dashboard  
\* Production-grade evaluation platform  
\* Multi-candidate support  
\* Automated CV tailoring  
\* Recruiter CRM  
\* Advanced ranking or scoring model  
\* Continuous model training  
\* Full multilingual support  
\* Enterprise security and permissions model

\---

\# 3\. Canonical Document Inventory

\#\# Tier 1 — Product authority

| Canonical document                               | Authority                                                                                   |  
| \------------------------------------------------ | \------------------------------------------------------------------------------------------- |  
| \`Portfolio\_Agent\_PRD\_Implementation\_and\_Architecture\`                   | Product definition, user value, audience, MVP scope, constraints and decisions              |  
| \`Conversation\_Blueprint\_Package\` | User-facing flows, conversation states, transitions, validation, recovery and CTA behaviour |  
| \`Report\_Data\_Model\`                         | Report structure, fields, component logic, interpretation and display states                |

\#\# Tier 2 — Knowledge and agent behaviour

| Canonical document                                  | Authority                                                                   |  
| \--------------------------------------------------- | \--------------------------------------------------------------------------- |  
| \`Portfolio\_Knowledge\_Index\`                    | Approved knowledge-source registry and evidence-navigation index            |  
| \`Final\_Portfolio\_Agent\_System\_Prompt\`          | Model behaviour, evidence rules, response boundaries and agent instructions |  
| Approved CV, profile and case-study knowledge files | Factual source of truth for candidate experience and portfolio evidence     |

\#\# Tier 3 — Runtime and system implementation

| Canonical document                                                | Authority                                                               |  
| \----------------------------------------------------------------- | \----------------------------------------------------------------------- |  
| \`Agent\_Architecture\_and\_Runtime\_Orchestration\`               | Runtime components, task modes, orchestration and deterministic control |  
| \`Runtime\_Data\_Logging\_and\_Persistence\_Schema\`                | Runtime data contracts, persistence, event logging and privacy rules    |  
| \`Edge\_Case\_Error\_and\_QA\_Test\_Pack\`                           | Failures, recovery, edge cases, QA tests and acceptance severity        |  
| \`Build\_Task\_List\_Implementation\_Mapping\_and\_Demo\_Readiness\`  | Build sequence, implementation tasks, dependencies and readiness gates  |  
| \`Final\_Build\_Pack\_Implementation\_Handoff\_and\_Demo\_Storyline\` | Final execution, coding-agent, delivery and presentation package        |

\#\# Required knowledge files

The implementation repository must contain or reference the approved versions of:

1\. \`CV\_Knowledge\`  
2\. \`General\_Profile\_Knowledge\`  
3\. \`Case\_Study\_Knowledge\_The\_Big\_Red\_Button\`  
4\. \`Case\_Study\_Knowledge\_C4I\`  
5\. \`Case\_Study\_Knowledge\_EPD\`  
6\. \`Case\_Study\_Knowledge\_Monitoring\_and\_Product\_Intelligence\`  
7\. \`Case\_Study\_Knowledge\_HOWTOOL\`  
8\. \`Portfolio\_Knowledge\_Index\`

\---

\# 4\. Canonical Naming and Inventory Status

The naming and inventory issues identified during planning have been resolved and are now part of the approved implementation baseline.

\#\# Canonical naming status

All active canonical files now use stable, version-free filenames. These exact filenames are used by the implementation repository and all internal references. Previous versioned copies, when retained, belong only in the archive.

\#\# Conversation Blueprint status

\`Conversation\_Blueprint\_Package\` is the approved active canonical file. Its filename is stable and version-free. Historical version labels belong only to archived copies or document metadata.

\#\# Knowledge-file visibility

The canonical source list names only the index, while the implementation requires the individual knowledge files.

\#\#\# Implemented rule

The final repository must include both:

\* The knowledge index  
\* Every individual knowledge file referenced by the index

The index alone is not sufficient for retrieval.

\---

\# 5\. Source Hierarchy

When implementation files conflict, apply the following order.

\#\# Level 1 — Explicit deterministic rules

1\. Product Source of Truth  
2\. Runtime Architecture  
3\. Runtime Data and Persistence Schema  
4\. Edge Case and QA Pack  
5\. Build Task and Implementation Mapping

These documents define what the application is permitted to do.

\#\# Level 2 — Interaction and output rules

6\. Conversation Blueprint  
7\. Report Data Model  
8\. Final System Prompt

These documents define how the system interacts and how outputs are generated.

\#\# Level 3 — Factual evidence

9\. Portfolio Knowledge Index  
10\. Individual approved knowledge files

These documents define what factual claims may be made.

\#\# Conflict rule

A model prompt cannot override:

\* Application rules  
\* Privacy rules  
\* Session rules  
\* Report limits  
\* Evidence requirements  
\* Persistence rules  
\* Publication rules

The model proposes content.

The application determines whether content may be generated, accepted, stored, or displayed.

\---

\# 6\. Version-Control Rules

\#\# Canonical files

Canonical files must be:

\* Stored in a dedicated \`/docs/canonical\` directory  
\* Read-only during implementation  
\* Referenced by their stable canonical filename  
\* Updated only through a documented decision  
\* Never silently edited by the coding agent  
\* Archived under a versioned filename before an approved replacement is published

\#\# Changes

Any approved change requires:

\* Archived prior version filename and unchanged active canonical filename  
\* Date  
\* Reason  
\* Affected components  
\* Migration or implementation impact  
\* Confirmation that dependent documents remain consistent

\#\# Implementation notes

Implementation discoveries must be recorded separately in:

\`docs/implementation/implementation-decisions.md\`

They must not be inserted directly into canonical specifications unless formally approved.

\#\# Deprecated files

Older or superseded documents must be moved to:

\`docs/archive\`

They must not remain alongside canonical files without a visible deprecated label.

\---

\# 7\. Build-Ready Implementation Brief

\#\# Product

A conversation-based portfolio experience that allows a visitor to:

\* Explore portfolio projects  
\* Ask questions about professional experience  
\* Paste or upload a job description  
\* Receive a qualitative evidence-based role-fit report  
\* Ask follow-up questions about the report  
\* Navigate to exact portfolio evidence  
\* Continue to a contact page or contact CTA

\#\# Core implementation principle

The model supports interpretation and language generation.

The application controls:

\* Workflow  
\* Session state  
\* Validation state  
\* Role-snapshot state  
\* Report eligibility  
\* Retry count  
\* Report count  
\* Evidence verification  
\* Publication  
\* Persistence  
\* Error recovery

\#\# MVP success condition

A visitor can complete one full trusted journey:

1\. Enter the portfolio.  
2\. Ask a portfolio question.  
3\. Submit a valid job description.  
4\. Receive a report based on approved evidence.  
5\. Inspect supporting case studies.  
6\. Ask a report follow-up question.  
7\. Reach the contact CTA.

The system must also safely handle invalid, unsupported, insufficient, adversarial, and failed inputs.

\---

\# 8\. Recommended Repository Structure

\`\`\`text  
portfolio-agent/  
│  
├── app/  
│   ├── pages/  
│   ├── components/  
│   ├── chat/  
│   ├── report/  
│   ├── portfolio/  
│   ├── contact/  
│   └── error-states/  
│  
├── server/  
│   ├── api/  
│   ├── orchestration/  
│   ├── validation/  
│   ├── retrieval/  
│   ├── evidence/  
│   ├── report-generation/  
│   ├── report-publication/  
│   ├── session/  
│   ├── persistence/  
│   ├── logging/  
│   └── privacy/  
│  
├── knowledge/  
│   ├── index/  
│   ├── cv/  
│   ├── profile/  
│   └── case-studies/  
│  
├── prompts/  
│   ├── system/  
│   ├── task-modes/  
│   ├── report/  
│   ├── validation/  
│   └── follow-up/  
│  
├── schemas/  
│   ├── session/  
│   ├── role-snapshot/  
│   ├── evidence/  
│   ├── report/  
│   ├── runtime-events/  
│   └── persistence/  
│  
├── fixtures/  
│   ├── job-descriptions/  
│   ├── validation/  
│   ├── evidence/  
│   ├── reports/  
│   ├── failures/  
│   └── demo/  
│  
├── tests/  
│   ├── unit/  
│   ├── integration/  
│   ├── end-to-end/  
│   ├── qa-cases/  
│   └── demo-safety/  
│  
├── docs/  
│   ├── canonical/  
│   ├── implementation/  
│   ├── demo/  
│   ├── release/  
│   └── archive/  
│  
├── scripts/  
│   ├── validate-knowledge/  
│   ├── seed-demo-data/  
│   ├── reset-demo-session/  
│   └── run-demo-check/  
│  
├── public/  
│   └── portfolio-assets/  
│  
├── .env.example  
├── README.md  
├── IMPLEMENTATION\_HANDOFF.md  
├── DEMO\_RUNBOOK.md  
└── CHANGELOG.md  
\`\`\`

The exact framework may alter folder syntax, but the separation of responsibilities must remain.

\---

\# 9\. Environment and Setup Checklist

\#\# Local environment

\* Runtime version fixed  
\* Package manager fixed  
\* Dependency lockfile committed  
\* Local development command documented  
\* Production build command documented  
\* Test command documented  
\* Lint command documented  
\* Type-check command documented

\#\# Environment variables

At minimum:

\`\`\`text  
MODEL\_API\_KEY=  
MODEL\_NAME=  
DATABASE\_URL=  
SESSION\_SECRET=  
APP\_BASE\_URL=  
PORTFOLIO\_BASE\_URL=  
LOG\_LEVEL=  
DEMO\_MODE=  
PERSISTENCE\_ENABLED=  
\`\`\`

Optional, depending on implementation:

\`\`\`text  
FILE\_UPLOAD\_MAX\_SIZE=  
SESSION\_IDLE\_TIMEOUT\_HOURS=24  
MAX\_REPORTS\_PER\_SESSION=2  
MAX\_GENERATION\_RETRIES=2  
MODEL\_TIMEOUT\_MS=  
RETRIEVAL\_TIMEOUT\_MS=  
\`\`\`

\#\# Setup safety

\* No secrets committed  
\* \`.env.example\` contains placeholders only  
\* Production and demo variables separated  
\* Demo mode visibly declared  
\* Logging does not store raw job-description text  
\* Temporary role data is cleared on session expiry  
\* Database migrations are documented  
\* Demo database can be reset

\---

\# 10\. Exact Implementation Work Packages

\#\# WP-01 — Project foundation

Deliver:

\* Repository  
\* Runtime configuration  
\* Environment handling  
\* Linting  
\* Formatting  
\* Type checking  
\* Base application shell  
\* Error boundary  
\* Shared constants

\#\# WP-02 — Canonical content integration

Deliver:

\* Knowledge-file loader  
\* Knowledge-index resolver  
\* Schema validation  
\* Duplicate-ID detection  
\* Broken evidence-link detection  
\* Version metadata

\#\# WP-03 — Session and workflow state

Deliver:

\* Session creation  
\* 24-hour idle timeout  
\* Conversation state  
\* Role snapshot state  
\* Report-attempt counter  
\* Published-report counter  
\* Retry counter  
\* Idempotency tracking

\#\# WP-04 — Job-description intake

Deliver:

\* Paste input  
\* Supported upload input  
\* File and content validation  
\* Text extraction  
\* Sufficiency validation  
\* Invalid-input messaging  
\* Clarification flow  
\* Temporary role snapshot

\#\# WP-05 — Retrieval and evidence verification

Deliver:

\* Query construction  
\* Knowledge retrieval  
\* Evidence-ID resolution  
\* Claim-to-evidence mapping  
\* Positive-claim verification  
\* Unsupported-claim rejection  
\* Retrieval-failure state

\#\# WP-06 — Shared report eligibility service

Deliver one server-side service that verifies:

\* Valid role snapshot  
\* Sufficient job information  
\* Available report allowance  
\* Valid session  
\* Verified retrieval  
\* Sufficient approved evidence  
\* Valid idempotency key  
\* No conflicting in-progress request

No alternate report path is permitted.

\#\# WP-07 — Report generation

Deliver:

\* Structured model request  
\* Schema-constrained response  
\* Claim extraction  
\* Evidence references  
\* Gap statements  
\* Qualitative fit state  
\* Recommendations  
\* Portfolio links  
\* Contact CTA  
\* Model-output validation

\#\# WP-08 — Report publication and persistence

Deliver:

\* Report acceptance  
\* Report publication  
\* Report-count increment  
\* Persistence attempt  
\* Unsaved-report state  
\* Generated-but-unsaved handling  
\* Final structured JSON storage  
\* No raw job-description persistence

\#\# WP-09 — Portfolio Q\&A

Deliver:

\* General portfolio question handling  
\* Evidence retrieval  
\* Confidentiality boundaries  
\* Unsupported-question response  
\* Case-study navigation  
\* Contact redirection

\#\# WP-10 — Report follow-up mode

Deliver:

\* Current-report context  
\* Follow-up question classification  
\* Evidence-linked responses  
\* No report regeneration by accident  
\* Explicit new-report request handling  
\* Report-limit enforcement

\#\# WP-11 — User interface

Deliver:

\* Chat interface  
\* Job-description input  
\* Validation messages  
\* Processing state  
\* Report layout  
\* Fit-status illustration  
\* Evidence cards  
\* Case-study links  
\* Unsaved indicator  
\* Error and retry states  
\* Contact CTA

\#\# WP-12 — Logging and monitoring

Deliver:

\* Runtime events  
\* Validation outcomes  
\* Eligibility decisions  
\* Retrieval status  
\* Evidence-verification status  
\* Model invocation status  
\* Report publication status  
\* Persistence status  
\* Retry events  
\* Session expiry events  
\* CTA events

\#\# WP-13 — QA and demo readiness

Deliver:

\* Unit tests  
\* Integration tests  
\* Critical path test  
\* Failure-path tests  
\* Demo fixtures  
\* Demo reset script  
\* Demo preflight script  
\* Final acceptance evidence

\---

\# 11\. Coding-Agent Instruction Package

\#\# Coding-agent role

The coding agent is an implementation executor, not a product decision-maker.

It must build from the approved canonical package and must not simplify, reinterpret, or replace approved behaviour without surfacing the issue.

\#\# Master instruction

\`\`\`text  
You are implementing the Portfolio Agent MVP from approved canonical specifications.

Treat files under /docs/canonical as read-only sources of truth.

Do not invent product behaviour, fields, evidence, report logic, persistence rules, privacy rules, or error states.

The application layer is authoritative for workflow, validation, session state, eligibility, report limits, evidence verification, publication and persistence.

The model must never be trusted to enforce deterministic product rules.

Every report request must use the shared server-side eligibility path.

Every generation request must use an idempotency key.

Every positive fit claim must resolve to verified evidence from an approved knowledge file.

Retrieval failure, evidence-verification failure or insufficient approved evidence must block report publication.

Do not persist raw job-description text or Temporary Role Snapshot data.

A report that was generated and presented counts toward the session limit even when persistence fails.

Clearly mark generated reports that could not be saved.

Do not represent mocked functionality as real.

Do not introduce features outside the approved MVP.

When specifications conflict:  
1\. Stop implementation of the affected component.  
2\. Record the contradiction.  
3\. Identify the conflicting files and exact rules.  
4\. Recommend the smallest compliant resolution.  
5\. Continue with unaffected work.

For every work package:  
\- State the canonical files used.  
\- State assumptions.  
\- List files changed.  
\- Add or update tests.  
\- Confirm acceptance criteria.  
\- Record deferred items.  
\`\`\`

\#\# Prompt for each work package

\`\`\`text  
Implement work package: \[WORK PACKAGE ID AND NAME\]

Canonical sources:  
\- \[FILE\]  
\- \[FILE\]

Required behaviour:  
\- \[REQUIREMENT\]  
\- \[REQUIREMENT\]

Out of scope:  
\- \[ITEM\]  
\- \[ITEM\]

Before coding:  
1\. Inspect the existing implementation.  
2\. Map the canonical requirements to code components.  
3\. Identify contradictions or missing dependencies.  
4\. Propose the smallest implementation plan.

During coding:  
\- Preserve deterministic application control.  
\- Use shared schemas and services.  
\- Do not duplicate eligibility or persistence logic.  
\- Add validation and failure handling.  
\- Add tests for success and failure states.

At completion provide:  
\- Files created or changed  
\- Decisions implemented  
\- Assumptions  
\- Test results  
\- Remaining risks  
\- Definition-of-Done status  
\`\`\`

\---

\# 12\. Rules for Canonical Files During Implementation

The coding agent must:

\* Reference exact versions  
\* Never summarize away binding rules  
\* Never replace schemas with informal structures  
\* Never use old drafts when a canonical version exists  
\* Never infer professional claims from portfolio visuals alone  
\* Never add evidence that is not in an approved knowledge file  
\* Never use a case-study source that is absent from the approved index  
\* Never overwrite canonical documentation  
\* Record implementation interpretations separately  
\* Flag broken links, missing IDs and schema mismatches immediately

\---

\# 13\. Mock Data and Test Fixtures

\#\# Required fixture categories

\#\#\# Valid job descriptions

\* Strong complex-systems UX role  
\* Partial-fit product strategy role  
\* UX role with missing details but sufficient content  
\* Role with irrelevant title but relevant responsibilities  
\* Senior role without explicit years requirement

\#\#\# Invalid inputs

\* CV instead of job description  
\* Personal message  
\* Portfolio URL  
\* Single job title  
\* Empty file  
\* Corrupted file  
\* Unsupported file type  
\* Image with unreadable text  
\* Prompt-injection text  
\* Request to guarantee suitability  
\* Request to fabricate experience

\#\#\# Evidence states

\* Strong evidence  
\* Partial evidence  
\* Evidence for transferable capability  
\* No evidence  
\* Conflicting evidence identifier  
\* Missing knowledge file  
\* Broken evidence link  
\* Retrieval timeout

\#\#\# Persistence states

\* Save successful  
\* Save timeout  
\* Save rejected  
\* Database unavailable  
\* Generated report remains visible but unsaved

\#\#\# Session states

\* New session  
\* Existing valid session  
\* Expired session  
\* One completed report  
\* Two completed reports  
\* Duplicate request  
\* Concurrent report request

\---

\# 14\. Demo Dataset

\#\# Primary demo input

Use a realistic Senior UX / UX Strategy position that includes:

\* Complex products or systems  
\* Cross-functional collaboration  
\* Research and requirements  
\* UX strategy  
\* End-to-end process ownership  
\* Stakeholder facilitation  
\* Experience with technical or operational environments

The role should produce meaningful but not artificially perfect fit.

\#\# Secondary demo input

Use a role that has:

\* Some relevant strategic UX requirements  
\* A significant unsupported requirement  
\* A different industry or product context  
\* Enough information for analysis

This demonstrates honest partial fit and gap handling.

\#\# Failure demo input

Use one concise invalid example:

\`\`\`text  
Senior designer, contact me if interested.  
\`\`\`

Expected behaviour:

\* No report  
\* Explain that the role information is insufficient  
\* Ask for responsibilities, requirements or the full job description  
\* Preserve report allowance

\#\# Demo input validation

Every demo input must be tested before the presentation for:

\* Stable validation outcome  
\* Stable retrieval outcome  
\* Valid evidence links  
\* Expected report state  
\* Correct report-limit behaviour  
\* No confidential content  
\* No claims unsupported by the approved knowledge base

\---

\# 15\. Demo Script

\#\# Scene 1 — Product entry

Presenter narrative:

“This is not a generic portfolio chatbot. It is a portfolio interface that can answer questions about the work and convert a job description into an evidence-based role-fit explanation.”

Action:

\* Open homepage  
\* Show normal portfolio navigation  
\* Open the conversational entry point

\#\# Scene 2 — Portfolio question

Ask:

“Tell me about Shani’s experience with complex operational systems.”

Expected result:

\* Concise response  
\* Approved evidence  
\* Relevant case-study links  
\* No unsupported metrics

Presenter narrative:

“The same structured knowledge base supports both open portfolio exploration and the later fit analysis.”

\#\# Scene 3 — Invalid role input

Paste the insufficient fixture.

Expected result:

\* Validation failure  
\* No report  
\* Clear recovery instructions

Presenter narrative:

“The system does not spend a report attempt or generate a confident-looking result when the input is insufficient.”

\#\# Scene 4 — Valid role input

Paste the primary demo job description.

Expected result:

\* Validation success  
\* Temporary role interpretation  
\* Report generation  
\* Qualitative fit result  
\* Evidence-linked conclusions  
\* Gap explanation  
\* Case-study recommendations  
\* Contact CTA

Presenter narrative:

“The report does not compare keywords alone. It interprets the role and then verifies each positive conclusion against approved portfolio evidence.”

\#\# Scene 5 — Evidence navigation

Open one recommended case study and exact relevant section.

Presenter narrative:

“The report is an entry point into the portfolio, not a replacement for it. Visitors can verify the conclusions directly.”

\#\# Scene 6 — Report follow-up

Ask:

“What evidence supports the conclusion about cross-functional leadership?”

Expected result:

\* Answer based on current report  
\* Exact supporting evidence  
\* No new report generated  
\* No report count consumed

\#\# Scene 7 — Contact action

Use the CTA to reach the contact page.

Presenter narrative:

“The journey ends with a clear next action instead of leaving the visitor inside an endless conversation.”

\---

\# 16\. Demo Fallback Script

If live generation fails:

1\. Show the validation flow live.  
2\. Explain the shared server-side eligibility gate.  
3\. Load a pre-generated report fixture created from the same approved pipeline.  
4\. Clearly label it as a saved demo fixture.  
5\. Demonstrate evidence navigation and report follow-up.  
6\. Do not claim that the failed live generation succeeded.

If retrieval fails:

\* Show the blocked report state.  
\* Explain that the system prefers no report over unsupported conclusions.  
\* Continue with the validated report fixture.

If persistence fails:

\* Keep the generated report visible.  
\* Show the unsaved state.  
\* Explain that the report counts toward the limit because it was already presented.

\---

\# 17\. Architectural Explanation for the Presentation

\#\# Architecture summary

The system consists of:

\#\#\# User-facing portfolio agent

Handles:

\* Portfolio questions  
\* Job-description intake  
\* Validation dialogue  
\* Report presentation  
\* Report follow-up  
\* Evidence navigation  
\* Contact CTA

\#\#\# Internal task modes

1\. Role Understanding  
2\. Fit Analysis  
3\. Report Follow-up

These are task modes within one product experience, not separate visible bots.

\#\#\# Deterministic application services

\* Session control  
\* Workflow state  
\* Input validation  
\* Report eligibility  
\* Retry management  
\* Report limits  
\* Retrieval coordination  
\* Evidence verification  
\* Report publication  
\* Persistence  
\* Runtime logging

\#\#\# Model responsibilities

\* Interpret natural language  
\* Extract role meaning  
\* Compare role needs with evidence  
\* Draft structured report content  
\* Answer grounded follow-up questions

\#\#\# Model restrictions

The model cannot independently:

\* Approve report eligibility  
\* Change report limits  
\* Publish an unverified report  
\* Decide what is persisted  
\* Override session expiry  
\* Fabricate evidence  
\* Save raw job-description data  
\* Mark mocked functionality as real

\---

\# 18\. Product-Value Storyline

\#\# User problem

Traditional portfolios require visitors to manually infer:

\* Which experience is relevant  
\* Which case study proves which capability  
\* Whether the candidate fits a particular role  
\* What evidence supports that conclusion

\#\# Product response

The Portfolio Agent creates a guided evidence layer above the portfolio.

It helps visitors:

\* Find relevant information faster  
\* Understand transferable experience  
\* Connect job needs to actual portfolio evidence  
\* Identify both strengths and gaps  
\* Continue to direct contact

\#\# Differentiation

The value is not “chat with my CV.”

The value is:

\* Structured evidence  
\* Role interpretation  
\* Transparent reasoning  
\* Exact case-study navigation  
\* Honest handling of missing fit  
\* Controlled report generation  
\* A full portfolio-to-contact journey

\---

\# 19\. Trust, Evidence, Privacy and Failure Storyline

\#\# Trust

The system separates fluent model output from application authority.

\#\# Evidence

Every positive fit statement must be supported by an approved evidence reference.

No evidence means no positive claim.

Insufficient evidence may result in:

\* A weaker conclusion  
\* An explicit uncertainty  
\* A blocked report

\#\# Privacy

The system does not retain:

\* Original job-description text  
\* Uploaded job-description files  
\* Temporary Role Snapshot data after the session

It may retain:

\* Final structured report  
\* Necessary derived analysis fields  
\* Runtime and QA events  
\* Contact information submitted through the contact flow

\#\# Failure handling

The system is intentionally designed to fail safely.

Examples:

\* Invalid role input does not create a report.  
\* Retrieval failure blocks generation.  
\* Evidence-verification failure blocks publication.  
\* Persistence failure keeps the report visible but marks it unsaved.  
\* Expired sessions cannot generate new reports.  
\* Duplicate requests are handled using idempotency keys.

\---

\# 20\. Real Versus Mocked Disclosure

The final presentation must include a clear implementation disclosure.

\#\# Suggested format

| Capability                 | Status                  | Disclosure                                                   |  
| \-------------------------- | \----------------------- | \------------------------------------------------------------ |  
| Portfolio navigation       | Real                    | Implemented in the portfolio website                         |  
| Conversational UI          | Real / Partial          | State exact implementation                                   |  
| Job-description validation | Real / Rule-assisted    | State whether deterministic, model-assisted or fixture-based |  
| Knowledge retrieval        | Real / Local            | State whether file-based, indexed or simulated               |  
| Evidence verification      | Real / Partial          | State exact verification mechanism                           |  
| Report generation          | Real / Fixture fallback | State live and fallback modes                                |  
| Report persistence         | Real / Mocked           | State storage implementation                                 |  
| Runtime logging            | Real / Partial          | State which events are recorded                              |  
| Contact CTA                | Real                    | State destination and whether form submission is active      |  
| Learning loop              | Conceptual              | Not implemented in the MVP unless genuinely built            |

\#\# Non-negotiable rule

A mocked or fixture-driven component must never be presented as a fully operational production capability.

\---

\# 21\. Known Limitations

\* Evidence quality depends on the approved knowledge base.  
\* The system does not validate external claims about employers or roles.  
\* The report is qualitative and not a hiring recommendation.  
\* No numeric candidate score is produced.  
\* Results may vary slightly when model generation is used.  
\* The MVP supports one candidate portfolio only.  
\* The system does not retain full job-description history.  
\* The system does not automatically update its knowledge base.  
\* File extraction support may be limited.  
\* The learning loop is based on logs and review, not autonomous model training.  
\* Session and report limits are MVP product controls, not enterprise policy.  
\* The system does not replace recruiter judgment.  
\* The demo dataset is controlled and is not proof of performance across all job descriptions.

\---

\# 22\. Post-MVP Scalability Path

\#\# Phase 1 — MVP hardening

\* Automated schema validation  
\* More deterministic parsing  
\* Better retrieval evaluation  
\* Automated regression tests  
\* Stronger observability  
\* Admin review of generated reports

\#\# Phase 2 — Knowledge operations

\* Knowledge-file editor  
\* Content approval workflow  
\* Versioned evidence records  
\* Automated broken-link detection  
\* Case-study update pipeline

\#\# Phase 3 — Recruiter experience

\* Shareable report links  
\* Recruiter notes  
\* Consent-based saved sessions  
\* Report comparison  
\* Contact-context transfer

\#\# Phase 4 — Multi-profile platform

\* Multiple candidates  
\* Tenant separation  
\* Permissions  
\* Candidate-managed knowledge  
\* Organization-level analytics

\#\# Phase 5 — Learning and evaluation

\* Human rating of report usefulness  
\* Evidence-quality evaluation  
\* Retrieval precision tracking  
\* Failure clustering  
\* Prompt and policy experiments  
\* Regression datasets  
\* Model comparison

\---

\# 23\. Final Acceptance Checklist

\#\# Product flow

\* \[ \] Visitor can enter the portfolio normally.  
\* \[ \] Visitor can open the agent.  
\* \[ \] Portfolio questions use approved evidence.  
\* \[ \] Job descriptions can be pasted.  
\* \[ \] Supported files can be uploaded or the limitation is clearly disclosed.  
\* \[ \] Invalid inputs are rejected safely.  
\* \[ \] Valid inputs create a Temporary Role Snapshot.  
\* \[ \] Report requests use one shared eligibility path.  
\* \[ \] Reports contain only evidence-supported positive claims.  
\* \[ \] Report follow-up does not accidentally create another report.  
\* \[ \] Evidence links open the correct portfolio content.  
\* \[ \] Contact CTA is available.

\#\# Runtime control

\* \[ \] Session expiry is server-enforced.  
\* \[ \] Report count is server-enforced.  
\* \[ \] Retry count is server-enforced.  
\* \[ \] Idempotency is implemented.  
\* \[ \] Concurrent report requests are controlled.  
\* \[ \] Retrieval failure blocks generation.  
\* \[ \] Evidence failure blocks publication.  
\* \[ \] Generated reports count once presented.  
\* \[ \] Unsaved reports are clearly marked.

\#\# Privacy and storage

\* \[ \] Raw job-description text is not persisted.  
\* \[ \] Uploaded role files are not retained.  
\* \[ \] Temporary role data expires.  
\* \[ \] Final report storage follows the approved schema.  
\* \[ \] Runtime logs contain no prohibited raw content.  
\* \[ \] Contact data is isolated from report data where required.

\#\# QA

\* \[ \] All Critical tests pass.  
\* \[ \] All High tests pass.  
\* \[ \] Primary demo input passes.  
\* \[ \] Secondary demo input passes.  
\* \[ \] Failure demo input passes.  
\* \[ \] Demo fallback is tested.  
\* \[ \] Mocked functionality is disclosed.  
\* \[ \] Demo environment can be reset.

\---

\# 24\. Final Documentation Checklist

The final delivery must contain:

\* \[ \] Canonical document inventory  
\* \[ \] All canonical documents  
\* \[ \] All individual knowledge files  
\* \[ \] Portfolio Knowledge Index  
\* \[ \] Implementation brief  
\* \[ \] Repository map  
\* \[ \] Environment setup guide  
\* \[ \] \`.env.example\`  
\* \[ \] Coding-agent master instruction  
\* \[ \] Work-package prompts  
\* \[ \] Data and API schemas  
\* \[ \] Fixture inventory  
\* \[ \] Demo dataset  
\* \[ \] Demo runbook  
\* \[ \] Demo fallback procedure  
\* \[ \] QA results  
\* \[ \] Known limitations  
\* \[ \] Real-versus-mocked disclosure  
\* \[ \] Deployment instructions  
\* \[ \] Change log  
\* \[ \] Final acceptance record

\---

\# 25\. Final Delivery Structure

\`\`\`text  
Portfolio\_Agent\_Final\_Delivery/  
│  
├── 01\_Canonical\_Product\_and\_UX/  
│   ├── Portfolio\_Agent\_PRD\_Implementation\_and\_Architecture  
│   ├── Conversation\_Blueprint\_Package  
│   └── Report\_Data\_Model  
│  
├── 02\_Knowledge\_Base/  
│   ├── Portfolio\_Knowledge\_Index  
│   ├── CV\_Knowledge  
│   ├── General\_Profile\_Knowledge  
│   └── Case\_Study\_Knowledge\_Files/  
│  
├── 03\_Agent\_and\_Runtime/  
│   ├── Final\_Portfolio\_Agent\_System\_Prompt  
│   ├── Agent\_Architecture\_and\_Runtime\_Orchestration  
│   └── Runtime\_Data\_Logging\_and\_Persistence\_Schema  
│  
├── 04\_QA\_and\_Implementation/  
│   ├── Edge\_Case\_Error\_and\_QA\_Test\_Pack  
│   ├── Build\_Task\_List\_Implementation\_Mapping\_and\_Demo\_Readiness  
│   └── Final\_Build\_Pack\_Implementation\_Handoff\_and\_Demo\_Storyline  
│  
├── 05\_Build\_Repository/  
│   ├── source-code/  
│   ├── environment/  
│   ├── fixtures/  
│   └── tests/  
│  
├── 06\_Demo\_and\_Presentation/  
│   ├── Demo\_Runbook  
│   ├── Demo\_Inputs  
│   ├── Demo\_Fallback  
│   ├── Architecture\_Storyline  
│   ├── Product\_Value\_Storyline  
│   └── Real\_vs\_Mocked\_Disclosure  
│  
└── 07\_Release/  
    ├── README  
    ├── Setup\_Guide  
    ├── Known\_Limitations  
    ├── Acceptance\_Checklist  
    ├── QA\_Results  
    └── Changelog  
\`\`\`

\---

\# 26\. Final Decision Log

\#\# Approved

\* This package closes the planning phase.  
\* Canonical specifications remain authoritative.  
\* Implementation begins from the approved Build Task List.  
\* Coding agents may implement but may not redesign the product.  
\* Deterministic rules belong in application code.  
\* Evidence verification is mandatory.  
\* Raw job-description content remains ephemeral.  
\* Every report request uses one eligibility path.  
\* All Critical and High QA tests must pass before the demo.  
\* Real and mocked capabilities must be disclosed separately.

\#\# Assumptions

\* The individual approved knowledge files are available.  
\* The final portfolio URLs and evidence anchors can be connected during implementation.  
\* One technical stack will be selected before repository initialization.  
\* The contact page or CTA destination will be available.  
\* A structured report JSON schema already exists in \`Report\_Data\_Model\`.

\#\# Open implementation issues

\* Final technology stack  
\* Exact deployment platform  
\* Exact persistence provider  
\* Supported upload formats  
\* Retrieval implementation method  
\* Exact model provider and model version  
\* Whether live report persistence will be completed for the demo  
\* Whether report links will be route-based, anchor-based or data-driven

These issues may change the implementation method but must not change approved product behaviour.

\#\# Deferred

\* Production-scale security  
\* Full analytics dashboard  
\* Automated learning  
\* Multi-user accounts  
\* Multi-candidate platform  
\* Recruiter workspace  
\* Automatic portfolio ingestion

\---

\# 27\. Final Handoff Statement

The planning package is now complete enough to begin implementation.

No additional strategy, architecture or conversation-design phase is required before building.

The next operational step is to initialize the repository, load the canonical package, confirm the technical stack and execute the approved work packages in dependency order.

Any issue discovered during implementation should be treated as one of:

1\. Implementation detail  
2\. Missing dependency  
3\. Documentation inconsistency  
4\. Material specification contradiction  
5\. New-scope request

Only category 4 justifies reopening an approved decision.

Category 5 must be deferred unless it is essential to completing the approved MVP journey.  
