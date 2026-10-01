# M1 — Data Model and Auth

**Status:** complete  
**Depends on:** M0

## Goal

Users can register, log in, and manage their profile with strict Zod validation at every boundary. The core `Requirement` type is finalized and locked down, all eight database tables are established in Drizzle ORM and pushed to Neon, Auth.js v5 provides secure httpOnly session cookies, and a query scoping helper is in place to guarantee strict user-data isolation.

## Acceptance criteria

- [x] `modules/eligibility/types.ts` defines the `Requirement` type exactly as specified in `SPEC.md` section 5.1
- [x] Drizzle schema defines all 8 tables (`users`, `profiles`, `skills`, `targets`, `opportunities`, `archetypes`, `experiences`, `consents`) and pushes cleanly to Neon Postgres via `npm run db:push`
- [x] Auth.js v5 credentials authentication works with secure password hashing and httpOnly session cookies
- [x] Registration (`/register`) and Login (`/login`) pages function properly with input validation
- [x] Profile CRUD (`GET /api/v1/profile` and `PUT /api/v1/profile`) validates data at the boundary with Zod
- [x] Query scoping helper (`lib/db/scope.ts`) strictly enforces `userId` filtering and UUID route parameter validation
- [x] Comprehensive unit and integration tests pass for data model, auth endpoints, and scoping helpers
- [x] All quality checks pass (`npm run typecheck && npm run lint && npm run test && npm run build`)

## Tasks

### T1 — Finalize Requirement Type Specification

**Status:** done

- [x] Create `modules/eligibility/types.ts`
- [x] Define `RequirementKind`: `"age" | "qualification" | "domicile" | "category" | "skill" | "certification" | "experience_years" | "attempts"`
- [x] Define `RequirementOp`: `"max" | "min" | "equals" | "has" | "one_of"`
- [x] Define `RequirementSource` union (notification, job_description, archetype, scheme, interview_evidence)
- [x] Define `Requirement` interface with category overrides, blocking flag, weight (1-10), human label, and source
- [x] Create Zod schema validation for `Requirement` (`RequirementSchema`, `RequirementArraySchema`)
- [x] Add unit test validating sample requirements against the schema
      **Notes:** Requirement types and Zod schemas finalized with pure semantics and validated via `tests/requirements.test.ts`. Ready for user review before M2.

### T2 — Drizzle Schema Definition & Database Migration

**Status:** done

- [x] Define Drizzle PostgreSQL tables in `db/schema.ts`:
  - `users`: `id`, `email`, `passwordHash`, `isAdmin`, `createdAt`
  - `profiles`: `userId` (FK, unique), `dateOfBirth`_, `category`_, `domicileState`*, `qualification`, `attemptsUsed`, `preference` ('govt' | 'private' | 'both')
  - `skills`: `id`, `userId` (FK), `name`, `evidence` ('verified' | 'project' | 'declared')
  - `targets`: `id`, `userId` (FK), `kind` ('govt_post' | 'scheme' | 'job_description' | 'archetype'), `sourceId`, `title`, `createdAt`
  - `opportunities`: `id`, `kind` ('govt_post' | 'scheme'), `title`, `department`, `state`, `closesOn`, `requirements` (jsonb), `sourceDocumentPath`, `status` ('draft' | 'live')
  - `archetypes`: `id`, `title`, `requirements` (jsonb)
  - `experiences`: `id`, `userId` (FK), `company`, `role`, `year`, `rounds` (jsonb), `askedAbout` (jsonb), `outcome`, `verificationLevel`, `createdAt`
  - `consents`: `id`, `userId` (FK), `purpose`, `version`, `grantedAt`, `revokedAt`
- [x] Define relations between entities in `db/schema.ts`
- [x] Generate Drizzle Zod schemas (`drizzle-zod`) for insert and select validation
- [x] Run `npm run db:push` to sync schema with Neon Postgres
- [x] Verify tables in Neon database via automated test query
      **Notes:** All 8 tables, relations, and drizzle-zod schemas pushed to Neon Postgres via `npm run db:push` and verified with `tests/schema.test.ts`. Sensitive columns marked with `*` will receive application-level encryption in M2.

### T3 — User-Owned Query Scoping Helper

**Status:** done

- [x] Create `lib/db/scope.ts` with helper `withUserScope(table, id, userId)`
- [x] Enforce UUID validation on every incoming route ID parameter before touching the database
- [x] Create helper `scopeUserQuery` to guarantee `eq(table.userId, session.user.id)` (`withUserOnly`)
- [x] Write unit tests verifying that mismatched user IDs or invalid UUIDs are strictly rejected
      **Notes:** Implemented in `lib/db/scope.ts` with `assertValidUuid`, `withUserScope`, and `withUserOnly`. Verified with `tests/scope.test.ts` (including live multi-user data isolation test).

