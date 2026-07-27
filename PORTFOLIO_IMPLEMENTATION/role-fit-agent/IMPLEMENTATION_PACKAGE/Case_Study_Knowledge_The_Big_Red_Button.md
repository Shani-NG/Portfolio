# **CASE STUDY KNOWLEDGE SOURCE**

## ***The Big Red Button — Technician & Monitor Module***

*From a request for one global reset button to a role-based system-health and targeted-recovery strategy.*

# **DOCUMENT CONTROL**

Knowledge file version: 1.0

Status: Draft for owner review

Language: English

Knowledge ID: kb\_cs\_big\_red\_button

Canonical case-study title: The Big Red Button

Functional aliases: Technician Module; Monitor Module; System Health Management; Smart Recovery

Domain: Naval Command and Control / Mission-Critical Systems

Primary use: Portfolio-agent answers, role-fit analysis, report evidence, and case-study navigation

# **SOURCE RECONCILIATION**

This knowledge file consolidates two multi-tab Google Docs whose titles do not fully match the public case-study title. Their content, users, problem, workflows, and solution logic establish that they describe the same project area.

Source 1 — Dashboard case study

## **Relevant tabs**

* USE CASES — raw field context, user types, operational incidents, functional requirements, and early solution ideas.  
* Tab 6 — structured strategic case-study narrative focused on reducing critical downtime.

Source role: Supporting project source and earlier structured iteration.

Reliability: High for documented context; proposed or future claims are separated below.

Source 2 — Monitor module

## **Relevant tabs**

* Monitor module case study — coherent case-study narrative titled “The Big Red Button.”  
* Monitor Revised Case Study — refined narrative with role, system logic, and implementation boundaries.

Source role: Primary approved narrative and detailed project source.

Reliability: High for project framing and documented design decisions.

Reconciliation rule

The Big Red Button is the portfolio story. Technician Module and Monitor Module are functional names for the product area described by that story. The file title follows the public story; retrieval aliases preserve the source terminology.

# **PROJECT SNAPSHOT**

Role

Product Design Lead and UX Lead.

Project context

A mission-critical naval Command and Control system composed of multiple integrated services, interfaces, infrastructure components, and operational processes.

Core focus

System health, fault diagnosis, operational impact, safe recovery, configuration validation, expert diagnostics, and operational continuity.

Primary users

* Ship Technicians — operational users with limited infrastructure or coding knowledge, focused on restoring service safely and quickly.  
* Shore Engineers / IT Technicians — technically experienced users who need logs, component-level context, and deeper diagnostic controls.  
* System Administrators / Super Admins — users responsible for broader system status, performance, and recurring issue visibility.

# **THE ORIGINAL REQUEST**

The initial request was to create one large reset action that could restart the system remotely without requiring a senior technician or code-level expertise.

This request addressed a real operational need but proposed the wrong level of intervention. A full reset could take approximately 20 minutes, interrupt operational activity, erase or obscure useful diagnostic context, and treat unrelated failures as if they required the same response.

# **THE ACTUAL PROBLEM**

The system lacked a clear, role-appropriate path from failure to action.

At sea

Technicians encountered technical errors they could not interpret. Without targeted tools, they often relied on shore support or restarted the entire system because it was the fastest known workaround.

On shore

Engineers received incomplete incident descriptions and had to search broad raw infrastructure data to identify the relevant service, pod, process, or dependency.

Across roles

The teams lacked a shared language connecting technical failure, operational impact, severity, responsibility, and the next safe action.

# **DOCUMENTED FIELD FAILURES**

The source material includes examples of failure modes that shaped the solution:

* A production environment was shut down accidentally, causing system unavailability.  
* One system was restarted while another remained active, creating a conflict between concurrently running systems.  
* A missing user-to-environment assignment required reconfiguration and caused approximately 20 minutes of downtime.  
* A technician who could not identify the problematic pod used a full system restart as the default recovery method.  
* A display failure triggered overnight escalation across development teams; the eventual fix was a known code-level activation that could have taken about one minute if the knowledge had been accessible.

These incidents are qualitative source evidence. They must not be converted into frequency, savings, or performance metrics without additional documentation.

# **DESIGN CHALLENGE**

Translate complex infrastructure into operational meaning without hiding necessary expert detail or exposing every user to the same level of complexity.

## **The design needed to answer four questions**

* Is the system operational?  
* Which process or capability is affected?  
* Can this issue be resolved safely at the current permission level?  
* When is expert support required?

# **ROLE AND OWNERSHIP**

Documented ownership

* Led UX strategy and product-design direction for the module.  
* Reframed the brief from a global reset control into a broader system-health strategy.  
* Worked with architects, developers, DevOps engineers, field technicians, shore-based technical users, and administrators.  
* Mapped technical failure points to operational impact and user responsibility.  
* Designed role-based monitoring, recovery, configuration, and diagnostic flows.  
* Defined the information hierarchy connecting severity, affected process, recommended action, and technical context.  
* Designed prevention mechanisms for configuration and startup errors.

