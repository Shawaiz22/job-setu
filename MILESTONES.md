# Milestones & Working Protocol

> `SPEC.md` defines **what** to build. This document defines **how we work** and **in what
> order**. Read both before touching code.
>
> More than one person and more than one agent now work in this repo. The milestone
> documents in `docs/milestones/` are the only reliable record of what is done. Read them
> before you start anything.

---

## Status board

Keep this table accurate. It is the first thing anyone reads.

| Milestone | Title                   | Status                           |
| --------- | ----------------------- | -------------------------------- |
| M0        | Bootstrap               | complete                         |
| M1        | Data model and auth     | complete                         |
| M2        | Privacy foundation      | complete                         |
| M3        | Eligibility engine      | complete                         |
| M4        | Target workspace UI     | not started                      |
| M5        | Notification ingestion  | not started                      |
| M6        | Schemes and demo polish | not started                      |
| M7        | Submission pack         | not started                      |
| M8+       | Post-submission         | locked — see the note at the end |

**MVP cut line is after M6.** Everything below it is optional. Everything above it ships.

---

## 0. Working protocol

### 0.1 One step at a time

Do **one small step**, then stop and report. A human reviews. Wait to be told to proceed.
Do not chain steps.

A small step is one file, one coherent change, or one subtask. If unsure whether something
is one step or three, treat it as three.

### 0.2 Before you start anything

1. Read the status board above
2. Read `docs/milestones/` for the milestone you are about to touch
3. Check no task is already marked **in progress** by someone else
4. Claim your task: set its status to `in progress` and add `**Owner:** <name>`
5. Commit that claim before writing code

This is how three people and two agents avoid building the same thing twice.

### 0.3 Milestone documents

Before writing code for a new milestone, create `docs/milestones/M<n>-<slug>.md`, break it
into tasks and subtasks, show it to a human, and wait for approval.

```markdown
# M<n> — <Title>

**Status:** not started | in progress | complete
**Depends on:** M<n-1>

## Goal

One paragraph. What is true when this is done.

## Acceptance criteria

- [ ] Concrete, checkable statements

## Tasks

### T1 — <title>

**Status:** todo | in progress | done | blocked
**Owner:** <name>

- [ ] subtask
      **Notes:** decisions, deviations, blockers

## Human actions required

- [ ] Anything a person must do

## Changelog

- YYYY-MM-DD: what changed and why
```

### 0.4 Updating and committing documents — not optional

- After each **task**: update its status, tick its subtasks, write its notes
- After each **milestone**: set status complete, update the status board in this file,
  summarise what changed versus the original plan
- **Commit the markdown in the same commit as the code it describes.** A commit that
  changes behaviour without updating its milestone document is incomplete.
- Commit message convention: `docs(M1): complete T6 profile UI`

The documents are the handoff. If you finish a task and do not write it down, the next
person redoes it.

### 0.5 Changing the plan

You may edit a milestone document when we change direction. Record the change in its
changelog with the reason. Never diverge silently.

Changes to `SPEC.md` need a human's approval first. Ask, do not edit.

### 0.6 Human action gates — STOP and ask

When you need something only a person can do, stop and say so in this format. Do not stub
it, scaffold around it, or skip ahead.

```
BLOCKED — human action required
What I need: <e.g. GOOGLE_GENERATIVE_AI_API_KEY>
Where to get it: <exact steps or URL>
Where to put it: <.env.local, key name>
Why I cannot proceed: <one line>
```

| #   | What                  | Status           |
| --- | --------------------- | ---------------- |
| 1   | GitHub repo           | done             |
| 2   | Neon `DATABASE_URL`   | done             |
| 3   | AI provider key       | **needed at M5** |
| 4   | Vercel project linked | done             |
| 5   | `AUTH_SECRET`         | done             |

Ask for one gate at a time, when you reach it.

### 0.7 Rules while working

- Never fabricate data, rules, API responses, or fallback content. If something fails,
  surface the real error.
- Never commit secrets.
- Append to `DECISIONS.md` for any non-obvious choice, with a "why not X" line.
- No new dependencies without asking.
- If `SPEC.md` does not cover it, ask. Do not invent.

---

## M0 — Bootstrap ✅ complete

Next.js, TypeScript strict, Tailwind, shadcn, ESLint, Prettier, Husky, lint-staged,
commitlint, Vitest, Drizzle, Neon, env validation, `AGENTS.md`, CI, Vercel deploy.

---

## M1 — Data model and auth ✅ complete

**Done:** T1 `Requirement` type and Zod schemas · T2 all 8 Drizzle tables pushed to Neon ·
T3 query scoping helper with UUID validation · T4 Auth.js v5 credentials with scrypt
hashing · T5 register and profile API endpoints with boundary validation · T7 remove attemptsUsed ·
T6 register, login and profile UI.

### T7 — Remove `attemptsUsed` (do this before T6)

**Status:** done

Attempt limits are per-exam, not per-person. A single profile column is meaningless once a
student has two targets, and most MP posts cap by age rather than attempts.

