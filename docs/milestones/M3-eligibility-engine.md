# M3 — The Eligibility Engine

**Status:** complete  
**Depends on:** M2

## Goal

The deterministic, pure core of Kariyar Setu is implemented and proven with 100% mathematical certainty. Inputs in, verdict out. Zero DB calls, zero `fetch`, zero environment variables, zero randomness, zero `Date.now()`. The engine handles category overrides, blocking hard-bars, future eligibility dates, weighted scoring with evidence multipliers, gap ranking by `weight × demandSignal`, real seeded opportunities/archetypes, and the `GET /api/v1/targets/[id]/evaluation` endpoint.

## Acceptance criteria

- [x] `modules/eligibility/evaluate.ts` exports pure evaluation engine resolving category overrides and blocking requirements
- [x] Correct human reason and precise shortfall text computed for failing rules (e.g., `"exceeded by 11 months"`)
- [x] Computable future eligibility date (`futureEligibleOn`) generated when minimum age is not yet reached
- [x] `modules/eligibility/score.ts` implements evidence multipliers (`verified`: 1.0, `project`: 0.8, `declared`: 0.5) and returns 100 if no non-blocking rules exist
- [x] Gaps ranked descending by `priority = weight × demandSignal`
- [x] All 7 required unit tests in `SPEC.md` 6.3 pass with 100% determinism
- [x] Two real Madhya Pradesh opportunities and two archetypes seeded with verified official clauses
- [x] `GET /api/v1/targets/[id]/evaluation` runs the engine on user target and returns typed `EvaluationResult`
- [x] All quality checks pass (`npm run typecheck && npm run lint && npm run test && npm run build`)

## Tasks

### T1 — Core Blocking & Override Resolution (`modules/eligibility/evaluate.ts`)

**Status:** done  
**Owner:** Antigravity (Ponytail)

- [x] Implement category override resolution (replaces base rule value with override when category matches)
- [x] Implement blocking evaluation for age caps, age minimums, domicile, qualification, category, and skill requirements
- [x] Implement exact shortfall calculation (age shortfall, qualification mismatch, domicile mismatch)
- [x] Implement `futureEligibleOn` calculation for age minimums not yet satisfied

### T2 — Weighted Scoring & Gap Ranking (`modules/eligibility/score.ts`)

**Status:** done  
**Owner:** Antigravity (Ponytail)

- [x] Implement evidence multipliers: verified (1.0), project (0.8), declared (0.5), non-skill met (1.0)
- [x] Implement weighted score formula: `round(100 × Σ(weight × multiplier) / Σ(weight))`
- [x] Handle edge case: if no non-blocking requirements, score is 100
- [x] Implement gap priority calculation: `priority = weight × (source.type === "interview_evidence" ? matchCount / sampleSize : 1.0)`
- [x] Sort gaps descending by priority

### T3 — Engine Unit Tests (`tests/eligibility/engine.test.ts`)

**Status:** done  
**Owner:** Antigravity (Ponytail)

- [x] Test 1: blocking age cap fails with correct shortfall text
- [x] Test 2: category override changes the outcome (e.g. age 30 fails general, passes OBC)
- [x] Test 3: minimum-age rule produces correct `futureEligibleOn` ISO date
- [x] Test 4: score is 100% deterministic on identical input
- [x] Test 5: evidence multiplier changes score as specified
- [x] Test 6: no non-blocking requirements produces score 100
- [x] Test 7: gap ordering respects `weight × demandSignal`

### T4 — Seed Opportunities & Archetypes (`modules/seed/eligibility.ts`)

**Status:** done  
**Owner:** Antigravity (Ponytail)

- [x] Seed 2 real Madhya Pradesh recruitment opportunities (MPPSC State Service Exam, MP Police Constable) with real citations
- [x] Seed 2 role archetypes (Junior Software Engineer, Administrative Assistant)
- [x] Provide idempotent seed runner / test (`tests/eligibility/seed.test.ts`)

### T5 — Evaluation API Endpoint (`app/api/v1/targets/[id]/evaluation/route.ts`)

**Status:** done  
**Owner:** Antigravity (Ponytail)

- [x] Create `GET /api/v1/targets/[id]/evaluation`
- [x] Enforce user authentication and UUID param validation
- [x] Check active `eligibility_processing` consent; block evaluation if consent revoked
- [x] Decrypt profile, fetch user skills, load target requirements, pass current date, and execute engine
- [x] Write integration test in `tests/eligibility/api.test.ts`

## Human actions required

- [ ] Review `Requirement` evaluation engine implementation before proceeding to M4 (Target Workspace UI)

## Changelog

- 2026-10-01: Completed M3 (Pure eligibility engine `evaluate.ts` & `score.ts`, all 7 SPEC tests in `tests/eligibility/engine.test.ts`, seed data in `modules/seed/eligibility.ts`, evaluation API endpoint `GET /api/v1/targets/[id]/evaluation` with consent check).
- 2026-10-01: Created initial milestone document for M3 (The Eligibility Engine) per `SPEC.md` section 6 and `MILESTONES.md`.