Do not infer

* Ownership of backend recovery scripts, infrastructure implementation, predictive models, or production deployment unless supported by an additional source.  
* Sole ownership of organizational or engineering outcomes.  
* Quantified downtime reduction or adoption results.

# **RESEARCH AND REASONING**

Evidence inputs

* Field incidents and technician statements.  
* Differences in technical expertise and responsibility across sea and shore environments.  
* Existing failure, reset, configuration, and escalation workflows.  
* Infrastructure concepts including pods, services, APIs, Kafka, databases, and dependencies.  
* Known recovery processes used by experienced technical staff.

Reasoning shift

The reset was treated as a symptom of a knowledge and system-visibility gap. The solution moved from “restart everything” toward:

1\. Detect and classify the failure.

2\. Translate it into operational impact.

3\. Present the smallest safe action.

4\. Preserve useful diagnostic context.

5\. Prevent avoidable failures where possible.

6\. Build a structured history that can support learning.

# **SOLUTION ARCHITECTURE**

1\. Shared system-health model

One monitoring model served three levels of control while adapting information and actions to each role.

Ship Technician view

* Clear system status.  
* Operational impact rather than infrastructure-only terminology.  
* Guided recovery for recognized faults.  
* Minimal exposure to irrelevant technical detail.

Shore Engineer view

* Detailed diagnostics.  
* Severity and component filters.  
* Focused time ranges.  
* Relevant log export.  
* Process- or service-level control.  
* Direct movement from an alert to technical context.

System Administrator view

* Broader health overview.  
* Recurring-issue visibility.  
* Cross-system status and performance perspective.

2\. Contextual error model

## **Detected faults were structured through**

* Severity.  
* Error or fault identity.  
* Affected process, capability, service, or interface.  
* Detection time.  
* Status.  
* Recommended next action.  
* Additional technical context according to permission.

Severity labels mentioned across iterations include Fatal, Error, Warn, and visual critical/medium states. The final canonical severity vocabulary should follow the implemented interface or current public case study.

3\. Smart Recovery

Known failures were connected to focused recovery actions rather than a blanket reset.

## **For a recognized fault, the interface could communicate**

* What failed.  
* Which operational capability was affected.  
* How severe the issue was.  
* What action was recommended.  
* What the proposed action would affect.

A contextual “Fix Issue” action could trigger a predefined technical process in the background, such as restarting a specific service or process. The system supplied meaning and guidance while the user remained within a safe, permission-aware flow.

4\. Prevention before recovery

Research showed that some failures originated during configuration or startup.

## **The configuration flow**

* Adapted to sea and shore environments.  
* Exposed only relevant settings.  
* Validated mandatory information.  
* Prevented startup until critical conditions were satisfied.  
* Distinguished production, staging, and training environments.  
* Accounted for authentication, permissions, and environment-specific values.

The objective was to prevent avoidable failures from reaching the operational user.

5\. Diagnostic log and export

## **The expert layer supported**

* Filtering by severity.  
* Filtering by service or component.  
* Selecting a focused time window.  
* Exporting only relevant data.  
* Tracking export progress or status.  
* Reducing noise before escalation.  
* Preserving a structured incident record.

6\. Resolution history and learning

Resolved faults could move into an archive or error-report view with consistent structured data.

An early concept proposed labeled resolution documentation, including a controlled “Other” option, rather than relying only on unstructured free text. This would help technicians understand how similar failures were resolved and create a reusable operational knowledge layer.

Implementation status: Proposed or partially specified in the source material; confirm against the final product before presenting as implemented.

7\. AI-assisted guidance

An early concept proposed an agent that could retrieve relevant prior incidents and suggest potential solutions, especially when a fault could not be resolved by a predefined restart action.

Implementation status: Future or conceptual direction unless a later approved source confirms implementation.

# **CORE WORKFLOWS**

Workflow A — Detect and recover

System detects fault → user sees severity and operational impact → user opens fault details → interface explains consequences → eligible recovery action is offered → focused process runs → progress is shown → resolved incident moves to history.

Workflow B — Investigate and escalate

User opens alert → filters or narrows technical context → selects relevant time range and components → exports focused logs → shares a clearer incident package with expert support.

Workflow C — Configure safely

User identifies environment and required settings → interface exposes relevant fields → mandatory values and dependencies are validated → startup remains unavailable until critical conditions are met → approved configuration is saved and can be edited.

Workflow D — Learn from prior resolutions

User searches or reviews similar incidents → structured resolution labels and contextual data explain how prior faults were handled → user applies an eligible action or escalates with better context.

