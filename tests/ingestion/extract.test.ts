import { describe, it, expect } from "vitest";
import { extractRequirementsFromText } from "@/modules/ingestion/extract";
import { stripPII } from "@/modules/privacy/redact";

describe("Ingestion Extraction Engine (M5 T1)", () => {
  it("redacts sensitive PII before ingestion without destroying document structure", () => {
    const textWithPII = `
      Official Contact: recruitment-officer@mppsc.nic.in
      Phone: 9876543210
      Nodal Officer Aadhaar: 2345 6789 0123
      Notification Clause 4.1: Candidates must be between 21 and 33 years of age.
    `;

    const { redacted } = stripPII(textWithPII);
    expect(redacted).not.toContain("recruitment-officer@mppsc.nic.in");
    expect(redacted).not.toContain("9876543210");
    expect(redacted).not.toContain("2345 6789 0123");
    expect(redacted).toContain("Notification Clause 4.1");
  });

  it("throws an error when extracting from empty text", async () => {
    await expect(
      extractRequirementsFromText({
        text: "   ",
        sourceType: "notification",
        documentId: "doc-empty",
      }),
    ).rejects.toThrow("Cannot extract requirements from empty text");
  });

  it("extracts structured, clause-cited requirements from official MP notification text via Gemini", async () => {
    const sampleNotification = `
      MADHYA PRADESH PUBLIC SERVICE COMMISSION (MPPSC)
      Advertisement No. 04/2026 - State Services Examination
      Department: General Administration Department, Government of Madhya Pradesh
      Last Date of Application: 2026-11-30

      Eligibility Conditions:
      Clause 3.1: Minimum age of applicant must be 21 years and maximum age shall not exceed 33 years as on 01/01/2026.
      Clause 3.2: Candidates belonging to SC, ST, and OBC categories of Madhya Pradesh domicile shall receive 5 years age relaxation (maximum age 38 years).
      Clause 4.1: Candidate must hold a Bachelor's Degree in any discipline from a recognized University.
      Clause 5.1: The applicant must possess valid registration in the Madhya Pradesh Employment Portal (Rojgar Panjiyan).
    `;

    const result = await extractRequirementsFromText({
      text: sampleNotification,
      sourceType: "notification",
      documentId: "mppsc-adv-04-2026",
    });

    expect(result.title).toBeTruthy();
    expect(result.department).toBeTruthy();
    expect(result.state).toBe("Madhya Pradesh");
    expect(result.requirements.length).toBeGreaterThanOrEqual(2);

    // Strict Clause Enforcement (SPEC.md 7.4):
    for (const req of result.requirements) {
      expect(req.source.type).toBe("notification");
      if (req.source.type === "notification") {
        expect(req.source.clause).toBeTruthy();
        expect(req.source.clause.length).toBeGreaterThan(0);
        expect(req.source.documentId).toBe("mppsc-adv-04-2026");
      }
    }

    // Verify age requirement exists and has overrides
    const ageReq = result.requirements.find((r) => r.kind === "age");
    expect(ageReq).toBeDefined();
    expect(ageReq?.blocking).toBe(true);
  }, 25000); // 25s timeout for AI network call

  it("extracts requirements from job description text with excerpt citations", async () => {
    const sampleJD = `
      Tata Consultancy Services - Cloud Systems Engineer
      Location: Indore, Madhya Pradesh
      Application Deadline: 2026-12-15

      Role Requirements:
      Must have at least 2 years of hands-on experience in AWS or GCP cloud administration.
      Required Bachelor's Degree in Computer Science, IT, or Electrical Engineering.
      Proficiency in Docker and Kubernetes container orchestration is strongly preferred.
    `;

    const result = await extractRequirementsFromText({
      text: sampleJD,
      sourceType: "job_description",
      documentId: "tcs-cloud-2026",
    });

    expect(result.requirements.length).toBeGreaterThanOrEqual(1);

    for (const req of result.requirements) {
      expect(req.source.type).toBe("job_description");
      if (req.source.type === "job_description") {
        expect(req.source.excerpt).toBeTruthy();
      }
    }
  }, 25000);
});
