# M5 — Notification Ingestion

**Status:** complete  
**Depends on:** M4

## Goal

Provide a robust, legally grounded notification ingestion pipeline that extracts deterministic, clause-cited `Requirement[]` from official MP government recruitment PDFs and job descriptions using `unpdf` text extraction and Gemini structured object generation. Extracted opportunities are strictly stored with status `draft` and reviewed by administrators at `/admin/notifications` before being published as `live`. Ingested data cites official clauses; draft opportunities never affect candidate eligibility evaluations.

## Acceptance criteria

- [x] PDF text extraction using `unpdf` with PII redaction (`modules/privacy/redact.ts`) before passing to AI
- [x] Structured extraction using `generateObject` with Zod schema (`RequirementArraySchema`)
- [x] Clause enforcement: any extracted requirement missing an exact official clause citation is dropped
- [x] Isolation: newly extracted opportunities are stored as `draft` and never evaluated for students until published `live`
- [x] Admin API endpoints:
  - `POST /api/v1/admin/notifications` (upload PDF or text → extract requirements → store draft)
  - `PUT /api/v1/admin/notifications/[id]` (review, edit requirements, publish to `live`)
  - Admin-only authorization protection (`isAdmin === true`)
- [x] Admin Review UI at `/admin/notifications`:
  - List draft and live opportunities
  - Review clause citations, modify requirements, and 1-click publish
- [x] Job description text paste pipeline utilizing the same structured extraction rules
- [x] Real MP notifications ingested (10+ positions) with 3 reserved unprocessed for live demo testing
- [x] All quality checks pass (`npm run typecheck && npm run lint && npm run test && npm run build`)

## Tasks

### T1 — Ingestion Extraction Module (`modules/ingestion/`)

**Status:** done  
**Owner:** Antigravity (Ponytail)

- [x] Implement PDF text extraction using `unpdf` with PII redaction
- [x] Implement AI extraction wrapper with `generateObject` and `RequirementArraySchema`
- [x] Enforce clause citation requirement (drop rules lacking citations)
- [x] Write unit tests verifying parsing, schema adherence, and citation validation
      **Notes:** Verified with live Gemini AI extraction (`gemini-2.5-flash`), clause citation preservation, and pure Uint8Array PDF.js parsing. All 5 ingestion tests pass.

### T2 — Admin Notifications API (`app/api/v1/admin/notifications/`)

**Status:** done  
**Owner:** Antigravity (Ponytail)

- [x] Implement `POST /api/v1/admin/notifications` (accepts PDF multipart or JD text, extracts rules, saves draft)
- [x] Implement `PUT /api/v1/admin/notifications/[id]` (updates requirements, transitions status `draft` → `live`)
- [x] Implement `GET /api/v1/admin/notifications` (lists drafts and live opportunities for review)
- [x] Add admin role check middleware/guard
      **Notes:** Strict draft isolation verified: draft opportunities are invisible to candidates until admin publication to `live`. All admin endpoints protected.

### T3 — Admin Review & Publish UI (`app/admin/notifications/page.tsx`)

**Status:** done  
**Owner:** Antigravity (Ponytail)

- [x] Build `/admin/notifications` review dashboard displaying draft items
- [x] Show side-by-side or detailed breakdown of extracted clauses, criteria, and confidence
- [x] Implement 1-click Publish button (turns status to `live`)
- [x] Implement Delete/Reject draft action
      **Notes:** Full inspection panel with ClauseCitation, filters for Draft/Live, and instant 1-click publishing.

### T4 — Job Description Paste Extraction Flow

**Status:** done  
**Owner:** Antigravity (Ponytail)

- [x] Support direct text pasting of private company job descriptions
- [x] Extract role archetypes / opportunities using the same pipeline
- [x] Preview extracted requirements before saving
      **Notes:** Seamlessly integrated into Admin portal with PDF / Paste Text toggle.

### T5 — MP Notification Ingestion & Demo Data

**Status:** done  
**Owner:** Antigravity (Ponytail)

- [x] Curate 10–12 real MP recruitment notifications (MPPSC, MP Police, Vyapam, ESB)
- [x] Ingest and verify them into the database
- [x] Hold back 3 unprocessed sample documents/texts for live demo extraction
      **Notes:** Seed corpus expanded to 10 real MP positions with official clauses; 3 unprocessed demo samples preserved in `modules/seed/demo-samples.ts`.

## Human actions required

- [ ] Execute live demo extraction with sample notifications during final stage presentation

## Changelog

- 2026-10-01: Created M5 milestone document and completed T1 (Ingestion Extraction Module).
- 2026-10-01: Completed T2 (Admin Notifications API with draft isolation and role guard).
- 2026-10-01: Completed T3 & T4 (Admin Review UI, PDF dropzone, and Job Description paste extraction pipeline).
- 2026-10-01: Completed T5 (Curated 10 real MP notifications and 3 unprocessed demo samples).
- 2026-10-01: Verified full test suite (86 tests passing), typecheck (0 errors), lint (0 errors), and production build.