# **BEFORE AND AFTER**

## **Before**

* Technical failures appeared without operational context.  
* Ship technicians relied on shore support or full system resets.  
* Configuration mistakes could create immediate downtime.  
* Engineers searched broad raw logs.  
* Different roles lacked a shared health model.  
* Expert knowledge remained concentrated in individuals.

After / designed state

* Errors were connected to impact, severity, and next steps.  
* Known failures had targeted recovery actions.  
* Configuration was validated before startup.  
* Experts received focused diagnostic tools.  
* Role-based views used one shared monitoring model.  
* Incident history created a foundation for organizational learning.

# **OUTCOMES AND CLAIM BOUNDARIES**

Documented design outcome

The project transformed a narrow reset-button request into a role-based system-health strategy covering diagnosis, targeted recovery, prevention, expert investigation, and structured learning.

Supported qualitative value

* A clearer path from fault to action.  
* Reduced dependency on deep technical knowledge for recognized failures.  
* Better alignment between field technicians and shore engineers.  
* Lower cognitive load through operationally meaningful error information.  
* More focused diagnostics and escalation.  
* Safer configuration and recovery flows.

Not yet verified as measured outcomes

* Exact reduction in downtime.  
* Exact reduction in support calls.  
* Predictive-maintenance performance.  
* Adoption, satisfaction, or resolution-rate metrics.  
* Financial or operational savings.

# **FUTURE DIRECTION**

## **The structured failure record could support**

* Identification of recurring failure patterns.  
* Detection of degradation before full outage.  
* Preventive recommendations.  
* Predictive maintenance.  
* AI-supported retrieval of similar incidents and solutions.

These are future capabilities or strategic extensions, not evidence of the initial implementation.

# **CAPABILITY MAP**

Strong direct evidence

* UX strategy for mission-critical systems.  
* Reframing a feature request into a system-level product strategy.  
* Role-based information architecture.  
* Complex-system simplification without removing expert depth.  
* Error prevention and recovery UX.  
* Decision-support and operational-status design.  
* Cross-functional work with technical stakeholders.  
* Translating infrastructure into user-facing meaning.  
* Designing for different expertise and permission levels.  
* Structured logs, diagnostics, and escalation workflows.

Transferable evidence

* Service recovery and incident-management products.  
* Observability and monitoring platforms.  
* Enterprise admin tools.  
* DevOps-facing UX.  
* Safety-critical and high-reliability environments.  
* AI-assisted support and knowledge-retrieval concepts.  
* Configuration-heavy products.

# **EVIDENCE CARDS**

EV-BRB-01 — Reframing the brief

## **Claim**

Shani reframed a request for one global reset button into a broader system-health and targeted-recovery strategy.

## **Evidence basis**

Both source documents describe the original “big red button” request and the shift toward diagnosis, impact, smallest safe action, and prevention.

Match use

UX strategy; product thinking; problem framing; innovation; complex systems.

## **Reliability**

High.

Limit

Do not claim that every proposed capability was implemented.

EV-BRB-02 — Role-based complexity

## **Claim**

The module adapted system-health information and controls for ship technicians, shore engineers, and system administrators.

## **Evidence basis**

The case-study narratives define three user groups with different expertise, responsibilities, and information needs.

Match use

Role-based UX; permissions; enterprise systems; information architecture.

## **Reliability**

High.

EV-BRB-03 — Infrastructure-to-operational translation

## **Claim**

The design connected technical failures to severity, affected operational capability, and the next safe action.

## **Evidence basis**

The sources describe mapping pods, services, APIs, and dependencies to operational impact and contextual fault information.

Match use

Complex data; decision support; technical UX; cross-functional translation.

## **Reliability**

High.

EV-BRB-04 — Targeted recovery

## **Claim**

Known failures were designed to trigger focused recovery actions, such as restarting a specific service, instead of resetting the entire system.

## **Evidence basis**

Smart Recovery and Fix Issue flows in the detailed case-study sources.

Match use

Error recovery; workflow automation; operational continuity; human oversight.

## **Reliability**

High for the designed solution.

Limit

Backend implementation ownership and production performance are not documented.

EV-BRB-05 — Prevention through configuration validation

## **Claim**

Shani designed an environment-aware setup flow that validated critical values and prevented startup until required conditions were met.

## **Evidence basis**

The Monitor Module case-study sources.

Match use

Error prevention; configuration UX; guardrails; high-risk workflows.

## **Reliability**

High.

EV-BRB-06 — Focused expert diagnostics

## **Claim**

The expert layer enabled users to narrow logs by severity, service, component, and time range and export relevant diagnostic data.

## **Evidence basis**

The Monitor Module case-study narrative and early functional requirements.

Match use

Admin tools; observability; DevOps UX; data filtering; escalation.

## **Reliability**