### T4 — Authentication with Auth.js v5

**Status:** done

- [x] Install `next-auth@beta` and password hashing utility (`node:crypto` scrypt)
- [x] Configure Auth.js configuration in `auth.ts`:
  - Credentials provider validating email & password
  - Session strategy: JWT with httpOnly cookies
  - Callbacks attaching `id` and `isAdmin` to session
  - Types augmentation in `types/next-auth.d.ts`
- [x] Set up route handlers `app/api/auth/[...nextauth]/route.ts`
- [x] Write unit tests in `tests/auth.test.ts` verifying password hashing and credential verification
      **Notes:** Uses zero-dependency native `node:crypto` scrypt with random 16-byte salt and constant-time verification. Configured NextAuth v5 credentials provider with JWT session strategy and typed session properties (`id`, `isAdmin`).

### T5 — Registration & Profile API Endpoints

**Status:** done
**Owner:** Antigravity

- [x] Implement Zod schemas for user registration and profile creation/editing
- [x] Create `POST /api/v1/auth/register` route handler (creates user, hashes password, prevents duplicate email)
- [x] Create `GET /api/v1/profile` route handler (returns authenticated user profile scoped by session)
- [x] Create `PUT /api/v1/profile` route handler (upserts profile data with boundary Zod validation)
- [x] Create `DELETE /api/v1/profile` route handler (cascades deletion of user profile and associated data)
- [x] Write integration tests for register and profile endpoints in `tests/api-endpoints.test.ts`
      **Notes:** 401 when unauthenticated, 400 with Zod error details on validation failure, 404 when profile missing, 409 on duplicate registration. All queries scoped to session user. Cascading deletes executed via neon-http driver compatible `Promise.all`.

### T7 — Remove `attemptsUsed`

**Status:** done
**Owner:** Antigravity

- [x] Drop the column from `profiles` in `db/schema.ts`, run `db:push`
- [x] Remove from profile Zod schemas, the `PUT` handler, and test fixtures
- [x] Keep `"attempts"` in `RequirementKind`, unimplemented, with a comment explaining that it needs a per-target `attempts(userId, opportunityId, count)` table if ever required
- [x] `DECISIONS.md` entry
      **Notes:** Attempt limits are per-exam, not per-person. Dropped attempts_used from profiles, pushed to Neon. Removed from validations, route handler, and tests. Comment added to RequirementKind union. Rationale documented in DECISIONS.md.

### T6 — Register, Login, and Profile UI

**Status:** done
**Owner:** Antigravity

- [x] `/register` — form validation, error states, redirect on success
- [x] `/login` — email and password, credential error handling, registration success notice
- [x] `/profile` — five fields: dateOfBirth, category, domicileState, qualification, preference. No `attemptsUsed`
- [x] Header shell reflects session state (dynamic login/register vs user email & logout)
- [x] End-to-end check: register → login → view profile → edit profile
      **Notes:** Built responsive UI using shadcn components and base tokens. Tested full registration, credential authentication, session persistence in header, profile loading, saving, and cascading data deletion.

## Human actions required

- [ ] Review and approve the `Requirement` type in `modules/eligibility/types.ts` before starting M2/M3

## Changelog

- 2026-10-01: Created initial milestone document for M1 (Data Model and Auth) per `SPEC.md` sections 5 and 9.5.
- 2026-10-01: Completed T1 (Finalize Requirement Type Specification) in `modules/eligibility/types.ts` with test coverage in `tests/requirements.test.ts`.
- 2026-10-01: Completed T2 (Drizzle Schema Definition & Database Migration) defining all 8 tables, relations, and drizzle-zod schemas, pushed to Neon via `db:push`, and verified with `tests/schema.test.ts`.
- 2026-10-01: Completed T3 (User-Owned Query Scoping Helper) in `lib/db/scope.ts` with UUID validation and multi-user isolation tests in `tests/scope.test.ts`.
- 2026-10-01: Completed T4 (Authentication with Auth.js v5) with credentials provider, JWT session, native crypto password hashing in `lib/auth/password.ts`, and test suite in `tests/auth.test.ts`.
- 2026-10-01: Completed T5 (Registration & Profile API Endpoints) with Zod validation, user registration, profile CRUD, session-based scoping, and integration tests in `tests/api-endpoints.test.ts`.
- 2026-10-01: Completed T7 (Remove `attemptsUsed`) across schema, validations, route handlers, and engine types; documented in DECISIONS.md.
- 2026-10-01: Completed T6 (Register, Login, and Profile UI) with responsive pages and session-aware navigation shell. Milestone 1 complete.
