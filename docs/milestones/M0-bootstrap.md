# M0 — Bootstrap

**Status:** complete  
**Depends on:** None

## Goal

A deployed, empty-but-working Next.js application with the full quality toolchain, agent rules, and CI in place. No product features. Every gate, script, and quality check is verified so that subsequent milestones build on a solid and reproducible foundation.

## Acceptance criteria

- [x] `npm run typecheck && npm run lint && npm run test && npm run build` all pass cleanly
- [x] A commit with an invalid message is rejected by `commitlint`
- [x] A commit with lint/formatting errors is caught and handled by `pre-commit` (`lint-staged`)
- [x] Pre-push hook blocks push if `typecheck` or `test` fails
- [x] The live Vercel deployment URL loads properly (https://job-setu-app.vercel.app/)
- [x] `AGENTS.md`, `DECISIONS.md`, and `.env.example` exist, are accurate, and adhere to SPEC.md and MILESTONES.md

## Tasks

### T1 — Repository and Next.js Setup

**Status:** done

- [x] **GATE 1**: GitHub repo created and connected to remote origin
- [x] Next.js configuration: TypeScript, App Router, Tailwind CSS, root `app/` layout (no `src/`)
- [x] Configure `tsconfig.json`: `strict: true`, `noUncheckedIndexedAccess: true`, path alias `@/*`
- [x] Update `.gitignore` covering `.env*.local`, `.next`, `node_modules`, `coverage`, build artifacts
- [x] First clean commit and push to remote origin
      **Notes:** Repository was pre-initialized on branch `develop` linked to `origin`.

### T2 — Code Quality Toolchain

**Status:** done

- [x] ESLint 9 flat configuration (`eslint.config.mjs`) extending Next.js recommended and TypeScript rules
- [x] Prettier setup with `prettier-plugin-tailwindcss`
- [x] Integrate `eslint-config-prettier` to ensure no conflicting rules
- [x] Create `.editorconfig` with consistent indentation, charset, and newline formatting
- [x] Configure scripts in `package.json`: `lint`, `lint:fix`, `format`, `format:check`, `typecheck`
- [x] Verify all lint and format scripts execute cleanly
      **Notes:** Configured ESLint with eslint-config-prettier, Prettier with Tailwind plugin, .editorconfig, and verified `lint`, `typecheck`, and `format:check`.

### T3 — Git Hooks & Commit Standards

**Status:** done

- [x] Install and initialize Husky
- [x] Configure `lint-staged` for staged file linting and formatting
- [x] Set up `.husky/pre-commit` hook running `lint-staged`
- [x] Set up `.husky/pre-push` hook running `npm run typecheck` and `npm run test`
- [x] Configure `@commitlint/cli` and `@commitlint/config-conventional`
- [x] Set up `.husky/commit-msg` hook running `commitlint`
- [x] Test rejection of non-conventional commit message and staged lint failures
      **Notes:** Husky initialized with `pre-commit` (lint-staged), `commit-msg` (commitlint), and `pre-push` (typecheck + test). Commit message validation verified against conventional commits.

### T4 — Testing Infrastructure

**Status:** done

- [x] Install and configure Vitest for TypeScript with Node environment for module/engine tests
- [x] Configure `@testing-library/react` and `jsdom` environment for component testing
- [x] Add testing scripts in `package.json`: `test`, `test:watch`, `test:coverage`
- [x] Write a trivial passing unit test to validate test runner setup
- [x] Verify `npm run test` runs and passes
      **Notes:** Configured Vitest (`vitest.config.mts`) with Node default environment for modules/engine, React plugin + jsdom for component tests, and added passing tests in `tests/bootstrap.test.ts` and `tests/component.test.tsx`.

### T5 — UI Foundation (shadcn/ui & Base Tokens)

**Status:** done

- [x] Initialize `shadcn/ui` with Tailwind CSS integration
- [x] Add foundational components only: `button`, `input`, `label`, `card`, `badge`, `select`, `form`, `tabs`
- [x] Set base theme tokens; ensure dark mode structure is configured cleanly
- [x] Establish root layout (`app/layout.tsx`) with a minimal clean shell
- [x] Confirm UI components build and render without issues
      **Notes:** Initialized shadcn with Tailwind v4, added required base components (`button`, `input`, `label`, `card`, `badge`, `select`, `field`/`form`, `tabs`), established root layout shell, and verified full production build.

### T6 — Database Setup (Neon Postgres & Drizzle ORM)

**Status:** done

- [x] **GATE 2**: Request `DATABASE_URL` for Neon Postgres from human
- [x] Install Drizzle ORM, `drizzle-kit`, and `@neondatabase/serverless`
- [x] Create `drizzle.config.ts` targeting PostgreSQL schema
- [x] Set up `db/index.ts` connection client and initialize `db/schema.ts` (empty but valid)
- [x] Add database scripts to `package.json`: `db:generate`, `db:push`, `db:studio`
- [x] Verify connection with a trivial query/ping
      **Notes:** Connected to Neon Postgres, configured Drizzle ORM and `drizzle.config.ts`, added db scripts, and confirmed live connection via `tests/db.test.ts` (executes `SELECT 1`).

### T7 — Environment Handling & Validation

**Status:** done

- [x] Create `.env.example` containing every required environment variable key name without values
- [x] Implement runtime environment validation schema using Zod (`lib/env.ts`) to fail fast at boot
- [x] Audit codebase to ensure `process.env` is never accessed directly outside `lib/env.ts`
      **Notes:** Created `.env.example`, implemented runtime validation with Zod in `lib/env.ts`, wired `db/index.ts` to consume `env.DATABASE_URL`, and audited codebase to ensure no direct `process.env` usage in application modules.

### T8 — Agent Rules & System Documentation

**Status:** done

- [x] Create `AGENTS.md` at repo root with:
  - [x] One-paragraph project summary from `SPEC.md` section 1
  - [x] Pointer: "`SPEC.md` is the source of truth for what to build"
  - [x] Pointer: "`MILESTONES.md` defines the working protocol"
  - [x] Hard rules: engine purity, no fabricated data, privacy constraints, no dependencies without asking
  - [x] Standard commands: dev, build, test, lint, typecheck, db:push
  - [x] Conventional commit guidelines
  - [x] "Stop and ask" policy for human action gates
- [x] Update `CLAUDE.md` to reference `AGENTS.md`
- [x] Initialize `DECISIONS.md` for architecture and trade-off tracking
      **Notes:** Created comprehensive `AGENTS.md`, updated `CLAUDE.md`, and initialized `DECISIONS.md` recording technical choices and rationales.

### T9 — Continuous Integration (CI)

**Status:** skipped

- [ ] ~~Create GitHub Actions workflow (`.github/workflows/ci.yml`) triggering on `push` and `pull_request`~~
- [ ] ~~Workflow steps: checkout, setup Node.js, install dependencies, `typecheck`, `lint`, `test`, `build`~~
- [ ] ~~Push workflow and confirm green CI check run on GitHub~~
      **Notes:** Skipped per user instruction.

### T10 — Initial Deployment to Vercel

**Status:** done

- [x] **GATE 4**: Request human to create Vercel project and link the GitHub repository
- [x] **GATE 5**: Generate secure `AUTH_SECRET` and provide value to human for Vercel and `.env.local`
- [x] Confirm all environment variables are populated in Vercel project settings
- [x] Trigger deployment and verify live application URL responds with HTTP 200
- [x] Record the live URL in `README.md`
      **Notes:** Live deployment verified at `https://job-setu-app.vercel.app/` returning HTTP 200 with full UI shell and styling. Production URL recorded in `README.md`.

## Human actions required

- [x] **GATE 1 (T1)**: Create private GitHub repository and provide repository URL & push permissions
- [x] **GATE 2 (T6)**: Create Neon project/database and provide `DATABASE_URL`
- [x] **GATE 4 (T10)**: Create Vercel project, connect GitHub repository, and input environment variables
- [x] **GATE 5 (T10)**: Receive generated `AUTH_SECRET` and paste into Vercel and `.env.local`

## Changelog

- 2026-10-01: Created initial milestone document for M0 (Bootstrap) per `SPEC.md` and `MILESTONES.md`.
- 2026-10-01: Confirmed T1 is already done and skipped T9 (CI) per user direction.
- 2026-10-01: Completed T2 (Code Quality Toolchain) with ESLint 9, Prettier, Tailwind plugin, .editorconfig, and verified scripts.
- 2026-10-01: Completed T3 (Git Hooks & Commit Standards) with Husky, lint-staged, commitlint, and conventional commit enforcement.
- 2026-10-01: Completed T4 (Testing Infrastructure) with Vitest, React testing library, jsdom, and test scripts.
- 2026-10-01: Completed T5 (UI Foundation) with shadcn/ui, base tokens, root shell, and baseline UI components.
- 2026-10-01: Completed T6 (Database Setup) with Neon Postgres, Drizzle ORM, drizzle-kit, and verified connectivity.
- 2026-10-01: Completed T7 (Environment Handling & Validation) with .env.example, lib/env.ts Zod validation, and live connection test script (npm run db:check).
- 2026-10-01: Completed T8 (Agent Rules & Documentation) with AGENTS.md, CLAUDE.md pointer, and DECISIONS.md architecture log.
- 2026-10-01: Completed T10 (Initial Deployment to Vercel) at https://job-setu-app.vercel.app/ and updated README.md. Milestone 0 complete.
