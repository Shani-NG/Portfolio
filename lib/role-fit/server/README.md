# Role Fit Server-Side Services

This folder contains active server-side RoleFit services. It is not a foundation placeholder.

Implemented responsibilities include:

- validation gates
- eligibility checks
- report generation pipeline
- evidence verification
- privacy validation
- runtime event logging
- structured persistence adapters

Every report request passes through shared server-side normalization, validation and eligibility before generation. External Job Fit evaluation reuses the same validation/evidence/provider/calibration foundation through the protected `/api/internal/job-fit/evaluate/v1` boundary; it must not become a second independent fit engine.

Server-side services must not store the original job description, raw user input, unrestricted transcripts, private reasoning, raw prompts, raw model outputs, or unnecessary personal data.

## Active boundaries

- `/api/role-fit/chat` — conversational intake and follow-up.
- `/api/role-fit/report` — validated public report generation.
- `/api/internal/job-fit/evaluate/v1` — Bearer-protected evaluator for trusted external callers.
- Supabase RPC boundaries — completed-report counts/persistence, evaluator reservation/completion, contact leads and safe runtime events.

Provider output is not the final report. The server validates structured output, applies deterministic evidence resolution and report composition, then attempts persistence before returning the browser contract.

## Privacy and diagnostics

Server-side services must not store the original job description, unrestricted transcripts, private reasoning, raw prompts, raw model outputs, provider error bodies or unnecessary personal data. Runtime diagnostics use allow-listed metadata and keep provider, validation, composition, persistence, response and display boundaries distinct.

See `docs/PROJECT_HANDOFF.md` before changing behavior and `docs/ENVIRONMENT_VARIABLES.md` before changing configuration.