High for the designed workflow.

EV-BRB-07 — Shared language across technical roles

## **Claim**

The error model created a shared language between field technicians and shore engineers by connecting technical events with operational impact.

## **Evidence basis**

Both the raw use cases and structured case-study narratives.

Match use

Stakeholder alignment; collaboration; service operations; terminology design.

## **Reliability**

High.

EV-BRB-08 — Learning-system foundation

## **Claim**

Structured incident and resolution history was designed as a foundation for learning from recurring faults.

## **Evidence basis**

The error-report archive and labeled-resolution concept in the supporting source.

Match use

Knowledge management; continuous improvement; support operations.

## **Reliability**

Medium.

Limit

The final implementation status requires confirmation.

EV-BRB-09 — AI-assisted support direction

## **Claim**

The project explored an agent that could retrieve relevant prior incidents and suggest potential solutions.

## **Evidence basis**

Early functional concept in the USE CASES tab.

Match use

AI-assisted support; RAG; agentic workflows; knowledge retrieval.

## **Reliability**

Medium as a documented concept.

Limit

Present only as proposed future direction, not a shipped capability.

# **RETRIEVAL CONCEPTS AND ALIASES**

Primary concepts

mission-critical UX; naval C2; command and control; technician module; monitor module; system health; operational continuity; fault diagnosis; targeted recovery; smart recovery; error prevention; configuration validation; role-based UX; diagnostic logs; incident history.

Technical aliases

pods; services; processes; APIs; Kafka; databases; infrastructure dependencies; severity; log export; environment configuration; production; staging; training.

User and workflow aliases

ship technician; shore engineer; IT technician; system administrator; super admin; reset; restart; Fix Issue; fault details; error report; recovery history; escalation.

# **PUBLIC NAVIGATION AND ANCHORS**

Public case-study title

The Big Red Button.

Recommended evidence sections

* The Reset Was Not the Solution  
* Translating Infrastructure Into Operational Meaning  
* Smart Recovery: Fix What Failed  
* Prevention Before Recovery  
* Expert Tools Without Expert Complexity for Everyone  
* One System, Three Levels of Control  
* What Changed  
* From Recovery to Prevention  
* The Product Shift

Anchor status

Exact live-site URLs and anchor IDs were not included in the supplied sources. Add them after checking the current portfolio implementation.

# **AGENT GUARDRAILS**

The agent may say

* The project concerned a mission-critical naval Command and Control system.  
* The original request was a global reset control.  
* Shani led UX strategy and product-design direction.  
* The solution used role-based system-health, contextual faults, targeted recovery, configuration validation, and focused diagnostics.  
* Predictive maintenance and AI guidance were future directions where explicitly labeled.

The agent must not say

* That measured downtime reduction was proven.  
* That predictive maintenance or the AI agent was deployed.  
* That Shani wrote recovery scripts or owned infrastructure engineering.  
* That every feature from early use cases reached production.  
* That confidential system architecture, operational procedures, environments, or security details are publicly available.  
* That qualitative field incidents represent statistical frequency.

# **CONFIDENTIALITY**

Public-safe

High-level problem, users, UX strategy, role-based logic, targeted recovery, configuration validation, diagnostic workflows, and qualitative before/after comparison.

Internal or review-required

Exact architecture, code, service names, deployment topology, operational procedures, security context, real environment identifiers, and any incident detail that could expose sensitive system behavior.

# **REVIEW FLAGS**

* Confirm the exact public title spelling and whether “Technician Module” should appear in the subtitle.  
* Confirm whether approximately 20 minutes is approved for public use.  
* Confirm whether the contextual recovery action was implemented, prototyped, or specified.  
* Confirm final severity vocabulary.  
* Confirm implementation status of resolution labeling and history.  
* Keep AI guidance and predictive maintenance labeled as future direction unless newer evidence is supplied.  
* Add live portfolio URL and section anchors.  
* Confirm whether “Product Design Lead and UX Lead” is the preferred public role label.

# **SOURCE TRACEABILITY**

Source A

Dashboard case study — Google Doc ID: 1ENKzKJJwQSeHhgBjkqZbm096yErB1TLpE0MUT\_odWNw

Relevant tabs: USE CASES; Tab 6\.

Contribution: raw incidents, user types, early requirements, strategic framing, and proposed future capabilities.

Source B

Monitor module — Google Doc ID: 188BJi0rdJGFHXTdWU\_h9z7sUMqNqM8GaamQRs3yVLfQ

Relevant tabs: Monitor module case study; Monitor Revised Case Study.

Contribution: primary narrative, role, problem framing, solution logic, workflow boundaries, before/after state, and future direction.

# **SOURCE BOUNDARY**

This file is the consolidated knowledge source for the case study. The original Google Docs remain unchanged and retain their value as traceable raw and approved sources.