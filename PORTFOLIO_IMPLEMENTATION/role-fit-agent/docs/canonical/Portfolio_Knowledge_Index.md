# PORTFOLIO KNOWLEDGE INDEX

## Routing map for portfolio-agent retrieval, role-fit analysis, evidence selection, and case-study navigation

Document status: v1.1 — consolidated routing and role-interpretation index  
Language: English  
Scope: CV, general profile, and six approved case-study knowledge files
Primary use: Retrieval routing, evidence selection, report generation, follow-up questions, and portfolio navigation

1\. Purpose

This document is the routing layer for the portfolio-agent knowledge base. It does not replace or duplicate the underlying knowledge files. It tells the system which source to retrieve, what each source can safely support, how aliases should be resolved, and when a claim requires project-level evidence rather than CV-level evidence.

2\. Source-of-Truth Hierarchy

1\. Explicit user-approved decisions  
These override older titles, drafts, and conflicting source wording.

2\. Current approved Knowledge Files  
These are the canonical retrieval sources for the MVP.

3\. Current approved public case-study content  
This governs public wording, public anchors, and publication boundaries.

4\. Supporting source documents and older iterations  
These may add context but must not override current approved claims.

5\. Interpretation or transferability  
Inferences must be clearly labeled and must never be presented as documented fact.

3\. Knowledge Base Inventory

A. CV\_Knowledge  
Document ID: 1UX0bX7TrU2I2VZsjEWUbDlKLQOrgWzmZEF9GVEO4Rxs  
URL: https://docs.google.com/document/d/1UX0bX7TrU2I2VZsjEWUbDlKLQOrgWzmZEF9GVEO4Rxs/edit  
Primary use: Career facts, titles, dates, education, tools, domains, leadership scope, and high-level professional capabilities.  
Use for: Initial role-fit mapping and broad professional questions.  
Do not use for: Detailed project outcomes, precise workflow claims, or project-specific proof.

B. General\_Profile\_Knowledge  
Document ID: 11dHkGnAHdn\_lmgWGU7gfWMHjA3wsS8w7cPPGKcDS430  
URL: https://docs.google.com/document/d/11dHkGnAHdn\_lmgWGU7gfWMHjA3wsS8w7cPPGKcDS430/edit  
Primary use: Working style, values, leadership approach, collaboration patterns, motivation, creative orientation, and growth direction.  
Use for: Culture-fit questions, leadership-style questions, career narrative, and conversational personalization.  
Do not use for: Hard professional qualification claims unless supported by the CV or a case study.

C. Case\_Study\_Knowledge\_The\_Big\_Red\_Button  
Document ID: 1tIiEU9fa3Ko6oKLsIck4sKAS3xP2wQaSRJO2nnQp91s  
URL: https://docs.google.com/document/d/1tIiEU9fa3Ko6oKLsIck4sKAS3xP2wQaSRJO2nnQp91s/edit  
Canonical identity: The Big Red Button  
Primary aliases: Technician Module, Monitor Module, System Health Management, Smart Recovery.  
Primary use: Monitoring, troubleshooting, recovery workflows, technical users, system health, role-based diagnostics, and trustworthy automation.  
Best evidence areas: Complex-system diagnosis, operational UX, recovery logic, human control, auditability, and technician workflows.

D. Case\_Study\_Knowledge\_C4I  
Document ID: 1WVc4pZ9JrK2iwM3Ylxjiujvdr\_Srg5cw3XnwNWlddJ0  
URL: https://docs.google.com/document/d/1WVc4pZ9JrK2iwM3Ylxjiujvdr\_Srg5cw3XnwNWlddJ0/edit  
Canonical identity: C4I  
Primary aliases: C2, Command & Control, ZOHARIM, Beyond Clarity, 2030 Vision.  
Primary use: Mission-critical systems, maritime command and control, situational awareness, information fusion, permissions, decision support, and human-centered autonomy.  
Critical rule: 2030 is the future vision of the same C4I system, not a separate implemented project.

E. Case\_Study\_Knowledge\_EPD  
Document ID: 1LEBNwsnfqN5U5koPcMvBQhWoopI5vWk8lPNdx-nths4  
URL: https://docs.google.com/document/d/1LEBNwsnfqN5U5koPcMvBQhWoopI5vWk8lPNdx-nths4/edit  
Canonical identity: KODEX-EPD  
Public title: UX from the Heart  
Primary aliases: EPD, cardiac mapping, cardiac imaging, electrophysiology system.  
Primary use: Medical-device UX, clinical workflows, physician–technician coordination, 3D visualization, safety-critical alerts, and MVP redefinition.  
Critical rule: Philips acquisition is business context only and must not be attributed to the UX work.

