import { db } from "@/db";
import { opportunities, archetypes } from "@/db/schema";
import type { Requirement } from "@/modules/eligibility/types";

export const SEED_OPPORTUNITIES: {
  id?: string;
  kind: "govt_post" | "scheme";
  title: string;
  department: string;
  state: string;
  status: "live" | "draft";
  closesOn?: Date;
  requirements: Requirement[];
  sourceDocumentPath?: string;
}[] = [
  {
    kind: "govt_post",
    title: "MPPSC State Services Examination 2026",
    department: "Madhya Pradesh Public Service Commission, Indore",
    state: "Madhya Pradesh",
    status: "live",
    closesOn: new Date("2026-12-31T23:59:59Z"),
    sourceDocumentPath: "notifications/mppsc_sse_2026.pdf",
    requirements: [
      {
        id: "mppsc-age-min",
        kind: "age",
        op: "min",
        value: 21,
        blocking: true,
        weight: 10,
        label: "Minimum Age 21 Years",
        source: {
          type: "notification",
          clause: "Clause 3(a)",
          page: 4,
          documentId: "mppsc-sse-2026",
        },
      },
      {
        id: "mppsc-age-cap",
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
        label: "Maximum Age Cap: 33 (General), 38 (SC/ST/OBC)",
        source: {
          type: "notification",
          clause: "Clause 3(b) & MP State Relaxation Order 2023",
          page: 5,
          documentId: "mppsc-sse-2026",
        },
      },
      {
        id: "mppsc-qualification",
        kind: "qualification",
        op: "one_of",
        value: [
          "graduate",
          "b.tech",
          "b.e",
          "b.sc",
          "b.a",
          "b.com",
          "bca",
          "llb",
          "post_graduate",
        ],
        blocking: true,
        weight: 10,
        label: "Graduation Degree from a Recognized University",
        source: {
          type: "notification",
          clause: "Clause 4.1",
          page: 6,
          documentId: "mppsc-sse-2026",
        },
      },
      {
        id: "mppsc-gk-mp",
        kind: "skill",
        op: "has",
        value: "Madhya Pradesh General Knowledge",
        blocking: false,
        weight: 9,
        label: "Madhya Pradesh History, Geography & Governance",
        source: {
          type: "notification",
          clause: "Syllabus Paper I",
          page: 12,
          documentId: "mppsc-sse-2026",
        },
      },
    ],
  },
  {
    kind: "govt_post",
    title: "MP Police Constable Recruitment 2026",
    department: "Madhya Pradesh Police Headquarters, Bhopal",
    state: "Madhya Pradesh",
    status: "live",
    closesOn: new Date("2026-11-30T23:59:59Z"),
    sourceDocumentPath: "notifications/mp_police_constable_2026.pdf",
    requirements: [
      {
        id: "mp-police-domicile",
        kind: "domicile",
        op: "equals",
        value: "Madhya Pradesh",
        blocking: true,
        weight: 10,
        label: "Bona-fide Resident of Madhya Pradesh",
        source: {
          type: "notification",
          clause: "Clause 1.2",
          page: 2,
          documentId: "mp-police-constable-2026",
        },
      },
      {
        id: "mp-police-age-min",
        kind: "age",
        op: "min",
        value: 18,
        blocking: true,
        weight: 10,
        label: "Minimum Age 18 Years",
        source: {
          type: "notification",
          clause: "Clause 2.1",
          page: 3,
          documentId: "mp-police-constable-2026",
        },
      },
      {
        id: "mp-police-age-cap",
        kind: "age",
        op: "max",
        value: 28,
        overrides: [
          { whenCategory: "SC", value: 33 },
          { whenCategory: "ST", value: 33 },
          { whenCategory: "OBC", value: 33 },
        ],
        blocking: true,
        weight: 10,
        label: "Maximum Age Cap: 28 (General), 33 (Reserved Categories)",
        source: {
          type: "notification",
          clause: "Clause 2.2",
          page: 3,
          documentId: "mp-police-constable-2026",
        },
      },
      {
        id: "mp-police-fitness",
        kind: "skill",
        op: "has",
        value: "Physical Fitness",
        blocking: false,
        weight: 8,
        label: "Physical Endurance and Fitness Standards",
        source: {
          type: "notification",
          clause: "Clause 5.4",
          page: 8,
          documentId: "mp-police-constable-2026",
        },
      },
    ],
  },
];

