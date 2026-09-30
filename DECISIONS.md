# Architecture Decisions Log

> This document records non-obvious technical and architectural decisions, their context, and the explicit rationale for why alternative approaches were rejected ("why not X").

---

## 2026-10-01 — Drizzle ORM with Neon Serverless HTTP Driver

- **Decision:** Use Drizzle ORM (`drizzle-orm/neon-http`) paired with `@neondatabase/serverless` and `drizzle-kit`.
- **Context:** The application runs on serverless infrastructure (Vercel) connecting to Neon PostgreSQL.
- **Why not Prisma?** Prisma relies on a heavyweight query engine binary that increases cold starts on serverless Lambdas and struggles with pool connection limits in serverless environments. Drizzle provides zero-cold-start HTTP queries via Neon's serverless driver, native TypeScript type inference, and direct integration with `drizzle-zod`.
- **Why not raw `pg` / `postgres.js`?** Raw drivers lack automatic compile-time type safety across schema updates and require manual query mapping and migrations.

---

## 2026-10-01 — Vitest for Unit and Component Testing

- **Decision:** Adopt Vitest as the unified test runner with `@vitejs/plugin-react` and `jsdom`.
- **Context:** Need fast, reliable test execution for both pure module logic (`modules/eligibility`) in a Node environment and UI components in a DOM environment.
- **Why not Jest?** Jest requires complex ESM transformers (babel/ts-jest) that frequently conflict with Next.js 15+ App Router imports and modern module resolution. Vitest natively supports TypeScript, ESM, path aliases, and fast parallel execution out of the box.

---

## 2026-10-01 — Runtime Environment Validation via Zod (`lib/env.ts`)

- **Decision:** Validate all environment variables at application startup using a strict Zod schema in `lib/env.ts`, forbidding direct `process.env` access elsewhere.
- **Context:** Missing or malformed configuration (such as `DATABASE_URL` or `AUTH_SECRET`) should immediately stop execution rather than failing deep inside runtime requests.
- **Why not inline `process.env` lookups?** Direct access across multiple files leads to inconsistent fallback behaviors, silent undefined values, and difficult-to-trace runtime exceptions in production.

---

## 2026-10-01 — Strict TypeScript with `noUncheckedIndexedAccess`

- **Decision:** Enable `strict: true` and `noUncheckedIndexedAccess: true` in `tsconfig.json`.
- **Context:** The core eligibility evaluation engine evaluates complex arrays of requirements, overrides, and gaps.
- **Why not standard strict mode?** Standard strict mode types `array[i]` as `T` even when the index does not exist. `noUncheckedIndexedAccess` forces handling of `T | undefined`, eliminating unexpected out-of-bounds crashes during rule matching.
