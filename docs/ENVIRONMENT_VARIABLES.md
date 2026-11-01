# Environment Variable Registry

Last verified: 17 October 2026

This registry records names, ownership and purpose only. It must never contain real passwords, tokens, keys or secret values. A name appearing here does not prove that it is currently configured in every Vercel scope; verify platform metadata before changing or removing it.

## Portfolio runtime

| Variable | Purpose and context | Sensitivity / notes |
| --- | --- | --- |
| `SITE_PASSWORD` | Shared input authority for the Portfolio access gate. Read server-side. | Secret. Never expose to the browser bundle. |
| `ACCESS_SESSION_SECRET` | HMAC secret used to sign and validate the `portfolio_access` cookie. | Secret; server-only. |
| `NODE_ENV` | Platform/runtime mode; also affects secure-cookie behavior. | Platform-managed in hosted environments. |
| `GOOGLE_AI_STUDIO_API_KEY` | Credential for the configured Google AI Studio/Gemini provider. | Secret; server-only. |
| `GOOGLE_AI_STUDIO_MODEL` | Generic model fallback when a task-specific model slot is not configured. | Operational configuration, not a product contract. |
| `GOOGLE_AI_STUDIO_CHAT_MODEL` | Primary model override for visitor-facing conversation. | Keep separate from report/evaluator decisions. |
| `GOOGLE_AI_STUDIO_ANALYSIS_MODEL` | General analysis fallback used by analysis paths. | Report and evaluator may override it. |
| `GOOGLE_AI_STUDIO_REPORT_MODEL` | Dedicated public RoleFit report-analysis model override; falls back to analysis configuration. | Consumed by runtime but was missing from `.env.example` before this documentation update. |
| `GOOGLE_AI_STUDIO_CHAT_FALLBACK_MODEL` | Optional distinct fallback model for chat. | Consumed by runtime but was missing from `.env.example`. |
| `GOOGLE_AI_STUDIO_JOB_FIT_MODEL` | Dedicated model override for the protected Job Fit evaluator. | Must not be silently coupled to public report-model changes. |
| `ROLE_FIT_MODEL_PROVIDER` | Provider-selection slot retained in deployed configuration. | Verify current code use before changing; do not infer provider migration from its presence alone. |
| `ROLE_FIT_MAX_MESSAGES_PER_SESSION` | Maximum conversation messages accepted in one RoleFit session. | Default documented value: `30`. |
| `ROLE_FIT_MAX_REPORTS_PER_SESSION` | Maximum completed reports per session. | Normalized to `1` or `2`; current product rule is `2`. |
| `ROLE_FIT_MAX_INPUT_CHARS` | Upper bound for accepted role/job-description input. | Default documented value: `12000`. |
| `ROLE_FIT_MAX_OUTPUT_TOKENS` | Upper bound for model output in bounded RoleFit analysis. | Default documented value: `2500`. |
| `SUPABASE_URL` | Server-side Supabase project endpoint for report, lead, evaluator and runtime persistence. | Server configuration. |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged server credential used by controlled Supabase/RPC boundaries. | High-sensitivity secret; never expose to browser code. |
| `JOB_FIT_INTERNAL_API_KEY` | Shared Bearer credential protecting `/api/internal/job-fit/evaluate/v1` between trusted server callers. | Secret; must match the authorized external caller. |
| `JOB_EVALUATOR_DAILY_LIMIT` | Daily evaluator quota switch. Current Portfolio code accepts only `5`. | Operational cost/reliability control. |

## Portfolio variables classified as stale/deprecated

These names were previously visible in Production and Preview, but current Portfolio code search found no references and current RoleFit persistence is Supabase-only. Do not remove them as part of unrelated work; cleanup requires a separate approved operations change and post-removal verification.