F. Case\_Study\_Knowledge\_Monitoring\_and\_Product\_Intelligence  
Document ID: 1JBdT2Hq3xn4jbFD8JriTkdDfy5yFXkAZOiNr\_LLHSn0  
URL: https://docs.google.com/document/d/1JBdT2Hq3xn4jbFD8JriTkdDfy5yFXkAZOiNr\_LLHSn0/edit  
Canonical identity: Monitoring and Product Intelligence  
Navigation label: Data Driven Design  
Primary aliases: Behavioral Analytics, Product Intelligence, Matomo Initiative, Product Learning System.  
Primary use: Product strategy, behavioral analytics, measurement architecture, adoption, discoverability, release evaluation, and evidence-based prioritization.  
Critical rule: Matomo is infrastructure, not the product. More than 100 users describes platform reach, not a research sample.

G. Case\_Study\_Knowledge\_HOWTOOL  
Document ID: 19NVP8BTGZW68rVvUnOm53nOnD007qNyAHAGHUriHwXk  
URL: https://docs.google.com/document/d/19NVP8BTGZW68rVvUnOm53nOnD007qNyAHAGHUriHwXk/edit  
Canonical identity: HOWTOOL  
Public title: Nobody Reads the Manual  
Primary aliases: Beyond the Manual, KMS redesign, interactive manual, operational guidance platform.  
Primary use: Knowledge-management systems, SaaS redesign, publishing validation, web-to-mobile workflows, content authoring, and structured pre-AI automation.  
Critical rule: HOWTOOL did not use generative AI, RAG, agents, or prompt engineering.

H. Case\_Study\_Knowledge\_Role\_Fit\_Agent
Canonical file: `Case_Study_Knowledge_Role_Fit_Agent.md`
Canonical identity: Role Fit Agent
Primary use: Evidence-based AI product architecture, governed role analysis, deterministic evidence selection, conversation design, QA, and privacy-aware persistence.
Critical rule: Use only the four approved evidence cards in the canonical file; do not infer ML engineering, model research, enterprise-scale governance, or numeric hiring prediction.

4\. Retrieval Routing by User Intent

Career history, titles, dates, education, tools  
Primary source: CV\_Knowledge  
Secondary source: Relevant case study for proof.

Leadership style, collaboration, motivation, values  
Primary source: General\_Profile\_Knowledge  
Secondary source: CV or case study when the answer requires professional evidence.

Mission-critical and defense systems  
Primary source: C4I  
Secondary source: The Big Red Button

Technical troubleshooting, monitoring, recovery, diagnostics  
Primary source: The Big Red Button  
Secondary source: Monitoring and Product Intelligence when the question concerns telemetry or product learning.

Medical, clinical, life-critical, or 3D interfaces  
Primary source: EPD

Data-driven design, analytics, KPIs, adoption, and product intelligence  
Primary source: Monitoring and Product Intelligence

Knowledge management, technical documentation, content operations, and publishing workflows  
Primary source: HOWTOOL

AI, automation, and human control  
Primary source depends on intent:  
\- Current AI-augmented professional practice: CV  
\- Human-centered autonomy and future systems: C4I  
\- Trustworthy recovery automation: The Big Red Button  
\- Structured pre-AI knowledge automation: HOWTOOL  
\- Measurement and learning systems: Monitoring and Product Intelligence

5\. Capability-to-Evidence Routing

Strategic UX leadership  
Primary evidence: CV, C4I, Monitoring and Product Intelligence  
Supporting evidence: EPD, HOWTOOL

Complex systems architecture  
Primary evidence: C4I, The Big Red Button, EPD  
Supporting evidence: HOWTOOL

Product strategy and MVP definition  
Primary evidence: EPD, Monitoring and Product Intelligence, HOWTOOL  
Supporting evidence: CV

Cross-functional alignment  
Primary evidence: C4I, EPD, Monitoring and Product Intelligence  
Supporting evidence: CV and General Profile

Mission-critical UX  
Primary evidence: C4I, The Big Red Button  
Supporting evidence: EPD

Medical-device and clinical UX  
Primary evidence: EPD

Decision-support systems  
Primary evidence: C4I  
Supporting evidence: The Big Red Button

Monitoring, diagnostics, and recovery  
Primary evidence: The Big Red Button  
Supporting evidence: Monitoring and Product Intelligence

Behavioral analytics and measurement  
Primary evidence: Monitoring and Product Intelligence

