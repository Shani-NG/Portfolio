# Role Fit Runtime Orchestration

This folder is reserved for runtime state and orchestration utilities.

The approved architecture uses one user-facing portfolio agent with three internal task modes:

- Role Understanding
- Fit Analysis
- Report Follow-up

These are internal task modes, not separate user-facing bots.

Application code must control workflow, eligibility, report limits, persistence, session state, logging, and publication. The model must not control permissions, limits, persistence, or system state.

Current status: foundation placeholder only. No orchestration logic has been implemented.
