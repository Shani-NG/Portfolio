# CASE STUDY KNOWLEDGE FILE

## EPD — UX from the Heart

KODEX-EPD cardiac imaging and mapping system

Document status: v1.0 — consolidated knowledge source  
Canonical case-study identity: EPD / KODEX-EPD  
Public title: UX from the Heart  
Primary role: Project Manager and UX Designer  
Domain: Medical technology, cardiac electrophysiology, imaging and mapping  
Timeline: Three months

1\. Identity and Naming Rules

Canonical name  
KODEX-EPD is the product name. EPD is the short retrieval name. “UX from the Heart” is the public case-study title and narrative framing.

Known source aliases  
EPD, KODEX-EPD, UX from the Heart, cardiac mapping system, cardiac imaging system, electrophysiology system, and EP procedure system may refer to this same case study.

Interpretation rule  
Do not treat “UX from the Heart” as a separate product. It is the public title for the KODEX-EPD case study.

2\. Source Inventory and Authority

Source A — Current approved case study  
Google Doc: 1M8dhHF-x\_blq2yjTFTqJlUo-IyABkwdPQ7kteXsYiJM  
Relevant tab: EPD case study  
Use: current public narrative, approved project framing, role, users, workflow, solution areas, outcomes, and publication guardrails.  
Authority: primary public source.

Source B — Draft and depth source  
Same Google Doc  
Relevant tab: EPD Draft  
Use: research detail, earlier terminology, process depth, solution rationale, and historical context.  
Authority: supporting source only. Claims that are stronger than the current approved case study require review.

Source C — Earlier portfolio workspace  
Google Doc: 1gO1kM\_DSRlcGRqjwkQFwVA\_JF-UPy4n4WB0XDiUMtV0  
Resolved relevant tab: EPD  
Note: the supplied tab ID no longer exists in the current document topology. The current EPD tab was used because its content matches the intended project source.  
Use: older project narrative and supporting detail.  
Authority: legacy supporting source; never overrides current approved copy.

Conflict resolution  
The current EPD case-study tab governs public claims. Draft and legacy sources may enrich internal retrieval, but exaggerated causal claims, unverified testimonials, and unsupported performance claims must not be published.

3\. Executive Summary

KODEX-EPD is a cardiac imaging and mapping system designed to visualize the anatomy of the heart during electrophysiology procedures and help physicians navigate toward the treatment area without relying on radiation.

The technology was innovative, but the Alpha version did not yet reflect the reality of clinical work. The project redefined the MVP around the actual procedure: two users operating one shared system, a non-linear workflow, variable equipment and room configurations, established clinical conventions, demanding 3D orientation needs, and life-critical feedback.

The resulting design moved the product from a static and linear interface toward a contextual clinical environment. It supported physician–technician coordination, procedure-based setup, equipment-aware tools, clearer visualization, integrated physiological data, structured alerts, and real-time technical support.

4\. Project Context

System type  
A complex medical application for real-time cardiac imaging and mapping during electrophysiology procedures.

Clinical environment  
The physician works beside the patient in a sterile room. The EP technician works outside the room, often behind a glass window. Both users observe the same system state while performing different tasks with different controls.

Product stage  
The work began from an Alpha version and focused on redefining and prioritizing a clinically viable MVP.

Core strategic tension  
The product needed to balance innovation and technical ambition with patient safety, clinical mental models, adoption constraints, and the practical realities of the procedure.

5\. Users and Environment

Electrophysiologist  
\- Stands beside the patient in the sterile room.  
\- Monitors multiple sources and the 3D cardiac model.  
\- Navigates the anatomy and performs selected actions, including basic control through a foot pedal.  
\- Must keep attention on the patient and procedure.

EP technician  
\- Operates the system with keyboard and mouse outside the sterile field.  
\- Configures the environment and connected equipment.  
\- Performs complex system actions and supports the physician continuously.  
\- Handles technical troubleshooting and equipment maintenance during the procedure.

Shared-use constraint  
The two users watch the same display but have different responsibilities, controls, attention demands, and interaction capabilities. The system must support their continuous coordination rather than optimize for only one role.

6\. Role, Ownership, and Collaboration

Documented role  
Project Manager and UX Designer.

Primary responsibility  
Redefine the MVP and bridge the gap between company vision, R\&D development, clinical workflow, and user adoption.

