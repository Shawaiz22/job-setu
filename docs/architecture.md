# Kariyar Setu — System Architecture & Data Flow

> **"Every other platform recommends opportunities. We decide eligibility, and we cite the rule that decided it."**

---

## 1. High-Level System Architecture

The following diagram illustrates the complete end-to-end architecture of Kariyar Setu, spanning the Next.js frontend, authentication & session management, pure eligibility verification engine, AI ingestion pipeline, and secure encrypted persistence with Neon PostgreSQL.

```mermaid
flowchart TB
    subgraph Clients["Clients & Presentation Layer"]
        Candidate["Student / Candidate<br/>(Desktop / Mobile)"]
        Admin["Administrator<br/>(MP Portal Ops)"]
    end

    subgraph App["Next.js App Router (Turbopack)"]
        subgraph ServerPages["Server Components (RSC)"]
            ProfilePage["/profile<br/>(Server Fetch Profile & Skills)"]
            TargetsPage["/targets & /targets/[id]<br/>(Readiness, Gaps & Prep Intel)"]
            AdminPage["/admin/notifications<br/>(Extraction & Rule Review)"]
        end

        subgraph ClientComponents["Client Interactive Components"]
            ProfileForm["ProfileForm<br/>(Curated Qualification & Skills)"]
            TargetBrowser["TargetBrowser<br/>(Filters & Search)"]
            ConsentUI["ConsentManager<br/>(Purpose-Bound Consent)"]
        end

        subgraph APIRoutes["REST API Endpoints (/api/v1)"]
        AuthAPI["/auth/register<br/>/auth/[...nextauth]"]
            ProfileAPI["/profile & /profile/skills"]
            TargetsAPI["/targets & /targets/[id]"]
            EvalAPI["/targets/[id]/evaluation"]
            ConsentAPI["/consent & /consent/[purpose]"]
            AdminAPI["/admin/notifications"]
        end
    end

    subgraph CoreEngine["Pure Verification Engine (modules/eligibility)"]
        EvalEngine["evaluateEligibility()<br/>• 100% Pure Function<br/>• Zero DB / Zero Fetch<br/>• Deterministic Verdict + Citation<br/>• Weight × Demand Signal Gap Ranking"]
        QualMatcher["matchesQualification()<br/>• Equivalence Groups (B.Tech / B.E.)<br/>• Branch Delimiters & Suffixes<br/>• Hierarchy & Degree Recognition"]
    end

    subgraph PrivacyModule["Privacy & Security Layer (modules/privacy)"]
        AES["AES-256-GCM<br/>(Application Encryption at Rest)"]
        Redactor["PII Redaction Engine<br/>(DOB, Caste, Phone, Email, Aadhaar)"]
        ScopeGuard["withUserOnly()<br/>(Tenant Isolation & Query Scoping)"]
    end

    subgraph Ingestion["Ingestion & Rule Parsing Pipeline"]
        PDFParser["PDF Parser & Text Extractor"]
        Gemini["Google Gemini AI<br/>(gemini-3.5-flash-lite / 3.8-flash)<br/>Structured Object Extraction"]
    end

    subgraph Database["Database & Persistence (Neon Serverless PostgreSQL)"]
        Drizzle["Drizzle ORM Engine"]
        UsersTable[("users")]
        ProfilesTable[("profiles<br/>(Encrypted DOB, Category, Domicile)")]
        SkillsTable[("skills<br/>(Evidence: Declared / Project / Verified)")]
        OpportunitiesTable[("opportunities<br/>(Published MP Govt Circulars)")]
        TargetsTable[("targets<br/>(User-Tracked Opportunities)")]
        ConsentsTable[("consents<br/>(Purpose-Bound & Versioned)")]
    end

    Candidate --> ProfilePage
    Candidate --> TargetsPage
    Admin --> AdminPage

    ProfilePage --> ProfileForm
    TargetsPage --> TargetBrowser
    ProfilePage --> ConsentUI

    ProfileForm --> ProfileAPI
    TargetBrowser --> TargetsAPI
    TargetBrowser --> EvalAPI
    ConsentUI --> ConsentAPI
    AdminPage --> AdminAPI

    EvalAPI --> EvalEngine
    EvalEngine --> QualMatcher

    AdminAPI --> PDFParser
    PDFParser --> Redactor
    Redactor --> Gemini
    Gemini --> AdminAPI

    ProfileAPI --> AES
    ProfileAPI --> ScopeGuard
    TargetsAPI --> ScopeGuard
    EvalAPI --> ScopeGuard
    ConsentAPI --> ScopeGuard

    AES --> Drizzle
    ScopeGuard --> Drizzle
    Drizzle --> UsersTable
    Drizzle --> ProfilesTable
    Drizzle --> SkillsTable
    Drizzle --> OpportunitiesTable
    Drizzle --> TargetsTable
    Drizzle --> ConsentsTable
```

