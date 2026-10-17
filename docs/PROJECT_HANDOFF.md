# Portfolio / RoleFit — Current Handoff

Last verified: 17 October 2026

This is the short entry point for future Portfolio and RoleFit work. It does not replace the live PRD or the operational Google Drive handoff. Load only the task-relevant documents linked below instead of reconstructing the project from old chats.

## Source-of-truth order

1. Running Production and the exact `main` commit attached to it.
2. Current GitHub `main` source and current Vercel/Supabase configuration that can be verified without exposing secrets.
3. Runtime contracts, schemas, prompts and canonical evidence files actually consumed by the application.
4. Approved product guardrails and the live PRD.
5. This handoff and task-specific README files.
6. Old branches and conversations only as historical evidence.

If sources conflict, stop and surface the conflict. Do not silently reconcile it.

## Verified current baseline

- Repository: `Shani-NG/Portfolio`.
- Production branch: `main`.
- Current Production SHA: `b8dadb82d2f3f9860af053d853486a006f5fdda6`.
- Current Production deployment: `dpl_E6WqbHaCYe1WydnivbDnTrXiroui`, state `READY`.
- Public alias: `https://portfolio-shaning.vercel.app`.
- The primary local checkout remains on an older dirty branch and is not a current-state authority. Do not reset, clean, stage or reuse its uncommitted work.

## Release lineage and recovery anchors

- PR13 — `c4d3edb7554347b40518ff96505eaac8e048ce60`: stable evidence-resolution and report-semantics anchor. Use as historical recovery evidence, not as the current implementation base.
- PR15 — `737f814022439fdae3c484fa445c85741783ab0c`: Company isolation, immutable generated reports, fixed 24-hour session state, retry continuity and mobile progress correction.
- PR19 — `fe1f3b90c2adc3942c8d76d8954e08ab3822d4a1`: accumulated role context, canonical revalidation and natural confirmation continuity.
- PR21 — `a50cf38e7a995a7b9c1a7c0b5520d35d31ed178d`: current RoleFit logic baseline. Added flexible but validated intake, recovered draft/confirmation context, hydration stability, bounded provider retry and explicit 503 recovery.
- PR22 — `b8dadb82d2f3f9860af053d853486a006f5fdda6`: current Production. Homepage UI only; it did not change RoleFit report generation, provider behavior, confirmation, API, persistence, environment variables or model routing.

## Locked product guardrails

- RoleFit is a core portfolio experience, not a secondary add-on.
- The report is evidence-based and links to relevant case-study anchors.
- No analysis, fit result, gap list or recommendation appears before explicit report confirmation.
- Insufficient role requirements or responsibility context must not generate a report.
- Fit uses semantic and transferable-skill evidence, not keyword matching alone.
- Chat, report and project navigation preserve context across routes.
- Project links open the relevant in-page anchor in the same tab by default.
- Mobile-first, accessibility, reduced motion and state continuity are implementation constraints.
- V1 does not generate or rewrite a tailored CV.
- Maximum two completed reports per session; the same role reuses the existing report.

## Current RoleFit architecture

The public experience is one agent. Internally, responsibility is separated into Role Understanding, Fit Analysis and Report Follow-up. Deterministic application code owns state, validation, confirmation, report limits, evidence authorization, composition, persistence and recovery.

Primary Portfolio boundaries:

- `/api/role-fit/chat` — conversational intake and follow-up.
- `/api/role-fit/report` — validated report-generation pipeline.
- `/api/internal/job-fit/evaluate/v1` — Bearer-protected canonical evaluator used by external callers.
- `/api/contact` — explicit contact-lead submission.
- `/api/access` — portfolio access gate.

The report path is:

`validated role -> approved evidence -> bounded model analysis -> deterministic resolution/composition -> Supabase persistence -> fixed report UI`

Provider success, structured-output validation, composition, persistence, browser receipt and visible rendering are separate lifecycle boundaries. Do not diagnose one from evidence belonging to another.

## Current JAM / plugin boundary

- JAM is a separate private job-management application and shares the Supabase jobs/job_tasks data layer.
- The connected plugin exposes `evaluateNormalizedJobFit` and `saveAnalyzedJobToJam`.
- The evaluator remains owned by the Portfolio; JAM must not implement a competing fit model.
- JAM MCP entry point: `/api/rolefit/mcp`.
- Controlled legacy ingest entry point: `/api/intake/v1`.
- Controlled database write boundary: `create_jam_gpt_ingest_v1`.
- OAuth consent redirect protection was corrected in JAM commit `be97021e3978b18a8be961d978e75431284aa5a9` and was previously observed deployed to Production. The current Vercel connector cannot re-list that deployment, so do not claim a newer JAM Production SHA without new evidence.
- A recorded plugin evaluation reached Gemini and failed with retryable HTTP 503. This proves the connection reached the provider; it does not prove an authentication or model-name defect.

