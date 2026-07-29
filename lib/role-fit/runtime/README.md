# Role Fit Runtime Orchestration

This folder contains runtime configuration and is reserved for future orchestration utilities.

The approved architecture uses one user-facing portfolio agent with three internal task modes:

- Role Understanding
- Fit Analysis
- Report Follow-up

These are internal task modes, not separate user-facing bots.

Application code must control workflow, eligibility, report limits, persistence, session state, logging, and publication. The model must not control permissions, limits, persistence, or system state.

## Runtime Policy

The current implementation includes a small environment-driven policy layer in `policy.ts`.

These values are configured in Vercel and may be changed without altering the product architecture:

- `ROLE_FIT_MAX_MESSAGES_PER_SESSION`
- `ROLE_FIT_MAX_REPORTS_PER_SESSION`
- `ROLE_FIT_MAX_INPUT_CHARS`
- `ROLE_FIT_MAX_OUTPUT_TOKENS`

Model selection is also environment-driven:

- `ROLE_FIT_MODEL_PROVIDER`
- `GOOGLE_AI_STUDIO_MODEL`
- `GOOGLE_AI_STUDIO_CHAT_MODEL`
- `GOOGLE_AI_STUDIO_ANALYSIS_MODEL`

`GOOGLE_AI_STUDIO_API_KEY` is stored privately in Vercel and must never be committed to Git.

Current status: runtime policy is implemented. Full orchestration, persistence, logging, retrieval, and report follow-up are not implemented yet.
