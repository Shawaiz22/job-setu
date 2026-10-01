# M5 — Notification Ingestion

**Status:** in progress  
**Depends on:** M4

## Goal

Provide a robust, legally grounded notification ingestion pipeline that extracts deterministic, clause-cited `Requirement[]` from official MP government recruitment PDFs and job descriptions using `unpdf` text extraction and Gemini structured object generation. Extracted opportunities are strictly stored with status `draft` and reviewed by administrators at `/admin/notifications` before being published as `live`. Ingested data cites official clauses; draft opportunities never affect candidate eligibility evaluations.

## Acceptance criteria

- [ ] PDF text extraction using `unpdf` with PII redaction (`modules/privacy/redact.ts`) before passing to AI
- [ ] Structured extraction using `generateObject` with Zod schema (`RequirementArraySchema`)
- [ ] Clause enforcement: any extracted requirement missing an exact official clause citation is dropped
- [ ] Isolation: newly extracted opportunities are stored as `draft` and never evaluated for students until published `live`
- [ ] Admin API endpoints:
  - `POST /api/v1/admin/notifications` (upload PDF or text → extract requirements → store draft)
  - `PUT /api/v1/admin/notifications/[id]` (review, edit requirements, publish to `live`)
  - Admin-only authorization protection (`isAdmin === true`)
- [ ] Admin Review UI at `/admin/notifications`:
  - List draft and live opportunities
  - Review clause citations, modify requirements, and 1-click publish
- [ ] Job description text paste pipeline utilizing the same structured extraction rules
- [ ] Real MP notifications ingested (10+ positions) with 3 reserved unprocessed for live demo testing
- [ ] All quality checks pass (`npm run typecheck && npm run lint && npm run test && npm run build`)

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

**Status:** todo  
**Owner:**

- [ ] Implement `POST /api/v1/admin/notifications` (accepts PDF multipart or JD text, extracts rules, saves draft)
- [ ] Implement `PUT /api/v1/admin/notifications/[id]` (updates requirements, transitions status `draft` → `live`)
- [ ] Implement `GET /api/v1/admin/notifications` (lists drafts and live opportunities for review)
- [ ] Add admin role check middleware/guard

### T3 — Admin Review & Publish UI (`app/admin/notifications/page.tsx`)

**Status:** todo  
**Owner:**

- [ ] Build `/admin/notifications` review dashboard displaying draft items
- [ ] Show side-by-side or detailed breakdown of extracted clauses, criteria, and confidence
- [ ] Implement 1-click Publish button (turns status to `live`)
- [ ] Implement Delete/Reject draft action

### T4 — Job Description Paste Extraction Flow

**Status:** todo  
**Owner:**

- [ ] Support direct text pasting of private company job descriptions
- [ ] Extract role archetypes / opportunities using the same pipeline
- [ ] Preview extracted requirements before saving

### T5 — MP Notification Ingestion & Demo Data

**Status:** todo  
**Owner:**

- [ ] Curate 10–12 real MP recruitment notifications (MPPSC, MP Police, Vyapam, ESB)
- [ ] Ingest and verify them into the database
- [ ] Hold back 3 unprocessed sample documents/texts for live demo extraction

## Human actions required

- [ ] Review M5 milestone plan and approve task progression

## Changelog

- 2026-10-01: Created M5 milestone document and started T1 (Ingestion Extraction Module).