Information architecture and workflow simplification  
Primary evidence: HOWTOOL, EPD, C4I  
Supporting evidence: The Big Red Button

Role-based and personalized UX  
Primary evidence: C4I, HOWTOOL  
Supporting evidence: The Big Red Button

Safety-critical alerts and feedback  
Primary evidence: EPD  
Supporting evidence: The Big Red Button

Knowledge systems and operational guidance  
Primary evidence: HOWTOOL  
Supporting evidence: The Big Red Button

AI-augmented UX practice  
Primary evidence: CV  
Supporting evidence: C4I future vision and General Profile  
Guardrail: Do not infer engineering or model-development expertise.

Facilitation, mentoring, and organizational learning  
Primary evidence: CV and General Profile  
Supporting evidence: Monitoring and Product Intelligence and HOWTOOL

6\. Report Evidence Selection Rules

For every extracted job requirement:

1\. Build a bounded candidate set for the specific requirement from validated canonical evidence.
2\. Prefer the strongest qualifying case-study evidence.
3\. Use CV evidence only when no qualifying case-study evidence supports that requirement.
4\. Prefer documented implementation evidence over general positioning.  
5\. Prefer the most specific Evidence Card over a broad project summary.  
6\. Separate current implementation, proposed concept, and future vision.  
7\. Attach reliability and visibility boundaries.  
8\. Link to a public case-study anchor only when an approved anchor exists.  
9\. If no approved public anchor exists, link to the case-study page root rather than inventing an anchor.  
10\. Never use sensitive personal information, security-clearance details, or confidential operational details in a public report.

7\. Match Classification Rules

Direct  
The source explicitly documents the required capability, responsibility, method, or domain.

Semantic  
The source uses different terminology but documents substantially equivalent experience.

Transferable  
The experience is relevant through a credible shared capability, but the exact domain or task is different.

Partial  
Only part of the requirement is supported, or the depth cannot be fully verified.

Insufficient evidence  
The available sources do not provide enough support to classify the requirement confidently.

Real gap  
The requirement is clearly absent or contradicted by the approved knowledge sources.

8\. Evidence Quality and Reliability

High  
Directly documented in an approved CV or current Knowledge File, with clear role and context.

Medium  
Documented but qualitative, interpretive, broad, or lacking verified depth or outcomes.

Low  
Legacy, proposed, future-facing, or incomplete information that may support exploration but not a firm claim.

Do not use  
Unverified metrics, placeholder testimonials, confidential details, exaggerated causal claims, or unsupported technical ownership.

9\. Public Visibility Rules

Public-safe  
Approved high-level career facts, skills, methods, anonymized project descriptions, approved visuals, and qualitative outcomes.

Internal-only or restricted  
Personal family details, sensitive career reflections, active security clearance, confidential system details, unapproved screenshots, and private organizational conflict.

Conditional  
Future vision, interpretations, acquisition context, reach statements, and non-quantified outcomes must include the relevant caution or qualification.

10\. Coverage Check Against the Report Data Model

Requirement extraction  
Covered by: CV capabilities, case-study capabilities, aliases, and retrieval terms.  
Status: Covered.

Match type  
Covered by: Direct, Semantic, Transferable, Partial, Insufficient Evidence, and Real Gap classifications.  
Status: Covered.

Evidence item  
Covered by: Evidence Cards in every Knowledge File.  
Status: Covered.

Evidence source  
Covered by: Document IDs, source traceability, and canonical file names.  
Status: Covered.

Reliability or confidence  
Covered by: Evidence status, reliability notes, and source hierarchy.  
Status: Covered, but should be normalized to one shared field in implementation.

Gap explanation  
Covered by: Guardrails, missing-evidence sections, and review flags.  
Status: Covered.

Recommended case study  
Covered by: Capability-to-evidence routing and user-intent routing.  
Status: Covered.

Public anchor  
Covered partially.  
Status: Partial. C4I and Monitoring include explicit public anchors. Other case studies may require final website-anchor confirmation.

Visibility  
Covered by: Public, internal, restricted, and conditional-use rules.  
Status: Covered.

11\. Current Gaps and Non-Blocking Review Items

A. Public anchors are not consistently finalized across all five case studies.  
Impact: The report can still recommend the correct case study, but some deep links may initially route to the page root.  
Action: Finalize anchors during website implementation or content QA.

B. Evidence reliability labels are not fully normalized across every file.  
Impact: The meaning is present, but implementation should map all variants into High, Medium, or Low.  
Action: Normalize during report-generation logic.

C. Some source documents in the folder do not have standalone MVP Knowledge Files.  
Examples: ULS Annotations and Strips Controls.  
Interpretation: They are not currently part of the approved five-case-study MVP knowledge set.  
Action: Keep out of retrieval unless the user explicitly adds them later.

