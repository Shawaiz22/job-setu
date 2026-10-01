# Build Specification

> **Read this fully before writing any code.** This document is the single source of truth
> for what to build. Where this document and a prior assumption conflict, this document wins.
> If something is not specified here, ask rather than invent.

---

## 1. What this project is

An eligibility verification platform for Madhya Pradesh government opportunities.

A student enters their details once. The system tells them, for every ingested government
notification and welfare scheme:

- which ones they **can** apply for,
- which ones they **cannot**, and the exact clause that blocks them,
- which ones they will **become** eligible for, and when.

**The output is a verdict with a citation, not a recommendation.**

### One-line positioning

> Every other platform recommends opportunities. We decide eligibility, and we cite the
> rule that decided it.

---

## 2. Non-goals — do NOT build these

These are explicitly out of scope. Building them wastes time and weakens positioning.

- A browsable feed of job listings
- A browsable feed of interview experiences (experiences surface ONLY as aggregates)
- Any social feature: comments, likes, following, profiles of other users
- Resume storage — parse and discard, never retain the file
- A chatbot or general conversational assistant
- Multi-language UI (English only for v1; content may contain Hindi text)
- Admin user management, roles, permissions beyond a single hardcoded admin flag
- Payments, subscriptions, or any monetisation surface
- Mobile apps — responsive web only

### Deferred (specify in docs, do not build unless Tier 0–3 are complete)

- Resume parsing
- Mock interview
- Email/SMS notifications
- Multi-state support beyond a `state` column

---

## 3. Stack — use exactly these

| Concern    | Choice                                     | Notes                                     |
| ---------- | ------------------------------------------ | ----------------------------------------- |
| Framework  | Next.js 15+, App Router                    | TypeScript strict mode                    |
| Language   | TypeScript                                 | `strict: true`, no `any`                  |
| Database   | PostgreSQL (Neon serverless)               |                                           |
| ORM        | Drizzle ORM + `drizzle-zod`                |                                           |
| Validation | Zod                                        | At every boundary                         |
| Auth       | Auth.js (NextAuth) v5                      | Email + password, httpOnly session cookie |
| Styling    | Tailwind CSS + shadcn/ui                   |                                           |
| Charts     | Recharts                                   | Only if a chart is genuinely needed       |
| AI SDK     | Vercel AI SDK (`ai`) with `generateObject` | Structured output only                    |
| PDF text   | `unpdf`                                    | Serverless-compatible                     |
| Hosting    | Vercel                                     | Deploy in the first hour, not the last    |

**Do not add libraries beyond this list without asking.** Every dependency is something
the team must be able to explain to a judge.

---

## 4. Repository structure

```
/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (app)/
│   │   ├── targets/                 # home — list of targets
│   │   ├── targets/[id]/            # target workspace
│   │   ├── targets/new/             # add a target
│   │   └── profile/                 # profile + skills + consent
│   ├── (admin)/
│   │   └── admin/notifications/     # ingest + review extracted rules
│   └── api/
│       └── v1/
├── modules/
│   ├── eligibility/                 # THE ENGINE — pure, no I/O
│   │   ├── evaluate.ts
│   │   ├── score.ts
│   │   └── types.ts
│   ├── extraction/                  # AI: PDF/JD -> requirements
│   ├── privacy/                     # redaction, consent helpers
│   └── seed/                        # seed data + loaders
├── db/
│   ├── schema.ts
│   └── index.ts
├── lib/
├── data/
│   └── notifications/               # real PDFs committed to repo
├── DECISIONS.md
└── SPEC.md                          # this file
```

### Hard rule on `modules/eligibility`

Every function in this folder is **pure**: inputs in, result out. No database calls, no
`fetch`, no environment variables, no randomness, no `Date.now()` (pass the evaluation
date in as a parameter).

Reason: it must be unit-testable without infrastructure, and explainable on stage in
thirty seconds. This is the most important constraint in this document.

---

## 5. Data model

### 5.1 The Requirement type — get this right first

Everything depends on this shape. Do not change it without flagging.

