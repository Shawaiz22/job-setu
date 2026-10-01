# M4 — Target Workspace UI

**Status:** complete  
**Depends on:** M3

## Goal

Students have an intuitive, high-confidence interface to manage their targets and immediately inspect their eligibility verdicts. Verdicts are visually clear and legally grounded: `BLOCKED` (red, with exact official clause citation and shortfall), `ELIGIBLE` (green, with readiness score and top gaps), and `SOON` (amber, with future eligibility date). The workspace allows adding targets from live MP opportunities, schemes, or role archetypes, and drilling into detailed Readiness, Gaps, and Prep Intel tabs.

## Acceptance criteria

- [x] Target API endpoints (`GET /api/v1/targets`, `POST /api/v1/targets`, `DELETE /api/v1/targets/[id]`) and `GET /api/v1/opportunities` operate with strict user scoping and UUID validation
- [x] Verdict rendering strictly adheres to `SPEC.md` section 11:
  - `BLOCKED` (red) with failing rule, clause citation, and shortfall
  - `ELIGIBLE` (green) with score (0-100), met requirements, top-3 gaps
  - `SOON` (amber) with computed date of future eligibility
- [x] `/targets` lists all user targets with evaluated verdict badges, next actions, and workspace metrics
- [x] `/targets/new` provides 3 organized categories: Government Opportunities, Welfare Schemes, and Role Archetypes
- [x] `/targets/[id]` implements 3 distinct tabs: **Readiness**, **Gaps**, and **Prep Intel**
- [x] Official clause citation is always visible on every blocked verdict card
- [x] All quality checks pass (`npm run typecheck && npm run lint && npm run test && npm run build`)

## Tasks

### T1 — Targets & Opportunities CRUD API (`app/api/v1/targets`, `app/api/v1/opportunities`)

**Status:** done  
**Owner:** Antigravity (Ponytail)

- [x] Implement `GET /api/v1/targets` returning user targets with live evaluation status
- [x] Implement `POST /api/v1/targets` to add target (`kind`, `sourceId`, `title`) with Zod validation
- [x] Implement `DELETE /api/v1/targets/[id]` with UUID validation and user scoping
- [x] Implement `GET /api/v1/opportunities` to browse available live opportunities and archetypes
- [x] Write API integration tests in `tests/targets/targets-api.test.ts`
      **Notes:** All 6 target API tests passing with full user isolation and UUID validation.

### T2 — Verdict & Card UI Components (`components/targets/`)

**Status:** done  
**Owner:** Antigravity (Ponytail)

- [x] Build `components/targets/VerdictBadge.tsx` supporting `BLOCKED`, `ELIGIBLE`, and `SOON`
- [x] Build `components/targets/TargetCard.tsx` with prominent clause citation and shortfall display
- [x] Build `components/targets/ClauseCitation.tsx` for official source document link and clause display
      **Notes:** Clean discriminated union handling across notifications, schemes, JDs, and interview evidence.

### T3 — Target Workspace Dashboard (`app/targets/page.tsx`)

**Status:** done  
**Owner:** Antigravity (Ponytail)

- [x] Build `/targets` page with summary counters (Eligible, Blocked, Future Eligible)
- [x] Render grid of `TargetCard`s
- [x] Provide empty state with direct action to browse opportunities (`/targets/new`)
- [x] Update main app navigation header to link `/targets` and `/profile`
      **Notes:** Responsive counters and live filters for All, Eligible, and Blocked targets.

### T4 — Add Target Browser (`app/targets/new/page.tsx`)

**Status:** done  
**Owner:** Antigravity (Ponytail)

- [x] Build `/targets/new` with tabs: Government Opportunities, Schemes, Archetypes
- [x] Display requirements preview and official department tags
- [x] "Add Target" button to instantly link target to candidate and redirect to workspace
      **Notes:** Features instant search filtering and prevents duplicate additions with "In Targets" badge.

### T5 — Target Detail Workspace with Tabs (`app/targets/[id]/page.tsx`)

**Status:** done  
**Owner:** Antigravity (Ponytail)

- [x] Build header with official title, department/state tag, and verdict banner
- [x] Implement **Readiness Tab**: lists all met requirements with evidence levels and clause quotes
- [x] Implement **Gaps Tab**: lists prioritized gaps with suggested actions
- [x] Implement **Prep Intel Tab**: displays interview rounds, sample sizes, and asked-about topics
      **Notes:** Integrated with 1-click consent granting when needed and handles complete/incomplete profiles gracefully.

## Human actions required

- [ ] Validate UI layout against reference prototype during review

## Changelog

- 2026-10-01: Created M4 milestone document and completed T1 (Targets & Opportunities CRUD API).
- 2026-10-01: Built T2 Verdict & Card components (`VerdictBadge`, `TargetCard`, `ClauseCitation`).
- 2026-10-01: Built T3 Target Workspace Dashboard (`app/targets/page.tsx`) and updated header navigation.
- 2026-10-01: Built T4 Add Target Opportunities Browser (`app/targets/new/page.tsx`).
- 2026-10-01: Built T5 Target Workspace Detail page (`app/targets/[id]/page.tsx`) with Readiness, Gaps, and Prep Intel tabs.
- 2026-10-01: Verified test suite (75 tests passing), typecheck (0 errors), lint (0 errors), and production build.