Documented ownership  
\- Learned the clinical ecosystem and procedure workflow.  
\- Reviewed and documented the Alpha product and its proposed workflow.  
\- Conducted stakeholder and EP-professional interviews.  
\- Used controlled-environment observation, usability evaluation, and recordings from human clinical trials as research inputs.  
\- Structured the system information architecture.  
\- Mapped user flows before wireframing.  
\- Prioritized the MVP with company leadership and the head of R\&D.  
\- Created a holistic prototype and detailed documentation.  
\- Collaborated with developers, UI designers, 3D artists, software and hardware engineers, psychologists, and clinical professionals.

7\. Problem Definition

7.1 Workflow mismatch  
The Alpha product assumed a linear sequence, while real procedures changed according to procedure type, active catheter, connected equipment, operating-room configuration, physician preference, and patient condition.

7.2 Multi-user coordination  
Physician and technician shared one system state but performed divergent tasks through different controllers and from different physical locations.

7.3 Setup complexity  
Different rooms, catheters, hardware, and supportive equipment required substantial manual configuration before a procedure.

7.4 Context overload  
A static interface exposed tools and data that were not always relevant to the current equipment or clinical state.

7.5 Clinical mental-model conflict  
Some Alpha choices contradicted established conventions. A theoretically logical overview could be disorienting when physicians were trained on reversed anatomical views. The Alpha color logic also conflicted with the documented ablation convention in which red indicates successful contact.

7.6 3D orientation and occlusion  
Users needed clearer information about catheter direction, active viewpoint, front and back anatomy, and hidden structures.

7.7 Fragmented physiological data  
Relevant ECG signals and respiration graphs were located on external systems, forcing attention shifts across multiple monitors.

7.8 Safety-critical feedback  
The Alpha version lacked one coherent mechanism for errors, warnings, continuous status, and conditions requiring acknowledgment.

8\. Research and Discovery

Research methods documented  
\- Stakeholder interviews.  
\- Interviews with electrophysiology professionals.  
\- Current-state and Alpha-product analysis.  
\- Observation in a controlled company environment.  
\- Iterative usability evaluation.  
\- Review of recordings from human clinical trials.  
\- Feature and component inventory.  
\- Information-architecture mapping.  
\- User-flow validation before wireframing.

Core research conclusions  
\- The product could not be controlled effectively through physician foot pedals alone.  
\- The physician–technician working model needed to be preserved.  
\- Procedure variability required flexible rather than linear navigation.  
\- System setup needed default and customized presets.  
\- Connected hardware should determine which tools and indicators are visible.  
\- Clinical conventions and learned viewpoints should be respected unless a change has clear clinical value.  
\- Visualization needed stronger orientation and occlusion support.  
\- Patient-safety feedback required structured levels of urgency and explicit acknowledgment for critical states.

9\. Documented Solution Areas

9.1 Flexible Clinical Workflow  
The fixed Alpha sequence was replaced by a model that could adapt to procedure type, active catheter, equipment, and evolving clinical state.

Documented value  
The system supported clinical variation instead of forcing every procedure through one path.

9.2 Logic-Based Setup Wizard  
A setup process allowed the technician to prepare the environment before the procedure using:  
\- Procedure-based default presets.  
\- Customized presets.  
\- Hardware-dependent options.  
\- Catheter configurations.  
\- Contextual preferences.

Documented value  
The procedure could begin with the system already configured for its clinical context, reducing manual setup burden.

9.3 Equipment-Aware Contextual Interface  
Connected catheters and supportive equipment influenced the visible tools, indicators, and controls. Relevant elements appeared when needed, while non-relevant options were removed from the immediate view.

Documented value  
Reduced visual noise and cognitive load while preserving access to clinically necessary information.

9.4 Physician–Technician Synchronization  
The workflow preserved the distinct responsibilities of both users while maintaining a synchronized system state on the shared display.

Documented value  
Supported the real operating model rather than attempting to collapse both roles into one interaction pattern.

9.5 Clinical Mental Models and Conventions  
The redesign retained the familiar reversed anatomical viewpoint where research showed that changing it created disorientation. The color logic was corrected to align with the documented clinical convention for successful contact.

Documented value  
Reduced unnecessary relearning in a high-risk environment.

9.6 3D Orientation and Visualization  
The redesigned visualization included:  
\- Catheter-tip coloring.  
\- Direction indicators.  
\- Backwall highlighting.  
\- Clipping-plane capability.  
\- Clear viewpoint indicators.  
\- Scalable, draggable, and collapsible work areas.

Documented value  
Improved interpretation of anatomy, direction, hidden structures, and the primary working area.

9.7 Integrated Physiological Data  
Relevant ECG signals and respiration information were brought into the main working environment.

Documented value  
Reduced the need to shift attention across external monitors and supported a more complete procedural view.