D. Several outcomes remain qualitative.  
Impact: The agent must not invent metrics.  
Action: Use mechanism, decision, and qualitative impact evidence.

E. CV role status and dates may require later maintenance.  
Impact: Current approved CV remains authoritative until replaced.  
Action: Update only through a new approved CV version.

12\. MVP Retrieval Set

The approved MVP retrieval set is limited to:  
\- CV\_Knowledge  
\- General\_Profile\_Knowledge  
\- Case\_Study\_Knowledge\_The\_Big\_Red\_Button  
\- Case\_Study\_Knowledge\_C4I  
\- Case\_Study\_Knowledge\_EPD  
\- Case\_Study\_Knowledge\_Monitoring\_and\_Product\_Intelligence  
\- Case\_Study\_Knowledge\_HOWTOOL  
\- Portfolio\_Knowledge\_Index

Original source documents remain traceability and maintenance sources. They should not be retrieved directly by the production agent when an approved Knowledge File exists.

13\. Recommended Retrieval Sequence

For general portfolio questions  
1\. Identify intent.  
2\. Route through this index.  
3\. Retrieve one primary Knowledge File.  
4\. Retrieve a second file only when needed for evidence or comparison.  
5\. Answer with the narrowest sufficient evidence.

For job-fit analysis  
1\. Parse the job description into atomic requirements.  
2\. Retrieve CV evidence for each requirement.  
3\. Retrieve the strongest project Evidence Card.  
4\. Assign match type and reliability.  
5\. Identify missing evidence or real gaps.  
6\. Recommend the most relevant case-study page and anchor.  
7\. Generate the report without numeric fit scoring.

For follow-up questions  
1\. Preserve the report requirement and selected evidence context.  
2\. Retrieve the original Evidence Card and nearby project detail.  
3\. Explain the reasoning without introducing new unsupported claims.  
4\. Offer navigation to the relevant case-study evidence.

14\. Validation Checklist

\- Every active Knowledge File has one canonical identity.  
\- Aliases route to the correct canonical file.  
\- CV claims are separated from project evidence.  
\- Personal profile information is not used as hard qualification evidence.  
\- Future concepts are not presented as implemented functionality.  
\- Sensitive and confidential details remain excluded.  
\- Metrics are not invented.  
\- The strongest specific Evidence Card is preferred.  
\- Public anchors are used only when approved.  
\- Original source documents do not bypass approved Knowledge Files.

15\. Current Layer Status

Knowledge-file generation: Complete for the approved MVP scope.  
Knowledge routing index: Complete.  
Report-model coverage: Sufficient for an end-to-end test.  
Role-fit validation: Completed through cross-role simulations covering UX/Product Design, Innovation Lead, AI Strategy, AI implementation, Product Management, adjacent domains, misleading job titles, hard constraints, and potential overqualification. The routing layer is ready for final agent-prompt and implementation work.

16\. Role Interpretation and Career-Transition Routing

Purpose  
This layer prevents literal keyword matching from either rejecting credible adjacent opportunities or overstating suitability for an unrelated professional discipline.

16.1 Classify the professional role family first  
Before matching individual requirements, classify the role by responsibilities, required qualifications, and professional discipline. The title alone is not authoritative.

Supported role families for the current portfolio-agent scope  
\- UX / Product Design.  
\- UX Strategy and Design Leadership.  
\- Innovation Leadership and Digital Transformation.  
\- AI Strategy and Organizational AI Adoption.  
\- Junior-to-mid AI Implementation or AI Product roles where UX, product framing, workflow design, and implementation training are relevant foundations.  
\- Adjacent Product Management roles when product ownership, research, strategy, and cross-functional leadership are central.

Out-of-scope example  
A role titled “System Designer” that requires an engineering degree, system verification and validation, regulatory engineering, and technical risk ownership belongs to Systems Engineering rather than UX or product design.

16.2 Career-transition classification  
Use one of the following internal transition labels:  
\- same-role.  
\- adjacent-role.  
\- role-expansion.  
\- domain-transition.  
\- profession-transition.  
\- unrelated-role.

Innovation Lead interpretation  
Innovation Lead is an existing and supported professional direction, not a speculative career switch. Route primarily to CV evidence, General Profile, Monitoring and Product Intelligence, facilitation and organizational-innovation evidence, and relevant strategic project leadership.

