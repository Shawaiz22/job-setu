<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Job Setu — Agent Rules & System Architecture

## 1. Project Summary

An eligibility verification platform for Madhya Pradesh government opportunities. A student enters their details once. The system tells them, for every ingested government notification and welfare scheme: which ones they can apply for, which ones they cannot, and the exact clause that blocks them, and which ones they will become eligible for, and when. The output is a verdict with a citation, not a recommendation.

> Every other platform recommends opportunities. We decide eligibility, and we cite the rule that decided it.

## 2. Core Documentation & Sources of Truth

- **`SPEC.md`** is the single source of truth for **what to build**. Where any prior assumption and `SPEC.md` conflict, `SPEC.md` wins.
- **`MILESTONES.md`** defines the **working protocol** and execution order.
- **`DECISIONS.md`** records non-obvious architecture choices and rationale ("why not X").

## 3. Non-Negotiable Hard Rules

1. **Engine Purity (`modules/eligibility`)**:
   - Every function in `modules/eligibility/` is **pure**: inputs in, result out.
   - Zero database calls, zero `fetch`, zero environment variables, zero randomness, zero `Date.now()` (pass the evaluation date in as a parameter).
2. **No Fabricated Data**:
   - Never fabricate rules, API responses, age caps, fees, or fallback/synthetic content.
   - If something fails, surface the real error. If a value cannot be verified from official notifications/schemes, omit rather than guessing.
3. **Privacy & Sensitive Data Handling**:
   - `dateOfBirth`, `category` (caste data), and `domicileState` are **sensitive**.
   - Encrypt at rest; never log them at any level (including error traces); never put in URLs or query params; never send in AI prompts.
   - Run PII redaction (`modules/privacy/redact.ts`) before any text reaches an AI model.
   - Always scope user-owned database queries strictly by `userId`.
4. **Modern & Non-Deprecated Code**:
   - Always write clean, readable code using the latest non-deprecated APIs and conventions (e.g., Zod 4 `z.uuid()` instead of deprecated `z.string().uuid()`).
   - Heed deprecation notices immediately and never introduce deprecated patterns.
5. **Concise & Meaningful Comments**:
   - Do not write verbose or redundant comments that create visual noise.
   - Keep comments short, meaningful, and focused on non-obvious intent or rationale. Only comment when actually needed.
6. **Dependency Hygiene**:
   - Do NOT add new dependencies or libraries beyond the specified stack in `SPEC.md` without asking for explicit approval first.
7. **Human Action Gates — Stop and Ask**:
   - When encountering a human action gate (secrets, accounts, external approvals), stop immediately, state what is needed using the standard gate format, and wait. Do not stub, mock, or scaffold around it.

## 4. Standard Commands

- `npm run dev`: Start Next.js Turbopack development server
- `npm run build`: Production bundle compilation and validation
- `npm run test`: Run Vitest unit & component test suite
- `npm run test:watch`: Run Vitest in interactive watch mode
- `npm run test:coverage`: Run test coverage report
- `npm run lint`: Run ESLint checks
- `npm run lint:fix`: Run ESLint auto-fixer
- `npm run format`: Format repository with Prettier
- `npm run format:check`: Verify code formatting
- `npm run typecheck`: Run TypeScript compiler check (`tsc --noEmit`)
- `npm run db:generate`: Generate Drizzle schema migrations
- `npm run db:push`: Push Drizzle schema directly to Neon Postgres
- `npm run db:studio`: Launch Drizzle Studio database viewer
- `npm run db:check`: Test live connection to Neon Postgres database

## 5. Commit & Working Protocol

- **One Step at a Time**: Perform one small, coherent change, stop, and report. Never chain unapproved steps.
- **Never Run `git push`**: The user pushes code. Agents must never execute `git push`.
- **Always Ask Before Committing**: Never run `git commit` without explicit confirmation from the user. Always pause and ask.
- **Keep Documentation Untracked**: `SPEC.md`, `MILESTONES.md`, and `docs/` must remain uncommitted and untracked in git.
- **Small, Frequent, Conventional Commits**: Follow Conventional Commits (`feat: ...`, `fix: ...`, `chore: ...`). Commits are validated via `commitlint` and `husky`.
- **Secret Protection**: Never commit secrets. Ensure `.env.local` is gitignored; `.env.example` contains variable names only.
