import { z } from "zod";

export type RequirementKind =
  | "age"
  | "qualification"
  | "domicile"
  | "category"
  | "skill"
  | "certification"
  | "experience_years"
  // Needs a per-target attempts(userId, opportunityId, count) table if a real notification ever requires it.
  | "attempts";

export type RequirementOp = "max" | "min" | "equals" | "has" | "one_of";

export type RequirementSource =
  | { type: "notification"; clause: string; page?: number; documentId: string }
  | { type: "job_description"; excerpt: string }
  | { type: "archetype"; note: string }
  | { type: "scheme"; clause: string; documentId: string }
  | { type: "interview_evidence"; sampleSize: number; matchCount: number };

export type RequirementOverride = {
  whenCategory: string;
  value: string | number;
};

export type Requirement = {
  id: string;
  kind: RequirementKind;
  op: RequirementOp;
  value: string | number | string[];

  /** Category-specific overrides, e.g. age cap 28 general, 33 for OBC. */
  overrides?: RequirementOverride[];

  /** true = hard bar. Failing it blocks the application entirely. */
  blocking: boolean;

  /** 1-10. Only meaningful when blocking === false. */
  weight: number;

  label: string; // human-readable, shown in UI
  source: RequirementSource;
};

export type Gap = {
  requirement: Requirement;
  priority: number; // weight × demandSignal
  suggestedAction?: { label: string; deadline?: string };
};

export type EvaluationInput = {
  profile: {
    dateOfBirth: string; // ISO
    category: string;
    domicileState: string;
    qualification: string;
  };
  skills: { name: string; evidence: "verified" | "project" | "declared" }[];
  requirements: Requirement[];
  evaluatedOn: string; // ISO date — passed in, never Date.now()
};

export type EvaluationResult =
  | {
      status: "blocked";
      failures: {
        requirement: Requirement;
        reason: string;
        shortfall?: string;
      }[];
      gaps: Gap[]; // still returned — user may qualify later
      futureEligibleOn?: string; // ISO date, if computable
    }
  | {
      status: "eligible";
      score: number; // 0-100
      met: Requirement[];
      gaps: Gap[];
    };

// ==========================================
// Zod Schemas for Runtime & Boundary Checks
// ==========================================

export const RequirementKindSchema = z.enum([
  "age",
  "qualification",
  "domicile",
  "category",
  "skill",
  "certification",
  "experience_years",
  "attempts",
]);

export const RequirementOpSchema = z.enum([
  "max",
  "min",
  "equals",
  "has",
  "one_of",
]);

export const RequirementSourceSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("notification"),
    clause: z.string().min(1, "Clause citation is required"),
    page: z.number().int().positive().optional(),
    documentId: z.string().min(1),
  }),
  z.object({
    type: z.literal("job_description"),
    excerpt: z.string().min(1),
  }),
  z.object({
    type: z.literal("archetype"),
    note: z.string().min(1),
  }),
  z.object({
    type: z.literal("scheme"),
    clause: z.string().min(1, "Clause citation is required"),
    documentId: z.string().min(1),
  }),
  z.object({
    type: z.literal("interview_evidence"),
    sampleSize: z.number().int().positive(),
    matchCount: z.number().int().nonnegative(),
  }),
]);

export const RequirementOverrideSchema = z.object({
  whenCategory: z.string().min(1),
  value: z.union([z.string(), z.number()]),
});

export const RequirementSchema = z.object({
  id: z.string().min(1),
  kind: RequirementKindSchema,
  op: RequirementOpSchema,
  value: z.union([z.string(), z.number(), z.array(z.string())]),
  overrides: z.array(RequirementOverrideSchema).optional(),
  blocking: z.boolean(),
  weight: z.number().min(1).max(10),
  label: z.string().min(1),
  source: RequirementSourceSchema,
});

export const RequirementArraySchema = z.array(RequirementSchema);

export const GapSchema = z.object({
  requirement: RequirementSchema,
  priority: z.number(),
  suggestedAction: z
    .object({
      label: z.string().min(1),
      deadline: z.string().optional(),
    })
    .optional(),
});

export const EvaluationInputSchema = z.object({
  profile: z.object({
    dateOfBirth: z.string().min(1),
    category: z.string().min(1),
    domicileState: z.string().min(1),
    qualification: z.string().min(1),
  }),
  skills: z.array(
    z.object({
      name: z.string().min(1),
      evidence: z.enum(["verified", "project", "declared"]),
    }),
  ),
  requirements: RequirementArraySchema,
  evaluatedOn: z.string().min(1),
});