export const SEED_ARCHETYPES: {
  title: string;
  requirements: Requirement[];
}[] = [
  {
    title: "Junior Software Engineer",
    requirements: [
      {
        id: "arch-swe-degree",
        kind: "qualification",
        op: "one_of",
        value: ["b.tech", "b.e", "bca", "mca", "b.sc computer science"],
        blocking: true,
        weight: 10,
        label: "Computer Science or Related Technical Degree",
        source: { type: "archetype", note: "Standard entry bar" },
      },
      {
        id: "arch-swe-python",
        kind: "skill",
        op: "has",
        value: "Python",
        blocking: false,
        weight: 8,
        label: "Python Programming",
        source: {
          type: "interview_evidence",
          sampleSize: 20,
          matchCount: 16,
        },
      },
      {
        id: "arch-swe-sql",
        kind: "skill",
        op: "has",
        value: "SQL",
        blocking: false,
        weight: 7,
        label: "Relational Database & SQL",
        source: {
          type: "interview_evidence",
          sampleSize: 15,
          matchCount: 12,
        },
      },
    ],
  },
  {
    title: "Administrative Assistant",
    requirements: [
      {
        id: "arch-admin-age-min",
        kind: "age",
        op: "min",
        value: 18,
        blocking: true,
        weight: 10,
        label: "Minimum Age 18 Years",
        source: { type: "archetype", note: "Labor law legal age" },
      },
      {
        id: "arch-admin-office",
        kind: "skill",
        op: "has",
        value: "Office Tools",
        blocking: false,
        weight: 9,
        label: "MS Office / Google Docs & Spreadsheets",
        source: { type: "archetype", note: "Essential office operations" },
      },
      {
        id: "arch-admin-typing",
        kind: "skill",
        op: "has",
        value: "Typing Speed",
        blocking: false,
        weight: 8,
        label: "Typing Speed (Hindi / English 30 WPM)",
        source: { type: "archetype", note: "Standard administrative speed" },
      },
    ],
  },
];

/**
 * Idempotently seeds initial opportunities and archetypes into the database using batched operations.
 */
export async function seedEligibilityData() {
  const [existingOpps, existingArchs] = await Promise.all([
    db.select().from(opportunities),
    db.select().from(archetypes),
  ]);

  const oppTitles = new Set(existingOpps.map((o) => o.title));
  const archTitles = new Set(existingArchs.map((a) => a.title));

  const oppsToInsert = SEED_OPPORTUNITIES.filter(
    (o) => !oppTitles.has(o.title),
  );
  const archsToInsert = SEED_ARCHETYPES.filter((a) => !archTitles.has(a.title));

  const [newOpps, newArchs] = await Promise.all([
    oppsToInsert.length > 0
      ? db
          .insert(opportunities)
          .values(
            oppsToInsert.map((opp) => ({
              kind: opp.kind,
              title: opp.title,
              department: opp.department,
              state: opp.state,
              status: opp.status,
              closesOn: opp.closesOn,
              requirements: opp.requirements,
              sourceDocumentPath: opp.sourceDocumentPath,
            })),
          )
          .returning()
      : Promise.resolve([]),
    archsToInsert.length > 0
      ? db.insert(archetypes).values(archsToInsert).returning()
      : Promise.resolve([]),
  ]);

  return {
    opportunities: [...existingOpps, ...newOpps],
    archetypes: [...existingArchs, ...newArchs],
  };
}
