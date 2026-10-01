import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { stripPII } from "@/modules/privacy/redact";
import type {
  Requirement,
  RequirementKind,
  RequirementOp,
} from "@/modules/eligibility/types";

export interface ExtractionInput {
  text: string;
  sourceType: "notification" | "job_description" | "scheme";
  documentId: string;
  defaultTitle?: string;
  defaultDepartment?: string;
  defaultState?: string;
}

export interface ExtractionResult {
  title: string;
  department: string;
  state: string;
  closesOn: string | null;
  requirements: Requirement[];
  droppedCount: number;
}

/**
 * Raw extracted requirement schema for LLM structured output.
 */
const RawRequirementSchema = z.object({
  kind: z.enum([
    "age",
    "qualification",
    "domicile",
    "category",
    "skill",
    "certification",
    "experience_years",
    "attempts",
  ]),
  op: z.enum(["max", "min", "equals", "has", "one_of"]),
  value: z.union([z.string(), z.number(), z.array(z.string())]),
  overrides: z
    .array(
      z.object({
        whenCategory: z.string(),
        value: z.union([z.string(), z.number()]),
      }),
    )
    .optional(),
  blocking: z
    .boolean()
    .describe(
      "True if failing this requirement immediately disqualifies the applicant",
    ),
  weight: z
    .number()
    .min(1)
    .max(10)
    .describe(
      "Relative importance from 1 (minor) to 10 (crucial). Only used when blocking is false",
    ),
  label: z.string().describe("Clear human-readable summary of the rule"),
  clause: z
    .string()
    .nullable()
    .describe(
      "Exact official clause or sentence quoted from the document. Return null if not cited in document",
    ),
  page: z
    .number()
    .nullable()
    .optional()
    .describe("Page number where the rule appears, if known"),
});

const ExtractionPayloadSchema = z.object({
  title: z
    .string()
    .describe("Official recruitment post title or job role name"),
  department: z
    .string()
    .describe("Issuing department, board, commission, or company name"),
  state: z.string().describe("Jurisdiction or state (default: Madhya Pradesh)"),
  closesOn: z
    .string()
    .nullable()
    .describe(
      "Application deadline in YYYY-MM-DD ISO format, or null if not stated",
    ),
  requirements: z
    .array(RawRequirementSchema)
    .describe("List of extracted eligibility criteria"),
});

/**
 * Extracts structured, deterministic requirements from notification or job description text.
 * Strictly adheres to SPEC.md Section 7:
 * - Redacts sensitive personal identifiers prior to AI ingestion
 * - Never hallucinates or guesses: un-cited rules MUST return null clause
 * - Drops any extracted rule lacking an exact quoted clause citation
 */
export async function extractRequirementsFromText(
  input: ExtractionInput,
): Promise<ExtractionResult> {
  const {
    text,
    sourceType,
    documentId,
    defaultTitle = "Official Recruitment Notification",
    defaultDepartment = "Madhya Pradesh Government",
    defaultState = "Madhya Pradesh",
  } = input;

  if (!text || text.trim().length === 0) {
    throw new Error("Cannot extract requirements from empty text");
  }

  // 1. Redact any incidental personal identifiers before sending to external model (SPEC.md 7.3 & 9.1)
  const { redacted: sanitizedText } = stripPII(text);

  // 2. Instruct the model using strict deterministic rules (SPEC.md 7.4)
  const prompt = `
You are the Job Setu Eligibility Rule Ingestion Engine for Madhya Pradesh Government recruitments and job descriptions.
Extract all eligibility rules and statutory criteria from the following document into structured requirements.

RULES:
1. Every requirement MUST quote the exact clause or section from the text in the "clause" field (e.g. "Clause 3.2: Minimum age shall be 21 years as on 01/01/2026").
2. If a rule does not have an explicit textual basis or exact citation in the document, return null for "clause". DO NOT GUESS OR INVENT RULES.
3. For Government recruitments, domicile rules (e.g. MP domicile for age relaxations or local posts), educational qualifications, and statutory age limits (min/max with caste category overrides) are critical blocking criteria.
4. "blocking" should be TRUE for statutory must-haves (minimum age, maximum age cap, required educational degree, mandatory domicile, category eligibility).
5. "blocking" should be FALSE for desirable skills, bonus certifications, or experience preferences.
6. Provide an accurate application deadline in "closesOn" (YYYY-MM-DD) if explicitly mentioned.

DOCUMENT CONTENT:
${sanitizedText}
`;

  const { object } = await generateObject({
    model: google("gemini-2.5-flash"),
    schema: ExtractionPayloadSchema,
    prompt,
    temperature: 0.1, // Near-zero temperature for deterministic extraction
  });

  // 3. Clause Enforcement: Drop any requirement lacking an exact quoted citation (SPEC.md 7.4)
  const validatedRequirements: Requirement[] = [];
  let droppedCount = 0;

  for (const raw of object.requirements) {
    if (!raw.clause || raw.clause.trim().length === 0) {
      droppedCount++;
      continue;
    }

    const id = `req-${crypto.randomUUID().slice(0, 8)}`;

    let source;
    if (sourceType === "notification") {
      source = {
        type: "notification" as const,
        clause: raw.clause.trim(),
        page: raw.page ? Math.max(1, raw.page) : undefined,
        documentId,
      };
    } else if (sourceType === "job_description") {
      source = {
        type: "job_description" as const,
        excerpt: raw.clause.trim(),
      };
    } else {
      source = {
        type: "scheme" as const,
        clause: raw.clause.trim(),
        documentId,
      };
    }

    validatedRequirements.push({
      id,
      kind: raw.kind as RequirementKind,
      op: raw.op as RequirementOp,
      value: raw.value,
      overrides: raw.overrides,
      blocking: raw.blocking,
      weight: raw.weight,
      label: raw.label,
      source,
    });
  }

  return {
    title: object.title || defaultTitle,
    department: object.department || defaultDepartment,
    state: object.state || defaultState,
    closesOn: object.closesOn || null,
    requirements: validatedRequirements,
    droppedCount,
  };
}
