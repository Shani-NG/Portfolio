\# Agent Architecture and Runtime Orchestration v1.0

\#\# 1\. Document Purpose

This document defines the build-ready runtime architecture for the portfolio conversation agent.

It translates the approved system prompt, conversation blueprint, report data model, and portfolio knowledge structure into an implementable orchestration specification.

This document defines:

\* The single-agent architecture  
\* The three internal task modes  
\* Runtime orchestration  
\* State and routing logic  
\* Typed handoffs  
\* Validation and retrieval boundaries  
\* Report-generation control  
\* Persistence and privacy rules  
\* Contact-lead handling  
\* Logging and human-reviewed learning  
\* Failure and fallback behavior  
\* Four-day MVP implementation scope

This document does not duplicate:

\* \`Final\_Portfolio\_Agent\_System\_Prompt\`  
\* The full conversation copy  
\* The report UI specification  
\* The approved portfolio knowledge content  
\* The case-study knowledge files

\---

\# 2\. Canonical Sources

This architecture is based on:

1\. \`Final\_Portfolio\_Agent\_System\_Prompt\`  
2\. \`Conversation\_Blueprint\_Package\`  
3\. \`Report\_Data\_Model\`  
4\. \`Portfolio\_Knowledge\_Index\`

The source documents remain authoritative for their respective areas.

This document defines how they operate together at runtime.

\---

\# 3\. Approved Architecture

\#\# 3.1 User-Facing Architecture

The product exposes one consistent portfolio agent.

The visitor experiences one continuous conversation and is not transferred between visible agents.

The agent supports:

\* General portfolio questions  
\* Questions about professional experience, skills, process, and background  
\* Job-description submission  
\* Role understanding and clarification  
\* Evidence-based role-fit analysis  
\* Follow-up questions about a generated report  
\* Navigation to supporting portfolio evidence  
\* Contact CTA

\#\# 3.2 Internal Task Modes

The single agent operates through three internal task modes:

1\. Role Understanding  
2\. Fit Analysis  
3\. Report Follow-up

These are internal runtime modes, not independent user-facing agents.

\#\# 3.3 Deterministic Application Layers

The following remain controlled by deterministic application logic:

\* Session management  
\* Input validation  
\* Job-description sufficiency validation  
\* Routing  
\* Report-limit enforcement  
\* Retry-limit enforcement  
\* Retrieval-source restrictions  
\* Evidence validation  
\* Report schema validation  
\* Persistence  
\* Privacy filtering  
\* Browser-payload filtering  
\* Logging  
\* Contact-form storage  
\* Error recovery

The language model interprets professional meaning and generates user-facing responses.

The model does not control permissions, limits, persistence, or system state.

\---

\# 4\. High-Level Runtime Architecture

\`\`\`text  
Visitor Interface  
    |  
    v  
Conversation API  
    |  
    v  
Deterministic Runtime Orchestrator  
    |  
    \+--\> Session and State Manager  
    |  
    \+--\> Route Resolver  
    |  
    \+--\> Input and Privacy Validation  
    |  
    \+--\> Job Description Validation  
    |  
    \+--\> Portfolio Retrieval Service  
    |  
    \+--\> Agent Runtime  
    |       |  
    |       \+--\> Role Understanding  
    |       \+--\> Fit Analysis  
    |       \+--\> Report Follow-up  
    |  
    \+--\> Report Composer  
    |  
    \+--\> Report and Evidence Validator  
    |  
    \+--\> Persistence Layer  
    |  
    \+--\> Contact Lead Adapter  
    |  
    \+--\> Structured Logging and Learning Events  
\`\`\`

For the MVP, these components may exist inside one backend application.

Logical separation is required.

Separate microservices are not required.

\---

\# 5\. Core Runtime Principles

The implementation must preserve the following principles:

1\. One user-facing agent.  
2\. Three internal task modes.  
3\. One continuous conversation.  
4\. Only approved portfolio evidence may support professional claims.  
5\. Role-title similarity alone is not proof of fit.  
6\. No report is created without a valid and sufficient role input.  
7\. No report is created without meaningful fit.  
8\. No report is created when approved evidence is insufficient.  
9\. Only a valid, persisted report counts toward the report limit.  
10\. Each session allows up to two completed reports.  
11\. Each role-analysis attempt allows two retries after the initial attempt.  
12\. The original job-description text is not persisted.  
13\. Personal names and contact details found inside job descriptions are not persisted.  
14\. A minimal structured role summary may be persisted for QA and learning.  
15\. Contact details are stored only when explicitly submitted through the shared contact form.  
16\. Reports are stored as structured JSON.  
17\. The user sees a designed report UI, not raw JSON.  
18\. Report image or PDF export is outside the initial MVP.  
19\. Internal data and stored reports remain in English.  
20\. User-facing conversation follows the user’s active language.  
21\. The system avoids repeating the same explanation or evidence rationale within the same conversation.  
22\. The system does not modify production behavior automatically from logged data.  
23\. All learning improvements require human review and approval.

\---

\# 6\. Visitor Interface

The portfolio interface supports:

\* General portfolio chat  
\* Job-description text paste  
\* Supported file upload when implemented  
\* Clarification questions  
\* Designed role-fit report display  
\* Active-report follow-up  
\* Report switching  
\* Requesting another report  
\* Portfolio evidence navigation  
\* Shared Contact CTA

The interface must not receive:

\* System prompts  
\* Hidden instructions  
\* Raw model reasoning  
\* Raw retrieval rankings  
\* Full internal knowledge files  
\* Internal confidence calculations  
\* Private notes  
\* Raw error traces  
\* Unfiltered model output  
\* Server-controlled report counters

\---

\# 7\. Conversation API

Minimum request structure:

\`\`\`json  
{  
  "sessionId": "string",  
  "messageId": "string",  
  "userMessage": "string",  
  "userLanguage": "string",  
  "activeReportId": "string | null",  
  "clientTimestamp": "ISO-8601"  
}  
\`\`\`

The API must reject or sanitize:

\* Empty input  
\* Oversized input  
\* Unsupported file types  
\* Executable content  
\* Attempts to override system instructions  
\* Attempts to modify server-controlled state  
\* User-provided report counters  
\* User-provided permissions  
\* Credentials or passwords  
\* Sensitive personal information when detected

\---

\# 8\. Runtime Orchestrator

The orchestrator is deterministic application code.

It is responsible for:

1\. Loading the session  
2\. Confirming that the session is active  
3\. Applying privacy and safety checks  
4\. Loading the current state  
5\. Resolving the user’s intent  
6\. Selecting the appropriate task mode  
7\. Confirming that mode entry conditions are met  
8\. Preparing the minimum required runtime context  
9\. Calling retrieval when required  
10\. Calling the language model  
11\. Validating the returned structure  
12\. Applying evidence and privacy validation  
13\. Updating the state  
14\. Persisting only approved data  
15\. Recording safe structured events  
16\. Returning a safe user-facing response

The MVP does not require a separate orchestration model.

Routing should use:

\* Current state  
\* Explicit user intent  
\* Deterministic conditions  
\* Lightweight structured intent classification  
\* Validated model output only where semantic interpretation is necessary

\---

\# 9\. Internal Task Mode 1 — Role Understanding

\#\# 9.1 Purpose

Determine whether the visitor has provided a real, relevant, and sufficiently detailed job description.

Convert the temporary role input into a structured role representation for analysis.

\#\# 9.2 Entry Conditions

Role Understanding is entered when:

\* The visitor pastes or uploads job-related content  
\* The visitor asks for role-fit analysis  
\* The visitor adds missing role information  
\* The current role information is incomplete  
\* The system cannot confirm that the input is a sufficient job description

\#\# 9.3 Responsibilities

Role Understanding may:

\* Determine whether the input resembles a real job description  
\* Extract the company name when available  
\* Identify the role title  
\* Identify seniority signals  
\* Identify domain and product context  
\* Identify core responsibilities  
\* Identify required capabilities  
\* Identify preferred capabilities  
\* Identify leadership expectations  
\* Identify collaboration expectations  
\* Identify experience requirements  
\* Identify constraints  
\* Identify unclear or missing information  
\* Ask focused clarification questions

\#\# 9.4 Restrictions

Role Understanding must not:

\* Produce a final fit report  
\* Invent missing requirements  
\* Add external company information  
\* Treat a job title as sufficient evidence  
\* Retrieve unrelated portfolio content  
\* Persist the original job-description text  
\* Persist personal names found in the job description  
\* Persist email addresses or phone numbers found in the job description

\#\# 9.5 Temporary Role Snapshot

During the active analysis workflow, the system may hold a complete temporary role snapshot in session memory.

\`\`\`json  
{  
  "roleSnapshotId": "string",  
  "companyName": "string | null",  
  "roleTitle": "string | null",  
  "seniorityBand": "string | null",  
  "roleCategory": "string | null",  
  "domainTags": \["string"\],  
  "responsibilities": \["string"\],  
  "requiredCapabilities": \["string"\],  
  "preferredCapabilities": \["string"\],  
  "leadershipSignals": \["string"\],  
  "collaborationSignals": \["string"\],  
  "experienceRequirements": {  
    "minimumYears": "number | null",  
    "managementRequired": "boolean | null"  
  },  
  "constraints": \["string"\],  
  "missingInformation": \["string"\],  
  "validationStatus": "valid | needs\_clarification | invalid | irrelevant",  
  "sourceLanguage": "string"  
}  
\`\`\`

The complete temporary role snapshot exists only for the active workflow.

It is not persisted as raw source material.

\#\# 9.6 Mode Output Contract

\`\`\`json  
{  
  "mode": "role\_understanding",  
  "status": "valid | needs\_clarification | invalid | irrelevant",  
  "temporaryRoleSnapshot": {},  
  "clarificationQuestions": \["string"\],  
  "nextRecommendedMode": "role\_understanding | fit\_analysis | general\_conversation"  
}  
\`\`\`

\#\# 9.7 Successful Exit

Role Understanding exits to Fit Analysis only when:

\* The input is relevant  
\* The input is sufficiently detailed  
\* The structured role representation passes validation  
\* The visitor has requested or confirmed analysis  
\* The session has report capacity  
\* The retry limit has not been exceeded

\---

\# 10\. Internal Task Mode 2 — Fit Analysis

\#\# 10.1 Purpose

Compare the validated role requirements with approved CV, general profile, and case-study evidence.

Determine whether a meaningful and defensible role-fit report can be generated.

\#\# 10.2 Entry Conditions

Fit Analysis may begin only when:

\* A valid temporary \`roleSnapshotId\` exists  
\* Role validation has passed  
\* The visitor requested or confirmed report generation  
\* The session contains fewer than two completed reports  
\* The retry limit has not been exceeded  
\* Approved knowledge sources are available  
\* Retrieval succeeds

\#\# 10.3 Responsibilities

Fit Analysis may:

\* Interpret the actual needs of the role  
\* Map role requirements to approved portfolio evidence  
\* Identify strong direct matches  
\* Identify partial or transferable matches  
\* Identify evidence gaps  
\* Distinguish missing evidence from missing experience  
\* Recommend relevant case studies  
\* Link conclusions to evidence IDs  
\* Determine whether the fit is meaningful enough to justify a report

\#\# 10.4 Restrictions

Fit Analysis must not:

\* Invent experience  
\* Invent achievements or metrics  
\* Invent technical ownership  
\* Invent outcomes  
\* Use confidential or unapproved information  
\* Present transferable experience as direct experience  
\* Force a positive result  
\* Generate a report only because titles are similar  
\* Generate a report when no meaningful fit exists  
\* Generate a report when approved evidence is insufficient

\#\# 10.5 Fit-Gating Logic

\`\`\`text  
Meaningful fit and sufficient evidence  
    \-\> Create a report

Potential fit but insufficient role information  
    \-\> Return to Role Understanding  
    \-\> Ask clarification questions

Sufficient role information but insufficient approved portfolio evidence  
    \-\> Do not create a report  
    \-\> Explain the limitation conversationally

No meaningful fit  
    \-\> Do not create a report  
    \-\> Offer guidance or exploration of another role or requirement  
\`\`\`

\#\# 10.6 Fit Analysis Output Contract

\`\`\`json  
{  
  "mode": "fit\_analysis",  
  "analysisStatus": "report\_ready | clarification\_required | insufficient\_evidence | no\_meaningful\_fit | failed",  
  "roleSnapshotId": "string",  
  "fitInterpretation": {  
    "overallConclusion": "string",  
    "strongMatches": \[  
      {  
        "requirementId": "string",  
        "finding": "string",  
        "evidenceIds": \["string"\],  
        "confidence": "high | medium | low"  
      }  
    \],  
    "partialMatches": \[  
      {  
        "requirementId": "string",  
        "finding": "string",  
        "transferabilityExplanation": "string",  
        "evidenceIds": \["string"\],  
        "confidence": "high | medium | low"  
      }  
    \],  
    "gaps": \[  
      {  
        "requirementId": "string",  
        "gapType": "missing\_evidence | missing\_experience | unclear\_requirement",  
        "explanation": "string"  
      }  
    \],  
    "recommendedCaseStudyIds": \["string"\]  
  },  
  "clarificationQuestions": \["string"\],  
  "reportDraft": "ReportDataModel | null"  
}  
\`\`\`

\#\# 10.7 Successful Exit

Fit Analysis exits successfully only when:

\* \`analysisStatus\` is \`report\_ready\`  
\* The output matches \`Report\_Data\_Model\`  
\* Every evidence ID resolves to approved knowledge  
\* No unsupported claim exists  
\* Privacy validation passes  
\* Report persistence succeeds  
\* Report status becomes \`ready\`

Only then is the completed-report counter increased.

\---

\# 11\. No-Report Outcomes

\#\# 11.1 No Meaningful Fit

When there is no meaningful fit:

\* No report is generated  
\* The report allowance is not consumed  
\* The user receives a concise and respectful explanation  
\* The system may ask whether the visitor wants to explore:

  \* Another role  
  \* A specific requirement  
  \* Transferable experience  
  \* Relevant portfolio work  
  \* General professional background

\#\# 11.2 Insufficient Approved Evidence

When the role may be relevant but the approved knowledge base does not support a defensible conclusion:

\* No report is generated  
\* Missing evidence is not treated as proof of missing capability  
\* The system explains the limitation  
\* The report allowance is not consumed  
\* The user may continue with general portfolio exploration

\#\# 11.3 Missing Role Information

When the role input is incomplete:

\* The system enters clarification  
\* The user is asked only for missing information  
\* Previously provided information is not requested again  
\* The system does not start Fit Analysis prematurely

\---

\# 12\. Internal Task Mode 3 — Report Follow-up

\#\# 12.1 Purpose

Answer questions about an existing report while preserving its evidence and interpretation context.

\#\# 12.2 Entry Conditions

Report Follow-up is entered when:

\* A valid \`activeReportId\` exists  
\* The report belongs to the active session  
\* The report status is \`ready\`  
\* The visitor asks about findings, evidence, gaps, or recommendations

\#\# 12.3 Responsibilities

Report Follow-up may:

\* Explain a report finding  
\* Explain why evidence was considered relevant  
\* Clarify direct versus transferable experience  
\* Compare findings  
\* Explain gaps  
\* Retrieve additional approved evidence when necessary  
\* Navigate to a relevant case study  
\* Navigate to an exact evidence section  
\* Show the Contact CTA when appropriate

\#\# 12.4 Restrictions

Report Follow-up must not:

\* Change the stored report silently  
\* Rewrite conclusions without a new analysis  
\* Add unsupported evidence  
\* Use the wrong report context  
\* Expose hidden prompts  
\* Expose internal confidence calculations  
\* Repeat the same rationale unnecessarily

\#\# 12.5 Explanation Repetition Control

The runtime stores a compact summary of explanations already provided within the session.

\`\`\`json  
{  
  "explainedTopics": \[  
    {  
      "topicKey": "string",  
      "reportId": "string",  
      "evidenceIds": \["string"\],  
      "explanationSummary": "string"  
    }  
  \]  
}  
\`\`\`

When the visitor asks a repeated question, the agent should:

\* Briefly reference the previous explanation  
\* Add a new angle, example, or evidence detail  
\* Avoid repeating the same paragraph

\#\# 12.6 Output Contract

\`\`\`json  
{  
  "mode": "report\_follow\_up",  
  "activeReportId": "string",  
  "answer": "string",  
  "referencedFindingIds": \["string"\],  
  "referencedEvidenceIds": \["string"\],  
  "navigationTargets": \[  
    {  
      "caseStudyId": "string",  
      "sectionId": "string | null",  
      "label": "string"  
    }  
  \],  
  "cta": {  
    "show": true,  
    "type": "contact | view\_case\_study | ask\_another\_question",  
    "label": "string"  
  },  
  "explanationMemoryUpdate": {  
    "topicKey": "string",  
    "explanationSummary": "string"  
  }  
}  
\`\`\`

\---

\# 13\. General Portfolio Conversation

General portfolio conversation is the agent’s default behavior when no role-analysis task is active.

It supports questions about:

\* Professional background  
\* Skills  
\* Work process  
\* Strategic thinking  
\* Leadership  
\* Complex systems  
\* AI-related work  
\* Approved case studies  
\* Portfolio navigation  
\* Contact options

General conversation may use approved portfolio retrieval.

It may not produce a role-fit report without passing through Role Understanding and Fit Analysis.

\---

\# 14\. Runtime Context

\#\# 14.1 Shared Runtime Context

\`\`\`json  
{  
  "runtimeVersion": "1.0",  
  "session": {  
    "sessionId": "string",  
    "status": "active | expired | blocked",  
    "createdAt": "ISO-8601",  
    "lastActivityAt": "ISO-8601",  
    "idleExpiresAt": "ISO-8601",  
    "completedReportCount": 0,  
    "activeReportId": "string | null"  
  },  
  "conversation": {  
    "userLanguage": "string",  
    "currentState": "string",  
    "recentMessages": \[\],  
    "explainedTopics": \[\]  
  },  
  "roleContext": {  
    "activeRoleSnapshotId": "string | null",  
    "temporaryRoleSnapshot": "object | null",  
    "attemptCount": 0  
  },  
  "reportContext": {  
    "activeReport": "object | null",  
    "availableReports": \[\],  
    "reportSummary": "object | null"  
  },  
  "retrievalContext": {  
    "queryPurpose": "string",  
    "evidence": \[\],  
    "knowledgeVersion": "string"  
  },  
  "policyContext": {  
    "reportLimit": 2,  
    "retryLimitPerRoleSnapshot": 2,  
    "rawJobDescriptionStorageAllowed": false,  
    "personalNameStorageAllowed": false,  
    "companyNameStorageAllowed": true,  
    "normalizedRoleSummaryStorageAllowed": true  
  }  
}  
\`\`\`

\#\# 14.2 Context-Minimization Rules

Each model call receives only the information required for its current task.

Examples:

\* Role Understanding does not receive the full portfolio knowledge base.  
\* General conversation does not receive full report objects unless needed.  
\* Follow-up receives the active report and relevant findings.  
\* Fit Analysis receives retrieved evidence, not unrestricted knowledge files.  
\* Raw job-description text is not forwarded beyond the active processing requirements.

\---

\# 15\. Typed Handoffs

Typed handoffs are structured server-side objects.

They are not shown to the visitor.

\#\# 15.1 Role Understanding to Fit Analysis

\`\`\`json  
{  
  "handoffType": "role\_ready\_for\_analysis",  
  "roleSnapshotId": "string",  
  "roleSnapshotVersion": 1,  
  "confirmedByUser": true,  
  "validationStatus": "passed",  
  "createdAt": "ISO-8601"  
}  
\`\`\`

\#\# 15.2 Fit Analysis to Report Composition

\`\`\`json  
{  
  "handoffType": "analysis\_ready\_for\_report",  
  "roleSnapshotId": "string",  
  "analysisId": "string",  
  "analysisStatus": "report\_ready",  
  "evidenceIds": \["string"\],  
  "reportDraft": {}  
}  
\`\`\`

\#\# 15.3 Report Composition to Report Follow-up

\`\`\`json  
{  
  "handoffType": "report\_activated",  
  "reportId": "string",  
  "reportStatus": "ready",  
  "roleSnapshotId": "string",  
  "reportSummary": {},  
  "createdAt": "ISO-8601"  
}  
\`\`\`

\#\# 15.4 Failed Handoff

\`\`\`json  
{  
  "handoffType": "handoff\_failed",  
  "sourceMode": "string",  
  "targetMode": "string",  
  "failureCode": "string",  
  "recoverable": true,  
  "safeUserMessageKey": "string"  
}  
\`\`\`

Every receiving component must validate the handoff before continuing.

\---

\# 16\. State Model

\#\# 16.1 Primary States

\`\`\`text  
SESSION\_STARTED  
GENERAL\_CONVERSATION  
ROLE\_INPUT\_RECEIVED  
ROLE\_VALIDATION  
ROLE\_CLARIFICATION  
ROLE\_READY  
FIT\_ANALYSIS\_PENDING  
FIT\_ANALYSIS\_RUNNING  
NO\_MEANINGFUL\_FIT  
INSUFFICIENT\_EVIDENCE  
REPORT\_COMPOSING  
REPORT\_VALIDATING  
REPORT\_READY  
REPORT\_FOLLOW\_UP  
REPORT\_LIMIT\_REACHED  
RECOVERABLE\_ERROR  
SESSION\_EXPIRED  
\`\`\`

\#\# 16.2 Main Transitions

\`\`\`text  
SESSION\_STARTED  
    \-\> GENERAL\_CONVERSATION

GENERAL\_CONVERSATION  
    \-\> GENERAL\_CONVERSATION  
    \-\> ROLE\_INPUT\_RECEIVED

ROLE\_INPUT\_RECEIVED  
    \-\> ROLE\_VALIDATION

ROLE\_VALIDATION  
    \-\> ROLE\_CLARIFICATION  
    \-\> ROLE\_READY  
    \-\> GENERAL\_CONVERSATION

ROLE\_CLARIFICATION  
    \-\> ROLE\_VALIDATION  
    \-\> GENERAL\_CONVERSATION

ROLE\_READY  
    \-\> FIT\_ANALYSIS\_PENDING

FIT\_ANALYSIS\_PENDING  
    \-\> FIT\_ANALYSIS\_RUNNING  
    \-\> REPORT\_LIMIT\_REACHED

FIT\_ANALYSIS\_RUNNING  
    \-\> REPORT\_COMPOSING  
    \-\> ROLE\_CLARIFICATION  
    \-\> INSUFFICIENT\_EVIDENCE  
    \-\> NO\_MEANINGFUL\_FIT  
    \-\> RECOVERABLE\_ERROR

REPORT\_COMPOSING  
    \-\> REPORT\_VALIDATING  
    \-\> RECOVERABLE\_ERROR

REPORT\_VALIDATING  
    \-\> REPORT\_READY  
    \-\> RECOVERABLE\_ERROR

REPORT\_READY  
    \-\> REPORT\_FOLLOW\_UP  
    \-\> ROLE\_INPUT\_RECEIVED  
    \-\> GENERAL\_CONVERSATION

REPORT\_FOLLOW\_UP  
    \-\> REPORT\_FOLLOW\_UP  
    \-\> ROLE\_INPUT\_RECEIVED  
    \-\> GENERAL\_CONVERSATION  
\`\`\`

\#\# 16.3 Routing Priority

When several intents are detected, routing priority is:

1\. Privacy or safety concern  
2\. Session-expiry handling  
3\. Explicit report-generation request  
4\. Role clarification  
5\. Active-report follow-up  
6\. New job-description input  
7\. General portfolio question  
8\. Unsupported or irrelevant request

\---

\# 17\. Report Limits

\#\# 17.1 Completed Report Limit

Each session allows up to two completed reports.

A report counts only when:

\* Its schema is valid  
\* Evidence validation passes  
\* Privacy validation passes  
\* Persistence succeeds  
\* Status becomes \`ready\`

The following do not count:

\* Invalid job-description input  
\* Clarification attempts  
\* Failed retrieval  
\* Failed model calls  
\* Invalid report drafts  
\* Persistence failures  
\* No meaningful fit  
\* Insufficient evidence

\#\# 17.2 Creating Another Report

After the first report is created:

\* The first report remains available  
\* The visitor may ask for another report conversationally  
\* The visitor may press an enabled \`Analyze another role\` action  
\* The system returns to the job-description input flow  
\* The new role creates a separate report  
\* The first report remains unchanged

After the second valid report is created:

\* The \`Analyze another role\` action is disabled or removed  
\* A third report request is blocked before retrieval or model execution  
\* The visitor may continue asking questions about either existing report

\#\# 17.3 Switching Between Reports

The MVP uses a simple report selector.

Recommended presentation:

\`\`\`text  
Report 1 — Role title or company  
Report 2 — Role title or company  
\`\`\`

This may be implemented as:

\* Tabs  
\* Segmented control  
\* Dropdown

A complex report-history interface is not required.

\---

\# 18\. Retry Logic

Each \`roleSnapshotId\` allows:

\* One initial Fit Analysis attempt  
\* Up to two retries after recoverable failure

Maximum generation attempts per role snapshot:

\`\`\`text  
1 initial attempt  
2 retry attempts  
3 total attempts  
\`\`\`

The retry counter is separate from the completed-report counter.

Retries may be used for:

\* Model timeout  
\* Malformed structured output  
\* Temporary model failure  
\* Safe report-repair failure  
\* Recoverable persistence or validation errors

Retries are not used to bypass:

\* No meaningful fit  
\* Insufficient evidence  
\* Missing role information  
\* Report-limit enforcement

\---

\# 19\. Session Policy

\#\# 19.1 Idle Timeout

A session expires after 24 hours without meaningful user activity.

Meaningful activity includes:

\* Sending a message  
\* Adding role information  
\* Requesting a report  
\* Asking a report follow-up question  
\* Selecting an existing report  
\* Performing a server-state navigation action

Background requests and passive page loading do not reset the timeout.

\#\# 19.2 Session Expiry

When the session expires:

\* The active conversation state ends  
\* Temporary job-description data is discarded  
\* Temporary role snapshots are discarded  
\* A new session is created for new activity  
\* Old reports are not automatically attached to the new session  
\* Old reports follow the approved retention policy  
\* Contact leads remain independent records

A configurable absolute session lifetime may be added later but is not required for the four-day MVP.

\---

\# 20\. Deterministic Application Responsibilities

\#\# 20.1 Input Validation

Application code controls:

\* Text-length limits  
\* Empty-input detection  
\* File-type validation  
\* File-size validation  
\* Unsupported content rejection  
\* Encoding normalization  
\* Credential detection  
\* Sensitive-data detection  
\* Personal-name exclusion before persistence

\#\# 20.2 Job Description Validation

The system validates:

\* Whether the input is job-related  
\* Whether it includes a role  
\* Whether responsibilities are present  
\* Whether required capabilities can be identified  
\* Whether the input is sufficient for analysis  
\* Whether clarification is needed

\#\# 20.3 Retrieval

Application code controls:

\* Approved-source filtering  
\* Knowledge-version selection  
\* Relevance thresholding  
\* Evidence-ID generation  
\* Duplicate removal  
\* Case-study mapping  
\* Evidence-count limits  
\* Retrieval logging

\#\# 20.4 Report Control

Application code controls:

\* Report-limit checks  
\* Retry-limit checks  
\* Report-ID creation  
\* Schema validation  
\* Evidence-reference validation  
\* Report-status transitions  
\* Report persistence  
\* Active-report selection  
\* Report switching

\#\# 20.5 Privacy

Application code controls:

\* Raw job-description deletion  
\* Personal-name exclusion  
\* Contact-information exclusion  
\* Credential and password detection  
\* Financial-information filtering  
\* Confidential-information filtering  
\* Safe log creation  
\* Safe browser payloads

\#\# 20.6 Presentation

The frontend controls:

\* Designed report components  
\* Section ordering  
\* Empty-section removal  
\* Loading states  
\* Failure states  
\* Responsive layout  
\* Report selector  
\* Evidence links  
\* Contact CTA display

\---

\# 21\. Persistence Model

The system persists only information required for:

\* Report display  
\* Report follow-up  
\* Report comparison  
\* QA  
\* Retrieval evaluation  
\* Human-reviewed learning  
\* Contact management

\#\# 21.1 Stored Report Record

Each completed report is stored as one structured record.

\`\`\`json  
{  
  "reportId": "string",  
  "sessionId": "string",  
  "companyName": "string | null",  
  "createdAt": "ISO-8601",  
  "reportStatus": "ready",  
  "knowledgeVersion": "string",  
  "normalizedRoleSummary": {},  
  "reportData": {},  
  "evidenceReferences": \[\],  
  "learningMetrics": {}  
}  
\`\`\`

\#\# 21.2 Final Report JSON

The final role-fit report is stored as structured JSON according to:

\`Report\_Data\_Model\`

The JSON is the report source of truth.

It is used for:

\* Designed report rendering  
\* Follow-up questions  
\* Report switching  
\* QA  
\* Evidence validation  
\* Future storage migration  
\* Optional future exports

\#\# 21.3 Normalized Role Summary

The original job-description text is not stored.

Instead, the system stores a minimal structured summary derived from the temporary role snapshot.

\`\`\`json  
{  
  "roleSummaryId": "string",  
  "roleTitle": "string | null",  
  "seniorityBand": "string | null",  
  "roleCategory": "string | null",  
  "domainTags": \["string"\],  
  "coreResponsibilityTags": \["string"\],  
  "requiredCapabilityTags": \["string"\],  
  "preferredCapabilityTags": \["string"\],  
  "leadershipSignals": \["string"\],  
  "collaborationSignals": \["string"\],  
  "experienceRequirements": {  
    "minimumYears": "number | null",  
    "managementRequired": "boolean | null"  
  },  
  "validationOutcome": "passed",  
  "clarificationCount": 0  
}  
\`\`\`

The Normalized Role Summary exists only to support:

\* Comparison between interpreted role requirements and report findings  
\* QA review  
\* Retrieval-quality evaluation  
\* Gap analysis  
\* Human-reviewed system improvement

It must not contain:

\* Raw job-description text  
\* Paragraphs or quotations  
\* Personal names  
\* Recruiter names  
\* Manager names  
\* Email addresses  
\* Phone numbers  
\* Credentials  
\* Sensitive information  
\* Unnecessary free-form content

\#\# 21.4 Evidence References

The report record stores the evidence IDs used in the final report.

This supports:

\* Evidence verification  
\* Case-study navigation  
\* Follow-up answers  
\* Retrieval review  
\* Knowledge-version analysis

\---

\# 22\. Data That Is Not Persisted

The following are not persisted:

\* Original job-description text  
\* Uploaded job-description file content  
\* Full raw temporary role snapshot  
\* Personal names found in job descriptions  
\* Recruiter or hiring-manager names  
\* Email addresses found in job descriptions  
\* Phone numbers found in job descriptions  
\* Raw clarification conversation  
\* Full user-message history by default  
\* Raw model prompts  
\* Raw model outputs  
\* Hidden reasoning  
\* Temporary retrieval rankings  
\* Unsupported analysis drafts  
\* Failed report drafts

These may exist temporarily in memory only when required for the active workflow.

\---

\# 23\. Contact CTA and Lead Storage

\#\# 23.1 Shared Contact Flow

All contact entry points lead to the same contact form.

Entry points may include:

\* Contact page  
\* Report CTA  
\* Chat CTA  
\* Portfolio section CTA  
\* Case-study CTA

The form and storage structure remain identical regardless of entry point.

\#\# 23.2 Contact Data Rule

Contact details are stored only when the visitor explicitly submits the contact form.

This is separate from job-description processing.

Personal details found inside a job description are never treated as submitted contact details.

\#\# 23.3 Leads Table

The MVP may use Google Sheets or Excel as the lead store.

Recommended structure:

| Field              | Purpose                                                  |  
| \------------------ | \-------------------------------------------------------- |  
| \`leadId\`           | Unique lead identifier                                   |  
| \`createdAt\`        | Submission timestamp                                     |  
| \`name\`             | Explicitly submitted name                                |  
| \`email\`            | Explicitly submitted email                               |  
| \`phone\`            | Optional submitted phone                                 |  
| \`companyName\`      | Submitted or report-linked company                       |  
| \`message\`          | Optional message                                         |  
| \`source\`           | \`report\`, \`chat\`, \`contact\_page\`, or another site source |  
| \`reportId\`         | Included when the lead came from a report                |  
| \`sessionId\`        | Anonymous session identifier                             |  
| \`consentToContact\` | Explicit contact consent                                 |  
| \`status\`           | \`new\`, \`contacted\`, or \`closed\`                          |

If a database is adopted later, the storage adapter may change without changing the contact form contract.

\---

\# 24\. Report Presentation

\#\# 24.1 User-Facing Report

The visitor sees a designed report dashboard.

\`\`\`text  
Final Report JSON  
        ↓  
Fixed Report UI Components  
        ↓  
Designed Role-Fit Report  
\`\`\`

The visitor does not see:

\* Raw JSON  
\* Internal tags  
\* Logging fields  
\* Learning metrics  
\* Hidden evidence metadata  
\* Internal confidence calculations

\#\# 24.2 Internal Documentation

The structured JSON and associated metadata are for:

\* System operation  
\* QA  
\* Review  
\* Future database migration  
\* Human-reviewed learning

\#\# 24.3 Report Download

Report export as:

\* PNG  
\* Image  
\* PDF

is outside the initial MVP.

For the MVP:

\* The report is displayed in the website  
\* The visitor may take a screenshot  
\* No dedicated download mechanism is required

A future version may add \`Download report as image\` or PDF export.

\---

\# 25\. Privacy and Data Boundaries

\#\# 25.1 Data That May Be Stored

The MVP may store:

\* Anonymous session ID  
\* Final report JSON  
\* Minimal report metadata  
\* Company name  
\* Minimal Normalized Role Summary  
\* Evidence references  
\* Knowledge-base version  
\* Runtime outcome metrics  
\* Safe structured events  
\* Explicitly submitted contact-form data

\#\# 25.2 Data That Must Not Be Intentionally Stored

\* Original job-description text  
\* Personal names from job descriptions  
\* Contact information from job descriptions  
\* Passwords  
\* Credentials  
\* Financial information  
\* Government identifiers  
\* Sensitive personal information  
\* Confidential employer information  
\* Raw system prompts  
\* Raw model outputs  
\* Hidden reasoning

\#\# 25.3 Company Name

The company name may be stored when:

\* It is required for report identification  
\* It is included in the report  
\* It supports report switching  
\* It is submitted through the contact form

Other company information should not be stored unless required by the report schema.

\#\# 25.4 Browser Payload

The browser receives only information required for display and interaction.

The browser must not receive:

\* Full internal knowledge entries  
\* Hidden prompts  
\* Raw error traces  
\* Learning records  
\* Retrieval rankings  
\* Confidential notes  
\* Unnecessary database identifiers

\---

\# 26\. Logging

\#\# 26.1 Logging Goals

Logging supports:

\* Runtime debugging  
\* Funnel analysis  
\* Failure monitoring  
\* Retrieval evaluation  
\* Report-completion tracking  
\* QA  
\* Human-reviewed product improvement

\#\# 26.2 Recommended Event Types

\`\`\`text  
session\_started  
session\_expired  
message\_received  
route\_selected  
role\_input\_received  
role\_validation\_passed  
role\_validation\_failed  
clarification\_requested  
role\_snapshot\_created  
fit\_analysis\_started  
fit\_analysis\_failed  
no\_meaningful\_fit\_detected  
insufficient\_evidence\_detected  
report\_composition\_started  
report\_validation\_failed  
report\_created  
report\_selected  
another\_report\_requested  
report\_limit\_reached  
report\_follow\_up\_started  
evidence\_link\_opened  
contact\_cta\_shown  
contact\_form\_opened  
contact\_form\_submitted  
retrieval\_failed  
persistence\_failed  
privacy\_filter\_triggered  
\`\`\`

\#\# 26.3 Safe Log Structure

\`\`\`json  
{  
  "eventId": "string",  
  "eventType": "string",  
  "timestamp": "ISO-8601",  
  "sessionId": "string",  
  "mode": "string",  
  "state": "string",  
  "reportId": "string | null",  
  "companyName": "string | null",  
  "knowledgeVersion": "string | null",  
  "durationMs": 0,  
  "success": true,  
  "errorCode": "string | null",  
  "metadata": {}  
}  
\`\`\`

\#\# 26.4 Data That Must Not Be Logged

\* Full job descriptions  
\* Full user messages by default  
\* Personal names  
\* Contact information  
\* Passwords or credentials  
\* Raw prompts  
\* Raw model outputs  
\* Hidden reasoning  
\* Confidential evidence excerpts  
\* Sensitive information

\---

\# 27\. Human-Reviewed Learning Loop

\#\# 27.1 Learning Principle

The MVP does not perform autonomous self-learning.

The system collects structured information that supports manual review and approved improvements.

\#\# 27.2 Stored Learning Inputs

The learning process may use:

\* Normalized Role Summary  
\* Final Report JSON  
\* Evidence IDs  
\* Analysis outcome  
\* Clarification count  
\* Retry count  
\* Retrieval outcome  
\* Report-validation result  
\* No-fit outcome  
\* Insufficient-evidence outcome  
\* Follow-up topic categories  
\* CTA interaction  
\* Knowledge version

\#\# 27.3 What Can Be Evaluated

The stored structures allow review of:

\* Whether role requirements were represented correctly  
\* Whether important requirements were omitted  
\* Whether report findings correspond to role requirements  
\* Whether evidence was relevant  
\* Whether evidence was overextended  
\* Whether gaps were identified correctly  
\* Whether synonyms or role categories require improvement  
\* Whether certain domains repeatedly lack evidence  
\* Whether the fit gate is too permissive or too strict  
\* Whether clarification questions improve report quality

\#\# 27.4 Learning Workflow

\`\`\`text  
Normalized Role Summary  
        \+  
Final Report JSON  
        \+  
Evidence References  
        \+  
Runtime Metrics  
        ↓  
Human QA Review  
        ↓  
Recurring Issue or Opportunity Identified  
        ↓  
Prompt, Retrieval, Validation, Tagging, or Knowledge Update Proposed  
        ↓  
Human Approval  
        ↓  
New Version Released  
\`\`\`

The production system must not automatically modify:

\* Prompts  
\* Evidence rules  
\* Retrieval weights  
\* Validation thresholds  
\* Knowledge files  
\* Report logic

without explicit review and approval.

\---

\# 28\. Evidence and Retrieval

\#\# 28.1 Approved Sources

The retrieval service may use only sources approved and indexed by:

\`Portfolio\_Knowledge\_Index\`

These may include:

\* CV knowledge  
\* General profile knowledge  
\* Approved case-study knowledge  
\* Portfolio navigation metadata

\#\# 28.2 Evidence Object

\`\`\`json  
{  
  "evidenceId": "string",  
  "sourceType": "cv | general\_profile | case\_study",  
  "sourceId": "string",  
  "caseStudyId": "string | null",  
  "sectionId": "string | null",  
  "claim": "string",  
  "evidenceText": "string",  
  "allowedUses": \["string"\],  
  "restrictionFlags": \["string"\],  
  "knowledgeVersion": "string"  
}  
\`\`\`

\#\# 28.3 Evidence Validation

Before report completion, the application verifies:

\* Every evidence ID exists  
\* Every evidence item is approved  
\* The evidence supports the report claim  
\* The report does not broaden the evidence  
\* Confidential restrictions are respected  
\* Superseded evidence is not used  
\* Recommended case studies resolve to real portfolio locations

\---

\# 29\. Language Handling

\#\# 29.1 Internal Language

The following remain in English:

\* Stored reports  
\* Normalized Role Summaries  
\* Evidence metadata  
\* Runtime states  
\* Typed handoffs  
\* Error codes  
\* Logs  
\* Internal documentation  
\* Learning records

\#\# 29.2 User-Facing Language

The agent communicates in the visitor’s active language.

It should:

\* Continue in the language used by the visitor  
\* Avoid unnecessary language switching  
\* Preserve professional terminology where translation reduces accuracy  
\* Answer report follow-up questions in the visitor’s language

\#\# 29.3 Report Display

The canonical stored report remains in English.

A translated display layer may be added later without replacing the canonical report.

For the MVP, report-display language follows the approved product implementation decision.

\---

\# 30\. Failure and Fallback Paths

\#\# 30.1 Invalid or Irrelevant Input

Examples:

\* CV instead of job description  
\* General company description  
\* One short sentence without role details  
\* Random text  
\* Unsupported file

Behavior:

\* Do not start Fit Analysis  
\* Explain what input is required  
\* Ask for a proper job description or missing information  
\* Preserve the last valid state

\#\# 30.2 Missing Role Information

Behavior:

\* Enter clarification  
\* Ask focused questions  
\* Avoid repeating questions already answered  
\* Update the temporary role snapshot

\#\# 30.3 Retrieval Failure

Behavior:

\* Do not generate a report  
\* Retry retrieval once if the failure is technical  
\* Preserve the temporary role state  
\* Return a safe error message  
\* Log the failure code

\#\# 30.4 Insufficient Evidence

Behavior:

\* Do not generate a report  
\* Do not consume report allowance  
\* Explain that approved evidence is insufficient  
\* Avoid treating missing evidence as missing ability  
\* Offer relevant portfolio exploration

\#\# 30.5 No Meaningful Fit

Behavior:

\* Do not generate a report  
\* Do not consume report allowance  
\* Provide concise guidance  
\* Offer another role or a focused portfolio question

\#\# 30.6 Model Timeout

Behavior:

\* Use the retry policy  
\* Preserve the last valid state  
\* Do not expose raw errors  
\* Do not increment the completed-report counter

\#\# 30.7 Invalid Model Output

Behavior:

\* Attempt safe structural repair  
\* Retry when required  
\* Reject unsupported claims  
\* Never display an unvalidated partial report

\#\# 30.8 Persistence Failure

Behavior:

\* Do not mark the report as completed  
\* Do not increment the report counter  
\* Retry persistence when appropriate  
\* Return a safe recovery message  
\* Preserve the temporary state while the session remains valid

\#\# 30.9 Session Expiry During Analysis

Behavior:

\* Stop the workflow  
\* Discard temporary job-description data  
\* Discard the temporary role snapshot  
\* Do not attach results automatically to a new session  
\* Invite the visitor to begin again

\#\# 30.10 Missing Active Report

When the visitor asks a report question without a valid active report:

\* Do not invent report context  
\* Ask the visitor to select an available report  
\* Otherwise return to general conversation

\#\# 30.11 Contact-Form Failure

Behavior:

\* Preserve the entered form data temporarily in the client when safe  
\* Show a clear submission error  
\* Do not claim that the lead was saved  
\* Allow retry  
\* Log only the safe failure event

\---

\# 31\. Four-Day MVP Scope

\#\# Day 1 — Runtime Foundation

Build:

\* Session model  
\* State model  
\* Conversation endpoint  
\* Orchestrator  
\* Route resolver  
\* General portfolio conversation  
\* Job-description text-paste path  
\* Basic structured logging

Do not build:

\* User accounts  
\* OCR  
\* Advanced file processing  
\* Multi-agent deployment  
\* Advanced analytics dashboard

\#\# Day 2 — Role Understanding and Retrieval

Build:

\* Job-description validation  
\* Temporary role snapshot  
\* Clarification flow  
\* Approved knowledge index  
\* Retrieval service  
\* Evidence objects  
\* Privacy preprocessing  
\* Personal-name exclusion  
\* Normalized Role Summary mapping

\#\# Day 3 — Fit Analysis and Report Pipeline

Build:

\* Fit Analysis mode  
\* Meaningful-fit gate  
\* No-fit path  
\* Insufficient-evidence path  
\* Report composition  
\* Report-schema validation  
\* Evidence validation  
\* Report persistence as JSON  
\* Normalized Role Summary persistence  
\* Two-report limit  
\* Two-retry policy

\#\# Day 4 — Follow-up, Contact and QA

Build:

\* Active-report state  
\* Report switching  
\* Report Follow-up mode  
\* Repetition control  
\* Case-study navigation  
\* Shared Contact CTA  
\* Shared contact form  
\* Leads-table integration  
\* Session expiry  
\* Failure states  
\* End-to-end QA  
\* Demo scenarios  
\* Basic log inspection

\---

\# 32\. Explicitly Out of Scope

The following are outside the four-day MVP:

\* Multiple visible agents  
\* Autonomous agent-to-agent negotiation  
\* User authentication  
\* Long-term user accounts  
\* Cross-device report restoration  
\* Unlimited report history  
\* External company research  
\* LinkedIn enrichment  
\* Candidate ranking  
\* Recruitment decision automation  
\* Numeric employment-fit scores  
\* Fine-tuning  
\* Automatic production self-learning  
\* Full administrative analytics product  
\* Advanced vector-database optimization  
\* PDF and image job-description parsing unless the text flow is complete  
\* OCR  
\* Report export as image  
\* Report PDF generation  
\* Dedicated download-report functionality  
\* Complex CRM integration  
\* Complex report-history interface

\---

\# 33\. Recommended MVP Technical Shape

\`\`\`text  
Frontend  
\- Portfolio website  
\- Chat interface  
\- Job-description paste field  
\- Designed report components  
\- Report selector  
\- Case-study navigation  
\- Shared contact form

Backend  
\- Conversation endpoint  
\- Session and state service  
\- Orchestrator  
\- Job-description validator  
\- Retrieval service  
\- Model adapter  
\- Report composer  
\- Report validator  
\- Privacy filter  
\- Persistence adapter  
\- Lead-storage adapter  
\- Event logger

Storage  
\- Completed report records  
\- Final Report JSON  
\- Normalized Role Summaries  
\- Evidence references  
\- Safe learning metrics  
\- Safe structured events  
\- Contact leads  
\- Knowledge index  
\`\`\`

For the MVP, Google Sheets or Excel may be used for contact leads.

Report storage may use the simplest structured JSON-capable storage available in the selected implementation environment.

\---

\# 34\. Decision Register

\#\# Approved

\* One user-facing agent  
\* Three internal task modes  
\* Deterministic application orchestrator  
\* One continuous conversation  
\* Approved evidence only  
\* No report when there is no meaningful fit  
\* No report when approved evidence is insufficient  
\* Two completed reports per session  
\* Two retries after the initial attempt  
\* Twenty-four-hour idle session timeout  
\* Final reports stored as structured JSON  
\* Original job descriptions are not stored  
\* Temporary role snapshots are not persisted in full  
\* Minimal Normalized Role Summaries are stored  
\* Personal names and contact details from job descriptions are not stored  
\* Company name may be stored  
\* Evidence references are stored  
\* Learning metrics are structured and non-identifying  
\* Learning improvements require human approval  
\* All CTAs lead to one shared contact form  
\* Contact details are stored only after explicit form submission  
\* Contact leads may be stored in Excel or Google Sheets for the MVP  
\* The visitor sees a designed report  
\* Report download is deferred  
\* Screenshots are sufficient during the MVP stage

\#\# Assumed for MVP

\* Text paste is the primary job-description input  
\* Reports must be persisted before being marked completed  
\* Session continuity is anonymous  
\* Report switching uses a simple selector  
\* The contact form uses one shared schema  
\* Internal runtime and storage language is English

\#\# Open but Non-Blocking

\* Exact report-retention duration  
\* Final backend storage provider  
\* Final report-selector visual design  
\* Final supported upload formats after text validation is complete  
\* Future report-image or PDF export  
\* Future translated report-display layer  
\* Future CRM or database migration

\---

\# 35\. Definition of Done

The architecture is implemented successfully when:

\* A visitor can ask general portfolio questions  
\* A visitor can paste a job description  
\* Invalid input produces a useful correction path  
\* Missing information produces focused clarification  
\* A valid role produces approved evidence retrieval  
\* Meaningful fit produces a validated report  
\* No meaningful fit produces no report  
\* Insufficient evidence produces no report  
\* The report is stored as structured JSON  
\* The original job description is not stored  
\* A minimal Normalized Role Summary is stored  
\* Evidence references are stored  
\* The visitor sees a designed report  
\* The visitor can switch between two reports  
\* The visitor can request a second report  
\* A third report request is blocked before model execution  
\* Failed attempts do not consume the report allowance  
\* Retry limits are enforced  
\* The visitor can ask report follow-up questions  
\* Follow-up answers use approved evidence  
\* Repeated explanations are avoided  
\* Relevant case studies and sections can be opened  
\* Every Contact CTA opens the same contact form  
\* Contact details are stored only after explicit submission  
\* Contact leads are saved to the selected table  
\* Session expiry is handled safely  
\* Temporary job-description data is discarded  
\* Safe structured events are logged  
\* Stored data supports human-reviewed QA and improvement  
\* The full user journey can be demonstrated within the portfolio website  