---

## 2. Pure Eligibility Verification Flow

Unlike platforms that use probabilistic recommendations, Kariyar Setu executes a **deterministic, zero-I/O pure function** to evaluate candidate eligibility.

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student Candidate
    participant UI as Target Detail View
    participant API as GET /api/v1/targets/[id]/evaluation
    participant Consent as Consent Verification
    participant DB as Neon PostgreSQL (Drizzle)
    participant Engine as Pure Engine (evaluateEligibility)

    Student->>UI: Opens Opportunity Target
    UI->>API: Fetch Evaluation
    API->>Consent: Check Active Consent ('eligibility_processing')
    alt Consent Revoked / Missing
        Consent-->>API: Active Consent Missing
        API-->>UI: 403 Forbidden (Consent Required)
        UI-->>Student: Displays Consent Modal
    else Consent Active
        Consent-->>API: Active Valid Consent
        API->>DB: Query User Profile (Decrypted)
        API->>DB: Query User Declared Skills
        API->>DB: Query Opportunity Requirements & Citations
        DB-->>API: Profile, Skills, Requirements
        API->>Engine: evaluateEligibility({ profile, skills, requirements, evaluatedOn })
        Note over Engine: Pure execution: Zero DB, Zero Network, Invariable Output
        Engine->>Engine: 1. Evaluate Age Caps with Category Relaxations
        Engine->>Engine: 2. Evaluate Educational Qualification & Branch Equivalencies
        Engine->>Engine: 3. Evaluate State Domicile Quota Bars
        Engine->>Engine: 4. Compute Future Eligibility Date if Under-age
        Engine->>Engine: 5. Weight & Rank Gaps by Priority (weight × demandSignal)
        Engine-->>API: EvaluationResult (Eligible Score OR Blocked Verdict + Citation)
        API-->>UI: JSON Result
        UI-->>Student: Displays Verdict Banner with Official Gazette Citation & Gaps
    end
```

---

## 3. Privacy & Sensitive Data Architecture

Madhya Pradesh candidates input sensitive personal attributes (`dateOfBirth`, `category` / caste reservation, `domicileState`). These are safeguarded via multiple layers:

```mermaid
flowchart LR
    subgraph Input["Candidate Input"]
        RawDOB["dateOfBirth: '2001-04-12'"]
        RawCat["category: 'OBC'"]
        RawDom["domicileState: 'Madhya Pradesh'"]
    end

    subgraph PrivacyLayer["Privacy & Cryptography Shield"]
        AES["AES-256-GCM Encryption<br/>(Initialization Vector + Auth Tag)"]
        Redact["PII Redaction<br/>(Zero PII in AI Prompts or Logs)"]
        Scope["Row-Level User Scoping<br/>(Strict userId enforcement)"]
    end

    subgraph Storage["Storage & AI Engines"]
        EncryptedDB[("Neon Postgres Database<br/>Ciphertext at Rest")]
        AIModel["Gemini AI Extraction<br/>(Only Public Circular Text, No Student Data)"]
    end

    RawDOB --> AES
    RawCat --> AES
    RawDom --> AES

    AES --> EncryptedDB
    Scope --> EncryptedDB

    Input -.->|NEVER REACHES| AIModel
```

---

## 4. Opportunity Ingestion & Rule Parsing Pipeline

```mermaid
flowchart TD
    Gazette["Official MP Gazette / Recruitment PDF / Circular"] --> IngestAPI["POST /api/v1/admin/notifications"]
    IngestAPI --> PDF["Extract Raw Text from PDF / Notice"]
    PDF --> Redact["Sanitize Text & Strip Extraneous PII"]
    Redact --> Gemini["Gemini AI (Structured Output via Type Schema)"]
    Gemini --> Rules["Generated Structured Requirements<br/>• Age (min/max + caste overrides)<br/>• Qualifications (B.Tech / B.E. / BCA / etc.)<br/>• Domicile requirements<br/>• Statutory Clause Citation & Page Number"]
    Rules --> Draft["Status: 'draft'<br/>(Isolated from public candidate search)"]
    Draft --> AdminReview["Admin Inspection & Clause Verification"]
    AdminReview -->|Publish| Live["Status: 'live'<br/>(Immediate matching against all candidates)"]
```
