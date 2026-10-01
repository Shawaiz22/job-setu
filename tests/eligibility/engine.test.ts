import { describe, it, expect } from "vitest";
import { evaluateEligibility } from "@/modules/eligibility/evaluate";
import type { EvaluationInput, Requirement } from "@/modules/eligibility/types";

describe("Eligibility Engine Specification Tests (SPEC.md 6.3)", () => {
  const baseProfile = {
    dateOfBirth: "1998-08-15",
    category: "General",
    domicileState: "Madhya Pradesh",
    qualification: "B.Tech",
  };

  const defaultSkills: {
    name: string;
    evidence: "verified" | "project" | "declared";
  }[] = [];

  it("1. blocking age cap fails, with correct shortfall text", () => {
    // On 2027-07-15, someone born 1998-08-15 is 28 years and 11 months old.
    // An age cap of 28 fails with shortfall 'exceeded by 11 months'.
    const ageCapReq: Requirement = {
      id: "age-cap-28",
      kind: "age",
      op: "max",
      value: 28,
      blocking: true,
      weight: 10,
      label: "Age Limit: Maximum 28 Years",
      source: {
        type: "notification",
        clause: "Clause 3.1",
        documentId: "mppsc-doc-1",
      },
    };

    const input: EvaluationInput = {
      profile: baseProfile,
      skills: defaultSkills,
      requirements: [ageCapReq],
      evaluatedOn: "2027-07-15",
    };

    const result = evaluateEligibility(input);

    expect(result.status).toBe("blocked");
    if (result.status === "blocked") {
      expect(result.failures).toHaveLength(1);
      const failure = result.failures[0];
      expect(failure?.shortfall).toBe("exceeded by 11 months");
      expect(failure?.requirement.id).toBe("age-cap-28");
      // Age caps can never become satisfiable
      expect(result.futureEligibleOn).toBeUndefined();
    }
  });

  it("2. category override changes the outcome (same profile, different category)", () => {
    // Age cap 28 for General, with override of 33 for OBC.
    const ageWithOverrideReq: Requirement = {
      id: "age-cap-with-obc-override",
      kind: "age",
      op: "max",
      value: 28,
      overrides: [{ whenCategory: "OBC", value: 33 }],
      blocking: true,
      weight: 10,
      label: "Age Cap: 28 (General), 33 (OBC)",
      source: {
        type: "notification",
        clause: "Clause 3.2",
        documentId: "mppsc-doc-1",
      },
    };

    // Candidate is 30 years old on 2028-09-01
    const generalInput: EvaluationInput = {
      profile: { ...baseProfile, category: "General" },
      skills: defaultSkills,
      requirements: [ageWithOverrideReq],
      evaluatedOn: "2028-09-01",
    };

    const obcInput: EvaluationInput = {
      profile: { ...baseProfile, category: "OBC" },
      skills: defaultSkills,
      requirements: [ageWithOverrideReq],
      evaluatedOn: "2028-09-01",
    };

    const generalResult = evaluateEligibility(generalInput);
    const obcResult = evaluateEligibility(obcInput);

    // General candidate is blocked
    expect(generalResult.status).toBe("blocked");

    // Same candidate with OBC category is eligible
    expect(obcResult.status).toBe("eligible");
  });

  it("3. minimum-age rule produces a correct futureEligibleOn", () => {
    // Born 2007-06-20. Evaluated on 2027-01-01 (candidate is 19).
    // Min age rule requires 21 years old.
    // Turns 21 on 2028-06-20.
    const minAgeReq: Requirement = {
      id: "min-age-21",
      kind: "age",
      op: "min",
      value: 21,
      blocking: true,
      weight: 10,
      label: "Minimum Age: 21 Years",
      source: {
        type: "notification",
        clause: "Clause 2.1",
        documentId: "mppsc-doc-2",
      },
    };

    const youngInput: EvaluationInput = {
      profile: { ...baseProfile, dateOfBirth: "2007-06-20" },
      skills: defaultSkills,
      requirements: [minAgeReq],
      evaluatedOn: "2027-01-01",
    };

    const result = evaluateEligibility(youngInput);

    expect(result.status).toBe("blocked");
    if (result.status === "blocked") {
      expect(result.futureEligibleOn).toBe("2028-06-20");
      expect(result.failures[0]?.shortfall).toContain("under by");
    }
  });

  it("4. score is deterministic: same inputs -> same output, called twice", () => {
    const mixedRequirements: Requirement[] = [
      {
        id: "skill-python",
        kind: "skill",
        op: "has",
        value: "Python",
        blocking: false,
        weight: 8,
        label: "Python Programming",
        source: { type: "job_description", excerpt: "Experience with Python" },
      },
      {
        id: "skill-sql",
        kind: "skill",
        op: "has",
        value: "SQL",
        blocking: false,
        weight: 6,
        label: "SQL Databases",
        source: { type: "job_description", excerpt: "Database query writing" },
      },
    ];

    const input: EvaluationInput = {
      profile: baseProfile,
      skills: [{ name: "Python", evidence: "verified" }],
      requirements: mixedRequirements,
      evaluatedOn: "2026-10-01",
    };

    const run1 = evaluateEligibility(input);
    const run2 = evaluateEligibility(input);

    expect(run1).toEqual(run2);
  });

  it("5. evidence multiplier changes the score as specified", () => {
    // 1 requirement: weight 10
    // verified (1.0) -> score 100
    // project (0.8) -> score 80
    // declared (0.5) -> score 50
    const skillReq: Requirement = {
      id: "skill-react",
      kind: "skill",
      op: "has",
      value: "React",
      blocking: false,
      weight: 10,
      label: "React Framework",
      source: { type: "job_description", excerpt: "React frontend" },
    };

    const runWithEvidence = (evidence: "verified" | "project" | "declared") => {
      return evaluateEligibility({
        profile: baseProfile,
        skills: [{ name: "React", evidence }],
        requirements: [skillReq],
        evaluatedOn: "2026-10-01",
      });
    };

    const verifiedRes = runWithEvidence("verified");
    const projectRes = runWithEvidence("project");
    const declaredRes = runWithEvidence("declared");

    expect(verifiedRes.status).toBe("eligible");
    expect(projectRes.status).toBe("eligible");
    expect(declaredRes.status).toBe("eligible");

    if (
      verifiedRes.status === "eligible" &&
      projectRes.status === "eligible" &&
      declaredRes.status === "eligible"
    ) {
      expect(verifiedRes.score).toBe(100);
      expect(projectRes.score).toBe(80);
      expect(declaredRes.score).toBe(50);
    }
  });

  it("6. no non-blocking requirements -> score 100", () => {
    // Only blocking rules, all met
    const blockingDomicile: Requirement = {
      id: "domicile-mp",
      kind: "domicile",
      op: "equals",
      value: "Madhya Pradesh",
      blocking: true,
      weight: 10,
      label: "Madhya Pradesh Domicile",
      source: {
        type: "notification",
        clause: "Clause 1.1",
        documentId: "mp-domicile-rule",
      },
    };

    const input: EvaluationInput = {
      profile: baseProfile,
      skills: defaultSkills,
      requirements: [blockingDomicile],
      evaluatedOn: "2026-10-01",
    };

    const result = evaluateEligibility(input);
    expect(result.status).toBe("eligible");
    if (result.status === "eligible") {
      expect(result.score).toBe(100);
    }
  });

  it("7. gap ordering respects weight x demandSignal", () => {
    // Requirement A: weight 5, interview_evidence matchCount 8, sampleSize 10 -> priority 5 * 0.8 = 4.0
    // Requirement B: weight 3, source job_description (demandSignal 1.0) -> priority 3 * 1.0 = 3.0
    // Requirement C: weight 10, interview_evidence matchCount 5, sampleSize 10 -> priority 10 * 0.5 = 5.0
    // Order should be: C (5.0), A (4.0), B (3.0)
    const reqA: Requirement = {
      id: "req-a",
      kind: "skill",
      op: "has",
      value: "Docker",
      blocking: false,
      weight: 5,
      label: "Docker",
      source: {
        type: "interview_evidence",
        sampleSize: 10,
        matchCount: 8,
      },
    };

    const reqB: Requirement = {
      id: "req-b",
      kind: "skill",
      op: "has",
      value: "Kubernetes",
      blocking: false,
      weight: 3,
      label: "Kubernetes",
      source: {
        type: "job_description",
        excerpt: "K8s cluster management",
      },
    };

    const reqC: Requirement = {
      id: "req-c",
      kind: "skill",
      op: "has",
      value: "Go",
      blocking: false,
      weight: 10,
      label: "Go Programming",
      source: {
        type: "interview_evidence",
        sampleSize: 10,
        matchCount: 5,
      },
    };

    const input: EvaluationInput = {
      profile: baseProfile,
      skills: [], // none met -> all are gaps
      requirements: [reqA, reqB, reqC],
      evaluatedOn: "2026-10-01",
    };

    const result = evaluateEligibility(input);
    expect(result.status).toBe("eligible");
    if (result.status === "eligible") {
      expect(result.gaps).toHaveLength(3);
      expect(result.gaps[0]?.requirement.id).toBe("req-c");
      expect(result.gaps[0]?.priority).toBe(5.0);

      expect(result.gaps[1]?.requirement.id).toBe("req-a");
      expect(result.gaps[1]?.priority).toBe(4.0);

      expect(result.gaps[2]?.requirement.id).toBe("req-b");
      expect(result.gaps[2]?.priority).toBe(3.0);
    }
  });

  it("8. matches qualifications with branch specializations and degree abbreviations", () => {
    const qualReq: Requirement = {
      id: "req-qual-tech",
      kind: "qualification",
      op: "one_of",
      value: ["b.tech", "b.e", "bca", "mca", "b.sc computer science"],
      blocking: true,
      weight: 10,
      label: "Technical Degree",
      source: {
        type: "job_description",
        excerpt: "Standard entry bar",
      },
    };

    const input: EvaluationInput = {
      profile: {
        ...baseProfile,
        qualification: "B.Tech - CSE",
      },
      skills: [],
      requirements: [qualReq],
      evaluatedOn: "2026-10-01",
    };

    const result = evaluateEligibility(input);
    expect(result.status).toBe("eligible");
    if (result.status === "eligible") {
      expect(result.score).toBe(100);
    }
  });

  it("9. matches qualifications across degree equivalencies, delimiters, and branches", () => {
    // Test B.Tech matching "B.E. / B.Tech"
    const slashReq: Requirement = {
      id: "req-slash",
      kind: "qualification",
      op: "equals",
      value: "B.E. / B.Tech",
      blocking: true,
      weight: 10,
      label: "Degree in Engineering",
      source: { type: "notification", clause: "2.1", documentId: "mp-1" },
    };

    const res1 = evaluateEligibility({
      profile: {
        ...baseProfile,
        qualification: "Bachelor of Technology (CSE)",
      },
      skills: [],
      requirements: [slashReq],
      evaluatedOn: "2026-10-01",
    });
    expect(res1.status).toBe("eligible");

    // Test B.Tech matching "B.E." via equivalence group
    const beReq: Requirement = {
      id: "req-be",
      kind: "qualification",
      op: "equals",
      value: "B.E.",
      blocking: true,
      weight: 10,
      label: "B.E. Degree",
      source: { type: "notification", clause: "2.2", documentId: "mp-2" },
    };

    const res2 = evaluateEligibility({
      profile: { ...baseProfile, qualification: "B.Tech" },
      skills: [],
      requirements: [beReq],
      evaluatedOn: "2026-10-01",
    });
    expect(res2.status).toBe("eligible");

    // Test 12th Pass matching "Higher Secondary (10+2)"
    const hsReq: Requirement = {
      id: "req-hs",
      kind: "qualification",
      op: "equals",
      value: "Higher Secondary (10+2)",
      blocking: true,
      weight: 10,
      label: "12th Standard",
      source: { type: "notification", clause: "3.1", documentId: "mp-3" },
    };

    const res3 = evaluateEligibility({
      profile: { ...baseProfile, qualification: "12th Pass" },
      skills: [],
      requirements: [hsReq],
      evaluatedOn: "2026-10-01",
    });
    expect(res3.status).toBe("eligible");
  });

  it("10. calculates evidence multiplier properly when candidate has matching skills", () => {
    const skillReq: Requirement = {
      id: "req-skill-python",
      kind: "skill",
      op: "has",
      value: "Python",
      blocking: false,
      weight: 10,
      label: "Python Programming",
      source: { type: "job_description", excerpt: "Python required" },
    };

    // Candidate with verified skill
    const resVerified = evaluateEligibility({
      profile: baseProfile,
      skills: [{ name: "Python", evidence: "verified" }],
      requirements: [skillReq],
      evaluatedOn: "2026-10-01",
    });
    expect(resVerified.status).toBe("eligible");
    if (resVerified.status === "eligible") {
      expect(resVerified.score).toBe(100);
    }

    // Candidate with declared skill (0.5 multiplier)
    const resDeclared = evaluateEligibility({
      profile: baseProfile,
      skills: [{ name: "Python", evidence: "declared" }],
      requirements: [skillReq],
      evaluatedOn: "2026-10-01",
    });
    expect(resDeclared.status).toBe("eligible");
    if (resDeclared.status === "eligible") {
      expect(resDeclared.score).toBe(50);
    }
  });
});
