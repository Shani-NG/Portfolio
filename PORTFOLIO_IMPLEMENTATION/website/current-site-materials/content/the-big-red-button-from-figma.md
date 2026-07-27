# The Big RED BUTTON

Source copy recovered from the Stage 02 local Codex session log.

This file preserves the approved case-study text as source material for the portfolio case-study page.

---

The Big Red Button

Reducing critical downtime through targeted recovery

In a mission-critical naval system, downtime is an operational risk.

Ship technicians had limited tools for diagnosing failures. When the application stopped working, they either contacted shore support or restarted the entire system.

The initial request was simple:

Build one button that resets everything.

But a full reset would not solve the real problem. It could extend downtime, remove useful diagnostic information, and treat every failure as equally severe.

I led the UX strategy and design of a Monitor Module that replaced blind resets with diagnosis, prevention, and role-based recovery tools.

---

## Project Snapshot

Role

Product Design Lead and UX Lead

Domain

Naval Command and Control systems

Users

Ship technicians, shore engineers, and system administrators

Focus

System health, fault diagnosis, recovery, and operational continuity

---

## The Reset Was Not the Solution

The system operated across two very different environments.

At sea, technicians needed fast and safe recovery without deep infrastructure knowledge.

On shore, engineers needed technical detail, logs, and control over individual services.

The existing experience served neither group well.

Technicians saw technical errors they could not interpret.

Engineers received incomplete reports and spent time searching through raw infrastructure data.

The problem was not the absence of a reset button.

It was the absence of a clear path from failure to action.

---

## Translating Infrastructure Into Operational Meaning

Developers worked with Pods, Kafka, APIs, services, and databases.

Technicians needed to know:

- Is the system operational?
- Which capability is affected?
- Can I resolve the issue safely?
- Is expert support required?

I worked with architects and DevOps engineers to map common failure points and connect technical events to their operational impact.

This created a translation layer between the system architecture and the people operating it.

---

## Smart Recovery: Fix What Failed

Instead of one global reset, known failures were connected to focused recovery actions.

When the system identified a recognized fault, the interface could present:

- What failed
- Which capability was affected
- The severity of the issue
- A recommended action

A contextual Fix Issue action could trigger a predefined technical process in the background, such as restarting a specific service.

The technician did not need to understand the full architecture.

The system provided the meaning and handled the technical execution.

---

## Prevention Before Recovery

Research revealed that some failures began during system configuration and startup.

Different environments required different settings, authentication methods, and permissions. Missing or incorrect values could prevent the system from starting correctly.

I designed a configuration flow that:

- Adapted to sea and shore environments
- Exposed only relevant settings
- Validated mandatory information
- Prevented startup until critical conditions were met
- Distinguished production, staging, and training environments

The goal was not only to recover from failure.

It was to prevent avoidable failures from reaching the user.

---

## Expert Tools Without Expert Complexity for Everyone

Shore engineers needed deeper access than ship technicians.

The expert layer supported:

- Filtering logs by severity
- Filtering by service or component
- Selecting a focused time range
- Exporting only relevant data
- Tracking export status
- Moving from an alert to the relevant technical context

This reduced noise and created a more direct path from an operational issue to an engineering investigation.

---

## One System, Three Levels of Control

The module supported three different perspectives.

Ship Technician

Clear status, operational impact, and guided recovery.

Shore Engineer

Detailed diagnostics, log tools, and process-level control.

System Administrator

A broader view of system health and recurring issues.

Each user received the information and actions needed for their responsibility.

---

## What Changed

Before

- Technical failures appeared without operational context
- Ship technicians relied on shore support or full resets
- Configuration errors could cause immediate downtime
- Engineers searched through broad raw logs
- Different roles lacked a shared system-health view

After

- Errors were connected to impact and next steps
- Known failures had targeted recovery actions
- Configuration was validated before startup
- Experts received focused diagnostic tools
- Role-based views supported one monitoring model

---

## From Recovery to Prevention

Targeted diagnostics also created a more structured record of system failures.

This foundation could support future capabilities such as:

- Identifying recurring failure patterns
- Detecting degradation before a full outage
- Recommending preventive actions
- Supporting predictive maintenance

These capabilities were part of the future direction, not the initial implementation.

---

## The Product Shift

The project began with a request for one reset button.

It became a broader system-health strategy:

Translate the failure.

Explain the impact.

Apply the smallest safe action.

Prevent the next one.