- [x] Drop the column from `profiles` in `db/schema.ts`, run `db:push`
- [x] Remove from profile Zod schemas, the `PUT` handler, and test fixtures
- [x] Keep `"attempts"` in `RequirementKind`, unimplemented, with a comment explaining that
      it needs a per-target `attempts(userId, opportunityId, count)` table if ever required
- [x] `DECISIONS.md` entry

### T6 — Register, login and profile UI

**Status:** done

- [x] `/register` — form validation, error states, redirect on success
- [x] `/login` — email and password, credential error handling
- [x] `/profile` — **five fields**: dateOfBirth, category, domicileState, qualification,
      preference. No `attemptsUsed`
- [x] Header shell reflects session state
- [x] End-to-end check: register → login → view profile → edit profile

### M1 acceptance criteria

- [x] A new user can register, log in, save a profile, and see it after re-login
- [x] `attemptsUsed` appears nowhere in the codebase
- [x] All quality checks pass

**Human gate:** the `Requirement` type must be reviewed before M3 begins.

---

## M2 — Privacy foundation

Must land before any AI call is written. The team was penalised on this previously; treat
every item as a hard requirement. Covers `SPEC.md` section 9.

- `modules/privacy/redact.ts` — `stripPII` and `restorePII`, with tests
- Application-level encryption for `dateOfBirth`, `category`, `domicileState`
- Log redaction layer — prove no sensitive field can reach a log or error trace
- Consent model and UI: purpose-bound, versioned, revocable
- `GET /api/v1/profile/export`
- `DELETE /api/v1/profile` with full cascade, plus a test proving no orphaned rows

**Acceptance:** a judge can click delete-my-data and see the rows gone, and `stripPII` can
be shown turning a real resume line into `[NAME] worked on a React project`.

---

## M3 — The eligibility engine

The core of the product. Covers `SPEC.md` section 6. No I/O anywhere in
`modules/eligibility` — pure functions only.

- `evaluate.ts` — override resolution, blocking pass, future eligibility
- `score.ts` — weighted score with evidence multipliers, gap ranking by `weight × demand`
- Every test in `SPEC.md` 6.3 passing
- Two opportunities and two archetypes seeded by hand
- `GET /api/v1/targets/[id]/evaluation`

**A working reference implementation of this algorithm exists in the design prototype.**
Behaviour should match it. When they disagree, `SPEC.md` 6.2 wins.

**Human gate:** reviewed line by line before M4. This is the file a judge will ask us to
walk through.

---

## M4 — Target workspace UI

- `/targets` — cards with score or blocked verdict, clause citation visible on the card
- `/targets/new` — browse government posts, browse schemes, pick an archetype
- `/targets/[id]` — Readiness and Gaps tabs
- Verdict rendering per `SPEC.md` section 11

The prototype shows the intended layout and the clause-extract treatment. Match it.

**After this milestone we have a demonstrable product.** If everything after this fails, we
still have something to submit.

---

## M5 — Notification ingestion

The demo moment. Covers `SPEC.md` section 7.

- **GATE 3:** AI provider key
- `unpdf` text extraction
- `generateObject` with the `Requirement[]` schema; a requirement without a clause citation
  is dropped, never kept
- Admin review and publish at `/admin/notifications`; drafts never affect a student verdict
- Ingest 10–15 real notifications, **hold 3 back unprocessed for the live demo**
- Job-description paste through the same pipeline

---

## M6 — Schemes and demo polish

- 10–15 real MP schemes seeded as opportunities
- **Scheme matching surfaced on a blocked verdict** — this turns our worst screen into our
  best one
- Gap → certification mapping with next exam dates
- Closing-soon and new-this-week on `/targets`, both filtered by eligibility
- Seed a demo account with a realistic profile so nothing has to be typed on stage

**This is the MVP cut line.** When M6 is done, stop building and move to M7.

---

## M7 — Submission pack

Code freeze. Nobody writes a feature during this milestone.

- [ ] Screenshots of every real screen
- [ ] Demo video, unlisted, 3 minutes
- [ ] README with setup, live URL, and a full attribution section
- [ ] `DECISIONS.md` tidied and readable
- [ ] Eight documents finalised and each compressed under 1 MB
- [ ] Field 10 pasted, under 3000 characters
- [ ] Repository URL in the form
- [ ] **Submit with hours to spare, not minutes**

### Known data requirement

Every rule, fee, age cap and scheme entitlement in the seed data must come from a real
published source. Nothing invented. A panel from MPOnline will know the true values.

---

## M8+ — Post-submission

**Locked until we have written confirmation.** Clause 2.1 of the event handbook states no
changes may be made to a project after submission. Until an organiser tells us otherwise in
writing, treat the submitted commit as final.

If post-submission work is permitted, the queue is:

- Interview experience submission form, aggregation, demand signals
- Similarity retrieval and LLM prep briefing with sample sizes shown
- Resume upload → parse → confirm (never auto-sync to profile)
- Mock interview per target
- Multi-state support beyond the `state` column

---

## Right now

1. Finish M1 T7 (removal), then T6 (UI)
2. Move to M2. Do not skip it to reach the demo faster
3. Update the status board in this file when each milestone completes