AI implementation interpretation  
Junior-to-mid AI implementation or AI-product opportunities may be relevant through an adjacent-role or domain-transition path. Use documented AI-augmented UX practice, RAG and LLM-related workflows, Vibe Coding, organizational adoption, product architecture, and current implementation training. The user has confirmed completion of an AI implementation course; the canonical CV knowledge file remains pending a factual version update before this is used as public CV evidence.

Guardrail  
Do not infer software-engineering, ML-engineering, model-research, enterprise AI-governance ownership, or years of dedicated AI implementation experience beyond the approved sources.

16.3 Interpret each requirement through its underlying capability  
For every requirement, record internally:  
\- requirement priority.  
\- constraint type.  
\- underlying capability.  
\- domain dependency.  
\- capability fit.  
\- context fit.  
\- evidence strength.  
\- bridgeability.  
\- verified outcome evidence.

A stated must-have influences the result but does not automatically determine it. First determine whether the underlying capability is absent, indirectly demonstrated, or strongly transferable.

16.4 Capability versus context  
Domain, audience, platform, vocabulary, and business-model differences are not automatically capability gaps.

Examples  
\- Mobile UX may be supported by documented mobile and web-to-mobile work even when most experience was not in high-volume B2C funnels. The consumer-funnel context remains a qualification, not proof that mobile capability is absent.  
\- Gaming experience may connect to adoption, discoverability, task completion, feedback, motivation, and repeated behavior. Specific reward economies, monetization, streaks, progression, and near-miss mechanics remain direct-context gaps when unsupported.  
\- Healthcare experience may transfer strongly across clinical domains even when the exact specialty differs.  
\- Cybersecurity knowledge may be learnable context for a complex enterprise UX role, but may be highly dependent or critical for a deeply technical security-product role.

16.5 Bridgeability  
Bridgeable differences may include:  
\- industry domain.  
\- user population.  
\- specific software tool.  
\- platform emphasis.  
\- product vocabulary.  
\- learnable engagement pattern.

Potentially non-bridgeable constraints include:  
\- mandatory professional license or credential.  
\- legal work authorization.  
\- required language that is not supported.  
\- engineering degree for an engineering discipline.  
\- deep coding or technical ownership absent from the evidence.  
\- a core professional responsibility from a different discipline.

16.6 Material-gap rule  
Use a material or real gap only when the underlying capability itself is missing, contradicted, or blocked by a non-bridgeable constraint. Do not assign a real gap solely because the exact industry, audience, platform, or terminology differs.

16.7 Seniority and overqualification  
Evaluate both ability and career-level alignment.

Internal seniority alignment  
\- underqualified.  
\- slightly-below.  
\- aligned.  
\- above.  
\- potentially-overqualified.

A candidate may be a strong capability fit but potentially overqualified when the role offers narrower ownership, lower strategic influence, an existing lead above the role, or a significantly lower experience threshold.

16.8 Measurement capability versus measured outcomes  
Keep separate:  
\- ability to define KPIs, measurement architecture, telemetry, task success, adoption, discoverability, and evaluation logic.  
\- verified quantified commercial outcomes such as revenue, ARPU, retention lift, conversion lift, ROI, or A/B-test results.

Missing public metrics must not erase documented measurement capability. The report must state the evidence boundary clearly.

16.9 Overall-fit interpretation  
Overall fit is holistic and evidence-based, not a count of literal phrase matches.

Allowed visible interpretations include:  
\- Strong Fit.  
\- Good Fit.  
\- Good Fit — Domain Transition.  
\- Good Fit — Role Expansion.  
\- Good Fit — With Evidence Gaps.  
\- Strong Fit — Potentially Overqualified.  
\- Partial Fit.  
\- Adjacent Opportunity.  
\- Insufficient Evidence.  
\- Not Relevant Professional Track.

The visible V1 report may continue using the approved Strong, Good, and Partial illustration states. Transition, evidence, and seniority qualifiers should be expressed in the rationale and existing report components rather than creating a new major report section.

16.10 Validation rules  
\- Role family is determined before requirement matching.  
\- Job-title similarity never overrides professional discipline.  
\- Must-have wording never acts as an automatic knockout without capability and bridgeability analysis.  
\- Domain mismatch is not automatically a capability gap.  
\- Transferability must cite approved evidence and explain the shared capability.  
\- A qualifier must not conceal a meaningful direct-context gap.  
\- Overqualification is not presented as failure or superiority; it is a career-alignment consideration.  
\- Innovation Lead opportunities are treated as an established target path.  
\- Junior-to-mid AI implementation opportunities are evaluated as an intentional adjacent path with transparent implementation-depth limits.  
\- Quantified business impact is never inferred from measurement strategy alone.  