## Next approved RoleFit work

### Task 1 — conversational report-intent continuity

Create a narrow specification before implementation. The desired behavior is:

- accumulate role facts across natural conversation;
- preserve the active draft through side questions;
- ask only for information still required by canonical validation;
- offer report generation once when the role becomes eligible;
- bind explicit confirmation to the currently presented role summary;
- never enter report generation from broad keywords or stale parser heuristics;
- do not lower the existing report-sufficiency gate;
- prove behavior with deterministic/mock-provider tests before any live model run.

This is a lifecycle and intent-boundary task. It is not permission to rewrite the parser, evidence system, report semantics or UI.

### Task 2 — provider resilience

Only after Task 1 is specified and behaviorally stable:

- review request time budgets and bounded retry behavior;
- distinguish slow provider, retryable 503, network loss, truncated output, schema failure and response loss;
- preserve one-report semantics and avoid duplicate persistence;
- keep provider/model replacement as a separate product and operations decision;
- never treat increasing timeout as the primary fix without boundary evidence.

### Observability requirement

Reuse safe existing telemetry across intake, validation, confirmation, provider, processing, persistence and display. Never log raw job descriptions, unrestricted transcripts, prompts, model reasoning, provider error bodies or secrets.

## Closed or rejected approaches

Do not repeat these without new contradictory evidence:

- broad parser rewrites after the Golden Corpus passed;
- employer- or job-description-specific patches;
- treating evidence candidates as an authorization gate;
- asking a question after every answer;
- client-side duplicate definitions of role completeness;
- reset-based `Start New Analysis` lifecycle;
- treating visual evidence coverage as fit;
- using a larger timeout as the default provider fix;
- repeated live RoleFit loops after each small change;
- mixing UI changes with report/evidence/provider changes in one release;
- assuming missing CV display proves CV retrieval failure;
- inferring JAM deployment state without repository/deployment evidence.

## Current UI and design state

PR22 is live. The homepage opening copy is static, Selected Work precedes Core Values, only the four value cards reveal on entry, and Expertise covers Values only after the values remain readable. Cover offsets respond to panel and viewport height; keyboard focus and reduced-motion behavior use normal document positioning. The RoleFit entry lost only its dependency on the removed hero-completion event.

For future UI work, read `app/design-system/README.md` and treat `app/globals.css` plus `/app/design-system` as the token/component source of truth.

## Deferred / nice-to-have work

- Evidence-diversity UX audit if repeated recruiter-facing cases accumulate.
- Company-name language normalization after a safe display rule is defined.
- Deterministic Hebrew and gendered-copy audit.
- Intermediate-viewport control overlap only if reproducible in a normal viewport.
- Remove stale Google Sheets environment variables only as a separate approved operations task.
- Complete the JAM application/deployment trace when current deployment access is available.
- Verify plugin Builder-side configuration when it must become a formal source of truth.
- Treat image/OCR job-description intake as a separate capability, not a silent parser extension.
- Continue the Leads dashboard/notification concept as a separate product track.

## Safe execution checklist

Before implementation:

1. Verify current Production deployment and `main` SHA.
2. Start from current `main`, not an old local branch.
3. Identify the exact boundary and protected scope.
4. Load only the relevant context file.
5. Make the smallest responsible change.
6. Run targeted tests, TypeScript and diff checks.
7. Use at most one representative Preview/live model run when genuinely necessary.
8. Promote the exact validated commit and retain a rollback anchor.
9. Stop changing the stable subsystem after acceptance.

## Context routing

- RoleFit lifecycle/runtime task: this file, `lib/role-fit/runtime/README.md`, and the relevant tests/contracts.
- Server/API/report task: this file and `lib/role-fit/server/README.md`.
- Environment or deployment task: `docs/ENVIRONMENT_VARIABLES.md` plus current platform metadata.
- UI/design task: `app/design-system/README.md` plus the existing component/token source.
- Product decision: live PRD and Google Drive operational handoff.

Do not load every historical document or archived conversation by default.