9.8 Structured Notifications and Feedback  
The feedback system used:  
\- Status indicators.  
\- Icons.  
\- Contextual panels.  
\- Text messages.  
\- Voice feedback.  
\- High-risk alerts requiring acknowledgment.

Documented value  
Continuous status could remain visible without assigning every event the same urgency. Critical conditions received direct attention and confirmation.

9.9 Technical Support Integration  
A third-party support application gave the technician a path to investigate and resolve technical issues during the procedure.

Documented value  
Supported technical recovery without unnecessarily disrupting the physician’s workflow.

10\. MVP and Product Decisions

The MVP was redefined and prioritized with leadership and R\&D around the clinical workflow rather than the Alpha feature sequence.

Documented MVP achievements  
\- Simplified the clinical workflow.  
\- Preserved physician–technician coordination.  
\- Added a procedure-aware Setup Wizard.  
\- Added contextual menus and toolbars.  
\- Improved orientation within the 3D cardiac model.  
\- Integrated ECG and respiration data.  
\- Added adaptable work areas.  
\- Created continuous system-status feedback.  
\- Added high-risk alerts requiring acknowledgment.  
\- Added a route to real-time technical support.

11\. Outcomes and Evidence Boundaries

Supported outcomes from the approved source  
\- The MVP launched as scheduled at a Heart Rhythm Society Convention in 2019\.  
\- Users familiar with the Alpha version responded positively to the redesigned workflow, visualization, and interface.  
\- The product achieved successful task completion during evaluation.  
\- The redesign produced a more adaptable and clinically aligned system.  
\- Development continued under Philips after the company’s acquisition.

Claims requiring review before publication  
\- The exact statement that the convention occurred in February 2019\. The source contains this date, but it should be checked before external publication.  
\- Any claim of “critical acclaim from the global clinical community.”  
\- Any claim that the redesign directly accelerated clinical decision-making unless supported by measured evidence.  
\- Any claim that the project established an industry standard.

Explicitly prohibited causal claim  
The acquisition by Philips must not be attributed directly or primarily to this UX redesign. The approved source explicitly states that the acquisition cannot be attributed to UX alone.

Acquisition context  
The source records that the company was acquired by Philips in 2019 in a deal valued at $293 million. This may be presented only as company context, not as a UX outcome or causal business result.

Testimonials  
No direct user quote may be published until the exact quote and speaker authorization are verified. Placeholder quotations must remain unpublished.

12\. Evidence Cards

E-EPD-01 — Clinical Workflow Redefinition  
Claim: Research showed that the Alpha system’s linear flow did not match variable EP procedures, leading to a flexible workflow model.  
Evidence status: documented.  
Capabilities: clinical research, workflow architecture, complex-system UX, MVP definition.

E-EPD-02 — Dual-User Coordination  
Claim: The product was designed around an electrophysiologist and technician sharing one system state while performing different tasks with different controls.  
Evidence status: documented.  
Capabilities: multi-user UX, role coordination, distributed interaction, safety-critical design.

E-EPD-03 — Procedure-Aware Setup  
Claim: A logic-based Setup Wizard used presets and contextual configuration to prepare the environment for each procedure.  
Evidence status: documented solution.  
Capabilities: adaptive workflows, setup design, automation, cognitive-load reduction.

E-EPD-04 — Equipment-Aware Interface  
Claim: The interface surfaced tools and indicators according to connected hardware and clinical state.  
Evidence status: documented solution.  
Capabilities: contextual UX, system-state design, information architecture, progressive disclosure.

E-EPD-05 — Clinical Mental Models  
Claim: The redesign respected learned anatomical viewpoints and corrected color logic based on documented clinical conventions.  
Evidence status: documented research-to-design decision.  
Capabilities: human factors, adoption strategy, medical UX, evidence-based design.

E-EPD-06 — 3D Orientation  
Claim: Direction indicators, catheter-tip visualization, backwall highlighting, clipping, and adaptable work areas improved orientation within the cardiac model.  
Evidence status: documented solution.  
Capabilities: complex visualization, spatial UX, 3D interaction, precision-oriented design.

E-EPD-07 — Integrated Procedural Data  
Claim: ECG and respiration information were incorporated into the main experience to reduce attention shifts.  
Evidence status: documented solution.  
Capabilities: dashboard integration, attention management, clinical information design.

E-EPD-08 — Safety-Critical Feedback  
Claim: Continuous status, multimodal feedback, and acknowledgment-based critical alerts created a structured notification layer.  
Evidence status: documented solution.  
Capabilities: alert design, patient-safety UX, multimodal feedback, error prevention.