| Variable | Historical purpose | Current status |
| --- | --- | --- |
| `GOOGLE_SHEETS_RUNTIME_SPREADSHEET_ID` | Runtime Google Sheets persistence target. | Stale/deprecated; no current code reference verified. |
| `GOOGLE_SHEETS_CLIENT_EMAIL` | Google service-account identity for Sheets persistence. | Stale/deprecated; no current code reference verified. |
| `GOOGLE_SHEETS_PRIVATE_KEY` | Google service-account private key for Sheets persistence. | Stale/deprecated high-sensitivity secret; no current code reference verified. |

## JAM application and RoleFit plugin

The following names are present in the current local JAM source. Their presence in source does not by itself prove that every variable is active in the current Production deployment.

| Variable | Purpose and context | Sensitivity / notes |
| --- | --- | --- |
| `DATABASE_URL` | Database connection used by the JAM/Drizzle path where enabled. | Secret; verify whether the active path uses it before removal. |
| `JAM_ACCESS_SECRET` | Password for the approved single-owner HTTP Basic gate. | Secret; not interchangeable with ingest or OAuth keys. |
| `JAM_INGEST_SECRET` | Dedicated Bearer credential for `/api/intake/v1`. | Secret; do not reuse `JAM_ACCESS_SECRET` or a Supabase key. |
| `SUPABASE_URL` | Supabase endpoint used by JAM server persistence. | Server configuration. |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged credential for JAM's controlled Supabase writes. | High-sensitivity secret; server-only. |
| `ROLEFIT_PUBLIC_BASE_URL` | Public JAM origin used to construct MCP and OAuth metadata/endpoints. | Must match the deployed public origin. |
| `PORTFOLIO_BASE_URL` | Trusted Portfolio origin called by JAM for canonical fit evaluation. | Server-to-server routing configuration. |
| `JOB_FIT_INTERNAL_API_KEY` | Bearer credential JAM sends to the Portfolio evaluator. | Secret; counterpart of the Portfolio variable with the same name. |
| `ROLEFIT_VERCEL_CLIENT_ID` | Client identifier used by the Vercel-backed owner authorization flow. | Treat as sensitive configuration. |
| `ROLEFIT_VERCEL_CLIENT_SECRET` | Client secret for the Vercel-backed authorization flow. | Secret. |
| `ROLEFIT_ALLOWED_VERCEL_SUB` | Exact owner subject allowed to authorize the plugin. | Access-control identifier; do not broaden silently. |
| `ROLEFIT_OAUTH_ROOT_KEY` | Root key used to derive/sign OAuth state, codes or tokens in the JAM connector flow. | High-sensitivity secret. |

## JAM framework / legacy configuration still referenced by source

Do not delete these names solely because the primary RoleFit flow does not use them. First determine whether the active JAM deployment still uses the corresponding framework path.

| Variable | Purpose in current source |
| --- | --- |
| `VITE_APP_ID` | Application identifier exposed through the existing framework environment adapter. |
| `JWT_SECRET` | Cookie/JWT secret used by the existing framework authentication adapter. |
| `OAUTH_SERVER_URL` | OAuth server base URL for the existing framework path. |
| `OWNER_OPEN_ID` | Configured owner identity for the existing framework path. |
| `BUILT_IN_FORGE_API_URL` | Built-in Forge API endpoint. |
| `BUILT_IN_FORGE_API_KEY` | Credential for the built-in Forge API. |
| `PORT` | Runtime server port; defaults to `3000` in source. |
| `NODE_ENV` | Runtime mode used by the JAM server and Vite integration. |

## Known documentation drift

Before this refresh, Portfolio `.env.example` omitted `GOOGLE_AI_STUDIO_REPORT_MODEL`, `GOOGLE_AI_STUDIO_CHAT_FALLBACK_MODEL`, `ROLE_FIT_MODEL_PROVIDER`, `JOB_FIT_INTERNAL_API_KEY` and `JOB_EVALUATOR_DAILY_LIMIT` even though current runtime/deployment documentation referenced them. The example file is updated in the accompanying documentation-only change.

Platform scope evidence in the live PRD was captured from earlier Vercel screenshots. Reconfirm current Production/Preview/Development scopes before an environment migration or cleanup; never assume an old scope map is still exact.
