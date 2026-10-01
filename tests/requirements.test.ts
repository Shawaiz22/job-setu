import { describe, it, expect } from "vitest";
import {
  RequirementSchema,
  RequirementArraySchema,
  type Requirement,
} from "@/modules/eligibility/types";

describe("Requirement Type and Schema Validation", () => {
  it("validates a blocking age requirement with category overrides and citation", () => {
    const ageReq: Requirement = {
      id: "req-age-mp-patwari",
      kind: "age",
      op: "max",
      value: 28,
      overrides: [
        { whenCategory: "OBC", value: 33 },
        { whenCategory: "SC", value: 33 },
        { whenCategory: "ST", value: 33 },
      ],
      blocking: true,
      weight: 10,
      label:
        "Age must not exceed 28 years (relaxation applies for reserved categories)",
      source: {
        type: "notification",
        clause: "Rule 4.2(a) — Age Relaxation Rules",
        page: 6,
        documentId: "mp-patwari-2024",
      },
    };

    const parsed = RequirementSchema.safeParse(ageReq);
    expect(parsed.success).toBe(true);
  });

  it("validates non-blocking skill requirements with weight and job description source", () => {
    const skillReq: Requirement = {
      id: "req-skill-excel",
      kind: "skill",
      op: "has",
      value: "Advanced Excel",
      blocking: false,
      weight: 7,
      label: "Proficiency in Advanced Excel and MIS Reporting",
      source: {
        type: "job_description",
        excerpt: "Candidate should have strong proficiency in Advanced Excel",
      },
    };

    const parsed = RequirementSchema.safeParse(skillReq);
    expect(parsed.success).toBe(true);
  });

  it("validates requirements array containing scheme and interview evidence sources", () => {
    const reqs: Requirement[] = [
      {
        id: "req-scheme-domicile",
        kind: "domicile",
        op: "equals",
        value: "Madhya Pradesh",
        blocking: true,
        weight: 10,
        label: "Must be a bona fide resident of Madhya Pradesh",
        source: {
          type: "scheme",
          clause:
            "Section 3.1 — Eligibility Criteria for MP Mukhyamantri Yuva Sambal",
          documentId: "scheme-yuva-sambal",
        },
      },
      {
        id: "req-interview-python",
        kind: "skill",
        op: "has",
        value: "Python",
        blocking: false,
        weight: 8,
        label: "Python programming and scripting",
        source: {
          type: "interview_evidence",
          sampleSize: 45,
          matchCount: 38,
        },
      },
    ];

    const parsed = RequirementArraySchema.safeParse(reqs);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toHaveLength(2);
    }
  });

  it("rejects invalid requirements missing mandatory clause citations", () => {
    const invalidReq = {
      id: "req-invalid",
      kind: "age",
      op: "max",
      value: 30,
      blocking: true,
      weight: 10,
      label: "Missing citation",
      source: {
        type: "notification",
        clause: "", // Empty citation must fail validation
        documentId: "doc-1",
      },
    };

    const parsed = RequirementSchema.safeParse(invalidReq);
    expect(parsed.success).toBe(false);
  });
});
