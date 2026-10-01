# Kariyar Setu — Complete Refactor, UI Polish & Rebranding Plan

## Objectives

1. **Rebranding**: Renamed all occurrences of "Job Setu" to **"Kariyar Setu"** across metadata, navigation, titles, footer, and labels.
2. **Typography & Styling**:
   - Switched font to Google Fonts **Inter** in `app/layout.tsx`.
   - Modernized visual design: rich color tokens, glassmorphic headers, polished shadows, consistent padding/margins, and responsive layouts.
3. **Architecture & Performance (Server Pages)**:
   - Converted root page handlers (`app/page.tsx`, `app/targets/page.tsx`, `app/targets/[id]/page.tsx`, `app/targets/new/page.tsx`, `app/profile/page.tsx`, `app/admin/notifications/page.tsx`) to **Server Components**.
   - Broken large monolithic client files into focused, reusable child components (`components/profile/`, `components/targets/`, `components/admin/`).
   - Eliminated client fetch waterfalls on page mount; data is preloaded directly on the server.
4. **Bug Fixes**:
   - **Admin role handling**: Admin users are not shown or forced to fill the student candidate profile. Header highlights "Admin Console" with an admin badge and directs them to `/admin/notifications`. Visiting `/profile` as an admin displays an informative Admin Console banner.
   - **Target loading reliability**: Target listing & evaluation load immediately on the server using direct database queries and pure eligibility evaluation, eliminating slow page cascades and loading freezes.
5. **Quality Verification**:
   - 100% passing test suite: **21/21 test files, 86/86 tests passing**.
   - Zero TypeScript errors (`npm run typecheck`).
   - Zero ESLint issues (`npm run lint`).
   - Clean production build (`npm run build`).

## Execution Summary

- [x] **Task 1: Rebrand to "Kariyar Setu" & Font Upgrade**
  - Updated `app/layout.tsx` metadata and loaded `Inter` font from `next/font/google`.
  - Updated header logo, page titles, footer, prompts, and text.
- [x] **Task 2: Header & Admin Role Refactor**
  - Updated `components/header.tsx` and `components/auth-buttons.tsx` to detect `session.user.isAdmin`.
  - For admin: show "Admin Console" link (`/admin/notifications`) and admin badge; do not force student profile setup.
  - For candidates: show "Targets" and "Profile".
- [x] **Task 3: Profile Page Refactor & Admin Guard**
  - Converted `app/profile/page.tsx` into a Server Component that loads the profile and session server-side.
  - If user is admin, show Admin Console card linking to `/admin/notifications` instead of student form.
  - Moved profile form logic into a clean, focused client component `components/profile/ProfileForm.tsx`.
- [x] **Task 4: Target Workspace Refactor & Server-Side Loading**
  - Converted `app/targets/page.tsx`, `app/targets/[id]/page.tsx`, and `app/targets/new/page.tsx` into Server Components.
  - Preloaded targets, opportunities, archetypes, and verdicts server-side with pure `evaluateEligibility`.
  - Broken down target details into `components/targets/TargetHeader.tsx`, `components/targets/VerdictBanner.tsx`, `components/targets/ReadinessTab.tsx`, `components/targets/GapsTab.tsx`, `components/targets/PrepIntelTab.tsx`, `components/targets/TargetDetailView.tsx`, and `components/targets/TargetsList.tsx`.
- [x] **Task 5: Admin Notifications UI Refactor**
  - Converted `app/admin/notifications/page.tsx` into a Server Component with role authorization check and server preloading.
  - Extracted interactive ingestion and review into `components/admin/AdminNotificationsView.tsx`.
- [x] **Task 6: Verification & Full Build**
  - `npm run typecheck`: Passed (0 errors).
  - `npm run lint`: Passed (0 errors).
  - `npm run test`: Passed (86/86 tests across 21 test files).
  - `npm run build`: Passed (17 static & dynamic routes compiled successfully).