```ts
export type RequirementKind =
  | "age"
  | "qualification"
  | "domicile"
  | "category"
  | "skill"
  | "certification"
  | "experience_years"
  | "attempts"; // not implemented — needs a per-target
// attempts(userId, opportunityId, count) table

export type RequirementOp = "max" | "min" | "equals" | "has" | "one_of";

export type RequirementSource =
  | { type: "notification"; clause: string; page?: number; documentId: string }
  | { type: "job_description"; excerpt: string }
  | { type: "archetype"; note: string }
  | { type: "scheme"; clause: string; documentId: string }
  | { type: "interview_evidence"; sampleSize: number; matchCount: number };

export type Requirement = {
  id: string;
  kind: RequirementKind;
  op: RequirementOp;
  value: string | number | string[];

  /** Category-specific overrides, e.g. age cap 28 general, 33 for OBC. */
  overrides?: { whenCategory: string; value: string | number }[];

  /** true = hard bar. Failing it blocks the application entirely. */
  blocking: boolean;

  /** 1-10. Only meaningful when blocking === false. */
  weight: number;

  label: string; // human-readable, shown in UI
  source: RequirementSource;
};
```

### 5.2 Tables (Drizzle)

```
users            id, email, passwordHash, isAdmin, createdAt
profiles         userId (FK, unique), dateOfBirth*, category*, domicileState*,
                 qualification, preference('govt'|'private'|'both')
skills           id, userId, name, evidence('verified'|'project'|'declared')
targets          id, userId, kind('govt_post'|'scheme'|'job_description'|'archetype'),
                 sourceId, title, createdAt
opportunities    id, kind('govt_post'|'scheme'), title, department, state,
                 closesOn, requirements(jsonb), sourceDocumentPath, status('draft'|'live')
archetypes       id, title, requirements(jsonb)
experiences      id, userId, company, role, year, rounds(jsonb), askedAbout(jsonb),
                 outcome, verificationLevel, createdAt
consents         id, userId, purpose, version, grantedAt, revokedAt
```

`*` = sensitive. See section 9.

**Notes:**

- `requirements` stored as `jsonb` — a validated `Requirement[]`.
- `targets` references an opportunity/archetype by `sourceId`; requirements are read from
  there at evaluation time, never copied into the target.
- Every user-owned query MUST filter by `userId`. See section 9.

---

## 6. The eligibility engine

### 6.1 Contract

```ts
export type EvaluationInput = {
  profile: {
    dateOfBirth: string; // ISO
    category: string;
    domicileState: string;
    qualification: string;
  };
  skills: { name: string; evidence: "verified" | "project" | "declared" }[];
  requirements: Requirement[];
  evaluatedOn: string; // ISO date — passed in, never Date.now()
};

export type EvaluationResult =
  | {
      status: "blocked";
      failures: {
        requirement: Requirement;
        reason: string;
        shortfall?: string;
      }[];
      gaps: Gap[]; // still returned — user may qualify later
      futureEligibleOn?: string; // ISO date, if computable
    }
  | {
      status: "eligible";
      score: number; // 0-100
      met: Requirement[];
      gaps: Gap[];
    };

export type Gap = {
  requirement: Requirement;
  priority: number; // weight × demandSignal
  suggestedAction?: { label: string; deadline?: string };
};
```

### 6.2 Algorithm — implement exactly

**Step 1 — resolve overrides.**
For each requirement, if `overrides` contains an entry matching the profile's category,
use that value instead of the base value.

**Step 2 — blocking pass.**
Evaluate every requirement where `blocking === true`.
If any fails → return `status: "blocked"` with:

- the failing requirement,
- a human reason string built from the label and the actual value,
- a `shortfall` where computable (e.g. `"exceeded by 11 months"`).

Compute `futureEligibleOn` where the rule is time-dependent in the user's favour
(e.g. a minimum age not yet reached). Age _caps_ can never become satisfiable — return
no date for those.

**Step 3 — weighted score.** Only if no blocking requirement failed.

```
evidenceMultiplier:
  verified  -> 1.0
  project   -> 0.8
  declared  -> 0.5
  (non-skill requirements that are met -> 1.0)

score = round(
  100 × Σ(weight × evidenceMultiplier) over met non-blocking requirements
      ÷ Σ(weight) over all non-blocking requirements
)
```

If there are no non-blocking requirements, score is 100.

**Step 4 — rank gaps.**

```
demandSignal =
  source.type === "interview_evidence"
    ? matchCount / sampleSize
    : 1.0

priority = weight × demandSignal
```

Sort descending. Return all gaps; the UI shows the top three.

### 6.3 Required unit tests

Write these alongside the engine, not after:

- blocking age cap fails, with correct shortfall text
- category override changes the outcome (same profile, different category)
- minimum-age rule produces a correct `futureEligibleOn`
- score is deterministic: same inputs → same output, called twice
- evidence multiplier changes the score as specified
- no non-blocking requirements → score 100
- gap ordering respects `weight × demandSignal`

---

## 7. AI usage — strict boundaries

### 7.1 Where AI is allowed

| Task                                      | Model call                                           | Output                      |
| ----------------------------------------- | ---------------------------------------------------- | --------------------------- |
| Notification PDF → requirements           | `generateObject` with the `Requirement[]` Zod schema | Draft rules, status `draft` |
| Job description text → requirements       | same                                                 | Draft rules                 |
| Summarise retrieved interview experiences | text generation                                      | A briefing string           |

### 7.2 Where AI is forbidden

- Deciding eligibility
- Computing the score
- Ranking gaps
- Writing anything directly to the database without human review
- Receiving any sensitive field (see section 9)

### 7.3 Extraction flow

```
PDF → unpdf text → redact → generateObject(RequirementArraySchema)
    → store with status "draft"
    → admin reviews in /admin/notifications
    → admin publishes → status "live"
```

**Draft rules never affect any user's verdict.** Only `live` opportunities are evaluated.

### 7.4 Prompting rules

- Always `generateObject` with a Zod schema. Never free-text parsing.
- Instruct the model to return `null` for any field it cannot find, never to guess.
- Every extracted requirement MUST carry a `clause` string quoted from the document. If
  the model cannot cite a clause, the requirement is dropped.
- On extraction failure, surface a real error. Never substitute placeholder rules.

---

## 8. API routes

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login

GET    /api/v1/profile
PUT    /api/v1/profile
POST   /api/v1/profile/skills
DELETE /api/v1/profile/skills/[id]
DELETE /api/v1/profile                  # delete-my-data, cascades

GET    /api/v1/opportunities            # live only, filterable
GET    /api/v1/targets
POST   /api/v1/targets
DELETE /api/v1/targets/[id]
GET    /api/v1/targets/[id]/evaluation  # runs the engine

POST   /api/v1/experiences
GET    /api/v1/experiences/aggregate    # aggregates only, never raw rows