E-EPD-09 — MVP Leadership  
Claim: The MVP was redefined and prioritized with leadership and R\&D after research exposed workflow and adoption gaps.  
Evidence status: documented.  
Capabilities: product strategy, project management, prioritization, cross-functional leadership.

E-EPD-10 — Clinical MVP Reception  
Claim: Alpha users responded positively and evaluation recorded successful task completion.  
Evidence status: qualitative and non-quantified.  
Capabilities: usability evaluation, iterative design, product validation.

13\. Capabilities Demonstrated

Primary capabilities  
\- Medical and life-critical UX.  
\- Complex-system information architecture.  
\- Clinical workflow research.  
\- Multi-user coordination.  
\- Adaptive and contextual interfaces.  
\- 3D and spatial visualization.  
\- Human factors and mental-model alignment.  
\- Safety-critical alerts and feedback.  
\- MVP definition and prioritization.  
\- Project management and cross-functional leadership.

Transferable capabilities  
\- Translating technical innovation into adoptable workflows.  
\- Balancing automation with user control.  
\- Designing around hardware constraints.  
\- Integrating multiple data sources into one operational view.  
\- Reducing cognitive load without hiding important information.  
\- Connecting research findings directly to product decisions.

14\. Retrieval and Agent Guidance

Recommended retrieval aliases  
EPD, KODEX-EPD, UX from the Heart, cardiac mapping, cardiac imaging, electrophysiology, EP procedure, medical device UX, operating room UX, physician technician workflow, setup wizard, adaptive interface, 3D heart visualization, catheter orientation, patient safety alerts, clinical mental models, Philips acquisition.

Use this case study when the visitor asks about  
\- Medical products or healthcare UX.  
\- Life-critical or safety-critical systems.  
\- Multi-user workflows.  
\- Hardware and software integration.  
\- Non-linear process design.  
\- Clinical research and adoption.  
\- 3D or spatial interfaces.  
\- Alerts, warnings, status, and acknowledgment.  
\- MVP redefinition and cross-functional delivery.

Response guardrail  
Use the approved project evidence to discuss workflow, setup, contextual interfaces, visualization, feedback, and MVP leadership. Do not infer clinical efficacy, patient outcomes, quantitative time savings, or business causality.

15\. Public and Confidentiality Guardrails

Public-safe  
\- Product purpose at a high level.  
\- User roles and workflow structure.  
\- Approved design rationale and recreated visuals.  
\- Research methods and documented design decisions.  
\- Qualitative reception and evaluation summaries.

Requires approval or verification  
\- Exact clinical trial details.  
\- Exact HRS launch date and event wording.  
\- Direct physician or user quotations.  
\- Quantitative usability or safety results.  
\- Detailed internal technical architecture.  
\- Claims connecting UX directly to acquisition value.

Do not publish  
\- Placeholder testimonials.  
\- Patient-identifiable information.  
\- Unapproved clinical-trial material.  
\- Strong claims from the draft that are absent or softened in the approved case study.

16\. Missing Evidence and Review Flags

Needs review  
\- Verify the exact HRS event date before publishing the month.  
\- Add verified user testimonials only if exact wording and permission are available.  
\- Add quantitative evaluation results only if an approved report exists.  
\- Confirm whether “red indicates successful contact” should be described as an industry-wide convention or as a project-specific documented clinical convention.

No evidence currently available  
\- Measured reduction in setup time.  
\- Measured reduction in errors.  
\- Measured improvement in procedure duration.  
\- Measured patient-safety impact.  
\- Measured adoption rate.  
\- Evidence that UX caused or primarily drove the Philips acquisition.

17\. Validation Checklist

\- Canonical product name is KODEX-EPD.  
\- Public case-study title is UX from the Heart.  
\- EPD and UX from the Heart are not treated as separate projects.  
\- Current approved case study governs public claims.  
\- Draft and legacy material are used only for supporting depth.  
\- Role is Project Manager and UX Designer.  
\- Alpha limitations are distinguished from final MVP solutions.  
\- Clinical efficacy and patient outcomes are not inferred.  
\- Acquisition is context, not a UX outcome.  
\- Placeholder testimonials remain excluded.  
\- Unsupported quantitative claims are not introduced.

18\. Source Traceability Summary

Current public narrative  
Primary source: EPD case study tab in the EPD document.

Research depth and historical rationale  
Supporting sources: EPD Draft and the EPD tab in the earlier portfolio workspace.

Canonical synthesis  
KODEX-EPD became a more clinically aligned MVP by replacing a linear Alpha concept with a flexible, dual-user, equipment-aware workflow. The work connected clinical research, product strategy, system architecture, visualization, safety feedback, and cross-functional delivery while respecting the realities and mental models of electrophysiology practice.  
