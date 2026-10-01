# M2 — Privacy Foundation

**Status:** in progress  
**Depends on:** M1

## Goal

Sensitive data handling is guaranteed and proven correct before any sensitive data exists in production or any AI model is invoked. Application-level encryption protects sensitive user attributes (`dateOfBirth`, `category`, `domicileState`) at rest, PII redaction (`stripPII` / `restorePII`) strips identifying information before text reaches external APIs, log redaction ensures no sensitive data leaks into error traces or server logs, a purpose-bound versioned consent model is in place, and data subject rights (`GET /api/v1/profile/export` and cascading `DELETE /api/v1/profile`) are fully verified with zero orphaned rows.

## Acceptance criteria

- [x] `modules/privacy/redact.ts` exports pure functions `stripPII(text)` and `restorePII(text, map)` with 100% test coverage
- [x] A test proves `stripPII` turns real resume/profile lines into anonymized tokens (e.g., `[NAME]`, `[EMAIL]`, `[PHONE]`, `[DOB]`)
- [ ] Application-level encryption (`lib/crypto/encryption.ts`) with AES-256-GCM encrypts `dateOfBirth`, `category`, and `domicileState` before writing to Postgres and decrypts on retrieval
- [ ] Logger / error reporting wrapper (`lib/logger.ts`) proves that sensitive fields cannot leak into logs or error traces even during exceptions
- [ ] Consent tracking table (`consents`) and UI verify purpose-bound, versioned, revocable consent before processing sensitive data
- [ ] `GET /api/v1/profile/export` returns the user's full data export as JSON
- [ ] Cascading deletion test proves that deleting a user or profile leaves zero orphaned rows across `profiles`, `skills`, `targets`, `consents`, and `experiences`
- [ ] All quality checks pass (`npm run typecheck && npm run lint && npm run test && npm run build`)

## Tasks

### T1 — PII Redaction Layer (`modules/privacy/redact.ts`)

**Status:** done  
**Owner:** Antigravity (Ponytail)

- [x] Create `modules/privacy/redact.ts` as a pure module (no DB, no network, no side effects)
- [x] Implement `stripPII(text: string): { redactedText: string; tokenMap: Map<string, string> }`
- [x] Implement `restorePII(redactedText: string, tokenMap: Map<string, string>): string`
- [x] Detect and redact names, phone numbers, email addresses, dates of birth, and identity numbers (Aadhaar/PAN patterns)
- [x] Write unit tests in `tests/privacy/redact.test.ts` verifying bidirectional redaction and restoration

### T2 — Application-Level Encryption for Sensitive Profile Fields

**Status:** todo  
**Owner:**

- [ ] Implement AES-256-GCM authenticated encryption/decryption in `lib/crypto/encryption.ts` using native `node:crypto`
- [ ] Derive key from environment secret (`ENCRYPTION_KEY` or `AUTH_SECRET`)
- [ ] Wire encryption into `db/schema.ts` / profile repository layer so `dateOfBirth`, `category`, and `domicileState` are encrypted at rest
- [ ] Write tests in `tests/privacy/encryption.test.ts` verifying ciphertext stored in database cannot be read in plaintext

### T3 — Log & Error Trace Sanitizer

**Status:** todo  
**Owner:**

- [ ] Implement `lib/logger.ts` with automatic PII and sensitive key redaction
- [ ] Ensure sensitive fields (`dateOfBirth`, `category`, `domicileState`, passwords, tokens) are recursively scrubbed from all log payloads
- [ ] Write tests in `tests/privacy/logger.test.ts` verifying error traces containing sensitive objects are redacted

### T4 — Purpose-Bound Consent Model & UI

**Status:** todo  
**Owner:**

- [ ] Implement consent service in `lib/consent.ts` managing versioned, purpose-bound consents (`consents` table)
- [ ] Implement `POST /api/v1/consent` and `DELETE /api/v1/consent/[purpose]` endpoints
- [ ] Build Consent modal/banner in UI requiring explicit consent before profile analysis
- [ ] Write tests in `tests/privacy/consent.test.ts`

### T5 — Data Subject Export & Verified Cascade Deletion

**Status:** todo  
**Owner:**

- [ ] Create `GET /api/v1/profile/export` returning decrypted, complete user data payload as JSON
- [ ] Verify `DELETE /api/v1/profile` cascades and completely wipes `profiles`, `skills`, `targets`, `consents`, and `experiences`
- [ ] Write integration test in `tests/privacy/cascade-delete.test.ts` proving zero orphaned rows remain in any database table after deletion

## Human actions required

- [ ] Provide or confirm `ENCRYPTION_KEY` for application-level encryption (32-byte hex or base64 string) in `.env.local`

## Changelog

- 2026-10-01: Completed T1 (PII Redaction Layer with `stripPII` and `restorePII`, pure module, 100% test coverage in `tests/privacy/redact.test.ts`).
- 2026-10-01: Created initial milestone document for M2 (Privacy Foundation) per `SPEC.md` section 9 and `MILESTONES.md`.