POST   /api/v1/admin/notifications      # upload + extract  (admin)
PUT    /api/v1/admin/notifications/[id] # review + publish  (admin)
```

**Status code conventions:**

- `401` when unauthenticated
- `404` when the resource exists but belongs to another user (never `403` — do not
  confirm existence)
- `400` for validation failures, with the Zod error shape
- `503` when an AI provider fails — never fall back to fabricated data

---

## 9. Privacy and security — non-negotiable

The team was penalised on this in a previous event. Treat every rule here as a hard
requirement.

### 9.1 Sensitive fields

`dateOfBirth`, `category`, `domicileState` are **sensitive**. Category is caste data.

For these fields:

- Encrypt at rest (application-level encryption before insert)
- **Never** log them, at any level, including error traces
- **Never** place them in a URL, query string, or path parameter
- **Never** include them in any AI prompt under any circumstance
- **Never** render them in a list view or any shareable surface

### 9.2 PII redaction before AI calls

Build `modules/privacy/redact.ts` **before** any AI call is written.

```ts
export function stripPII(text: string): {
  redacted: string;
  map: Map<string, string>;
};
export function restorePII(text: string, map: Map<string, string>): string;
```

Redact at minimum: email addresses, phone numbers, postal addresses, and any string
matching the user's own stored name. The model sees `[NAME]`, `[EMAIL]`, `[PHONE]`.

### 9.3 Consent

Separate, purpose-bound consent records. Not one checkbox.

| Purpose                  | Required?                                                |
| ------------------------ | -------------------------------------------------------- |
| `eligibility_processing` | Required to use the product; explained in plain language |
| `experience_publication` | Optional, per submission                                 |
| `notifications`          | Optional, opt-in                                         |

Each consent row stores purpose, version, `grantedAt`. Revocation sets `revokedAt` and
takes effect immediately.

### 9.4 Data subject rights

- `GET /api/v1/profile/export` returns the user's full data as JSON
- `DELETE /api/v1/profile` **cascades**: profile, skills, targets, consents, experiences.
  No orphaned rows. Write a test for this.

### 9.5 Query scoping

Every query touching a user-owned entity:

```ts
where(and(eq(table.id, id), eq(table.userId, session.user.id)));
```

No exceptions. Validate every `[id]` route param as a UUID before it reaches the database.

### 9.6 Experiences are decoupled from identity

`experiences.userId` exists for verification only. It is never returned by any API
response, never rendered, and experiences are exposed exclusively through the aggregate
endpoint.

---

## 10. Seed data

Committed to the repo under `data/` and `modules/seed/`.

| What                                 | Count | Notes                                                                  |
| ------------------------------------ | ----- | ---------------------------------------------------------------------- |
| Government notifications (real PDFs) | 15–20 | Downloaded from official sources. Keep 3 unprocessed for the live demo |
| MP welfare schemes                   | 10–15 | Real schemes, rules verified from official sources                     |
| Role archetypes                      | 8–10  | Hand-written requirement lists                                         |
| Interview experiences                | 40–60 | Structured from published sources; label clearly as seeded demo data   |

**Never fabricate a rule, an age cap, a fee, or a scheme entitlement.** These are real
entitlements affecting real people, and a judge from MPOnline will know the true values.
If a value cannot be verified, omit the requirement rather than guessing.

---

## 11. Screens

| Route                  | Contents                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `/register`, `/login`  | Email + password                                                                                                                |
| `/profile`             | Six fields; preference selector; skills with evidence level; consent controls; export and delete                                |
| `/targets`             | Home. Cards per target: score or blocked verdict, next action. Plus: closing-soon alerts, new-this-week filtered by eligibility |
| `/targets/new`         | Three routes: browse government opportunities, browse schemes, pick an archetype                                                |
| `/targets/[id]`        | Tabs: **Readiness** · **Gaps** · **Prep intel**                                                                                 |
| `/admin/notifications` | Upload PDF, view extracted draft rules, edit, publish                                                                           |

### Verdict rendering

```
BLOCKED   red    Failing rule + clause + shortfall
ELIGIBLE  green  Score, met requirements, top-3 gaps
SOON      amber  Date of future eligibility
```

Always show the clause reference next to a blocking failure. That citation is the product.

---

## 12. Build order

Complete each tier before starting the next. Each tier is independently demonstrable.

### Tier 0 — spine

- [ ] Repo, Next.js, TypeScript strict, Tailwind, shadcn
- [ ] Neon + Drizzle connected, schema pushed
- [ ] **Deployed to Vercel** (do this first, not last)
- [ ] `Requirement` type finalised
- [ ] Auth working
- [ ] `modules/privacy/redact.ts` with tests

### Tier 1 — engine

- [ ] `modules/eligibility` complete and pure
- [ ] All unit tests from 6.3 passing
- [ ] Profile, targets, skills tables + CRUD
- [ ] 2 opportunities and 2 archetypes seeded by hand
- [ ] `/targets` and `/targets/[id]` rendering real verdicts

### Tier 2 — differentiator

- [ ] PDF upload → `unpdf` → `generateObject` → draft rules
- [ ] Admin review and publish flow
- [ ] 15–20 notifications ingested (3 held back)
- [ ] Job-description paste → same pipeline
- [ ] 10–15 MP schemes seeded

### Tier 3 — breadth

- [ ] Gap → certification/course mapping with next exam dates
- [ ] Experience submission form
- [ ] Aggregate endpoint + demand signals feeding gap priority
- [ ] Closing-soon and new-this-week on `/targets`

### Tier 4 — only if 0–3 are complete

- [ ] Similarity retrieval for related roles
- [ ] LLM prep briefing with sample sizes shown
- [ ] Resume parse → propose → confirm
- [ ] Mock interview per target

---

## 13. Conventions

- **Commits:** small, frequent, descriptive. `feat: age relaxation overrides by category`,
  not `updates`. Push at least hourly.
- **`DECISIONS.md`:** one entry per non-obvious choice, each with a "why not X" line.
  Maintained continuously, not written at the end.
- **No fabricated data anywhere.** No demo fallbacks, no canned AI responses, no synthetic
  chart data. If a provider fails, surface the error.
- **README:** setup steps plus an attribution section listing every library, API and data
  source used.

---

## 14. Definition of done for the demo

A judge can, in sixty seconds:

1. Enter a profile and receive a **blocked** verdict citing a real clause
2. Change one attribute (category) and watch the verdict flip
3. See a second target for the same student with a different score and different gaps
4. Watch an unseen notification PDF produce structured rules
5. See a blocked student matched to a welfare scheme they qualify for

If a feature does not serve one of those five moments or the privacy story, deprioritise it.
