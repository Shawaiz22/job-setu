import { describe, it, expect, vi } from "vitest";
import { extractRequirementsFromText } from "@/modules/ingestion/extract";
import { stripPII } from "@/modules/privacy/redact";

vi.mock("ai", () => {
  const handler = async ({ prompt }: { prompt: string }) => {
    if (
      prompt.includes("Tata Consultancy") ||
      prompt.includes("Cloud Systems")
    ) {
      const payload = {
        title: "Cloud Systems Engineer",
        department: "Tata Consultancy Services",
        state: "Madhya Pradesh",
        closesOn: "2026-12-15",
        requirements: [
          {
            kind: "experience_years",
            op: "min",
            value: 2,
            blocking: true,
            weight: 9,
            label: "2 Years Cloud Experience",
            clause:
              "Must have at least 2 years of hands-on experience in AWS or GCP cloud administration.",
          },
        ],
      };
      return { object: payload, output: payload };
    }

    const payload = {
      title: "MPPSC State Services Examination 2026",
      department:
        "General Administration Department, Government of Madhya Pradesh",
      state: "Madhya Pradesh",
      closesOn: "2026-11-30",
      requirements: [
        {
          kind: "age",
          op: "max",
          value: 33,
          overrides: [
            { whenCategory: "SC", value: 38 },
            { whenCategory: "ST", value: 38 },
            { whenCategory: "OBC", value: 38 },
          ],
          blocking: true,
          weight: 10,
          label: "Maximum age shall not exceed 33 years",
          clause:
            "Clause 3.1: Minimum age of applicant must be 21 years and maximum age shall not exceed 33 years as on 01/01/2026.",
          page: 4,
        },
        {
          kind: "qualification",
          op: "equals",
          value: "graduate",
          blocking: true,
          weight: 10,
          label: "Bachelor Degree Required",
          clause:
            "Clause 4.1: Candidate must hold a Bachelor's Degree in any discipline from a recognized University.",
          page: 5,
        },
        {
          kind: "skill",
          op: "has",
          value: "Uncited Skill",
          blocking: false,
          weight: 5,
          label: "Uncited rule to drop",
          clause: null, // Intentionally un-cited to verify dropping mechanism
        },
      ],
    };

    return { object: payload, output: payload };
  };

  return {
    generateText: vi.fn(handler),
    generateObject: vi.fn(handler),
    Output: {
      object: (cfg: unknown) => cfg,
    },
  };
});

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

  it("extracts structured, clause-cited requirements and strictly drops un-cited rules", async () => {
    const sampleNotification = `
      MADHYA PRADESH PUBLIC SERVICE COMMISSION (MPPSC)
      Advertisement No. 04/2026 - State Services Examination
      Department: General Administration Department, Government of Madhya Pradesh
      Last Date of Application: 2026-11-30

      Eligibility Conditions:
      Clause 3.1: Minimum age of applicant must be 21 years and maximum age shall not exceed 33 years as on 01/01/2026.
      Clause 4.1: Candidate must hold a Bachelor's Degree in any discipline from a recognized University.
    `;

    const result = await extractRequirementsFromText({
      text: sampleNotification,
      sourceType: "notification",
      documentId: "mppsc-adv-04-2026",
    });

    expect(result.title).toBeTruthy();
    expect(result.department).toBeTruthy();
    expect(result.state).toBe("Madhya Pradesh");
    expect(result.requirements.length).toBe(2);
    // Verifies that the un-cited rule was dropped (SPEC.md 7.4)
    expect(result.droppedCount).toBe(1);

    for (const req of result.requirements) {
      expect(req.source.type).toBe("notification");
      if (req.source.type === "notification") {
        expect(req.source.clause).toBeTruthy();
        expect(req.source.clause.length).toBeGreaterThan(0);
        expect(req.source.documentId).toBe("mppsc-adv-04-2026");
      }
    }

    const ageReq = result.requirements.find((r) => r.kind === "age");
    expect(ageReq).toBeDefined();
    expect(ageReq?.blocking).toBe(true);
  });

  it("extracts requirements from job description text with excerpt citations", async () => {
    const sampleJD = `
      Tata Consultancy Services - Cloud Systems Engineer
      Location: Indore, Madhya Pradesh
      Application Deadline: 2026-12-15

      Role Requirements:
      Must have at least 2 years of hands-on experience in AWS or GCP cloud administration.
    `;

    const result = await extractRequirementsFromText({
      text: sampleJD,
      sourceType: "job_description",
      documentId: "tcs-cloud-2026",
    });

    expect(result.requirements.length).toBe(1);

    for (const req of result.requirements) {
      expect(req.source.type).toBe("job_description");
      if (req.source.type === "job_description") {
        expect(req.source.excerpt).toBeTruthy();
      }
    }
  });
});
