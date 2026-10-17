# Role Fit Runtime Orchestration

This folder contains the active RoleFit runtime policy and orchestration boundaries. It is not a future placeholder.

The approved architecture uses one user-facing portfolio agent with three internal task modes:

- Role Understanding
- Fit Analysis
- Report Follow-up

These are internal task modes, not separate user-facing bots.

Application code must control workflow, eligibility, report limits, persistence, session state, logging, and publication. The model must not control permissions, limits, persistence, or system state.

## Ownership boundary

Application code owns workflow, eligibility, explicit confirmation, report limits, session restoration, persistence, safe logging and publication. Models interpret role meaning and produce bounded conversation or analysis; they do not control permissions, limits, persistence or final evidence authorization.

The current public flow keeps one user-facing agent while separating Role Understanding, Fit Analysis and Report Follow-up responsibilities internally.

## Runtime policy

The current implementation includes a small environment-driven policy layer in `policy.ts`.

These values are configured in Vercel and may be changed without altering the product architecture:

- `ROLE_FIT_MAX_MESSAGES_PER_SESSION`
- `ROLE_FIT_MAX_REPORTS_PER_SESSION`
- `ROLE_FIT_MAX_INPUT_CHARS`
- `ROLE_FIT_MAX_OUTPUT_TOKENS`

Model selection is also environment-driven:

- `GOOGLE_AI_STUDIO_MODEL`
- `GOOGLE_AI_STUDIO_CHAT_MODEL`
- `GOOGLE_AI_STUDIO_ANALYSIS_MODEL`
- `GOOGLE_AI_STUDIO_REPORT_MODEL`
- `GOOGLE_AI_STUDIO_CHAT_FALLBACK_MODEL`
- `GOOGLE_AI_STUDIO_JOB_FIT_MODEL`

`GOOGLE_AI_STUDIO_API_KEY` is stored privately in Vercel and must never be committed to Git.

## Current implementation status

Implemented and live:

- conversational role intake with accumulated draft continuity;
- canonical server-side role validation and explicit report confirmation;
- maximum-two-report and same-role protection;
- bounded provider retry and classified provider/report lifecycle failures;
- deterministic evidence authorization, report composition and fit calibration;
- Supabase report persistence and safe allow-listed runtime diagnostics;
- session restoration, retry continuity and report follow-up context.

Do not infer a failure boundary from a generic UI error. Provider response, structured-output validation, deterministic composition, persistence, client receipt and visible rendering are separate states.

Start future work from `docs/PROJECT_HANDOFF.md`. Use `docs/ENVIRONMENT_VARIABLES.md` for variable purpose and ownership; never record secret values.
