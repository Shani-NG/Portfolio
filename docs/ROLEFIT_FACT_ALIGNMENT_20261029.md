# RoleFit factual alignment — 29 October 2026

## Scope and provenance

Approved factual release based on Production/main `b8dadb82d2f3f9860af053d853486a006f5fdda6` (deployment `dpl_E6WqbHaCYe1WydnivbDnTrXiroui`). Sources: latest user-approved English CV and explicit factual corrections approved 28 October 2026. The approved CV itself is unchanged.

## Exact factual changes

`PORTFOLIO_IMPLEMENTATION/role-fit-agent/docs/canonical/CV_Knowledge.md`:

- Overall experience: 12 years / 12 yrs UX → 15 years of overall professional experience. No claim of 15 dedicated years in UX, AI, PM or systems analysis.
- Approved positioning headline → Senior UX & Product Design Team Lead.
- Energy Team → Senior UX Strategist & Product Design Team Lead, 2021–2026.
- Ginger-Gene → Lead UX/UI & Project Manager (previously Product Manager).
- AI Implementation & Integration → completed, Hackeru College, August 2026; card 04's supporting training status aligned.
- Clearance → Level 3 stated in the CV; active validity unverified; internal only.
- Source/version/review notes aligned to factual correction scope. Broader content remains pending audit.
- Keyword first line: 699 → 700 characters; remaining capability keywords preserved.

`components/role-fit/role-fit-live-report.tsx`:

- Static profile statistic: `12+ years` → `15 years`.
- Label: `Relevant Experience` → `Overall Experience`, to avoid implying role-specific tenure.

`lib/role-fit/report/lifecycle-boundary.test.ts`: existing display assertion aligned and approved value checked. No production logic changed.

## Verification

- Existing test suite: 353 passed, 0 failed.
- TypeScript: passed.
- Production build: passed using `next build --webpack`. Default local Turbopack build cannot follow the reused node_modules junction outside its filesystem root. No build configuration or dependencies changed; the platform's normal Git build remains the deployment gate.
- Offline parsed comparison against exact Production CV, normalized to Git/LF line endings: six CV IDs, claims, capabilities, specificity and visibility unchanged; fourteen capability facts identical; forty-eight case-study cards valid, zero catalog issues.
- Only parsed content for CV cards 04 and 06 changed. The final card's existing parser includes trailing document notes. One systems-analysis probe increased that card's lexical score from 1 to 2; top two CV candidates stayed unchanged across all six focused probes. This is bounded evidence, not a guarantee for all possible role descriptions.
- No live provider call or report generation was used for this release.
- A separate research report is outside this commit/worktree. None of its recommendations is implemented here.

## Preserved boundaries

No environment, secrets, provider/model, schemas, scoring/composition, evidence selection code, source definitions, public anchors, report lifecycle, routes, persistence, dependencies, or experimental integration files changed. Stored report records are not rewritten; the static display applies when the current component renders them.

## Deployment and rollback

Before release, reverify remote main and Production still equal the baseline, and inspect the staged allowlist. Push only this factual commit as a fast-forward to main through the existing Git deployment integration. Verify resulting deployment commit and Production alias before claiming release.

Rollback anchor: commit `b8dadb82d2f3f9860af053d853486a006f5fdda6`, deployment `dpl_E6WqbHaCYe1WydnivbDnTrXiroui`. To reverse this release, revert only its factual commit and deploy the resulting main, or restore the recorded previous Production deployment using the established platform workflow. Never reset main, force-push, change environment variables, or merge an experimental branch as rollback.
