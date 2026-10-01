import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "../db";
import { opportunities } from "../db/schema";
import { eq } from "drizzle-orm";
import type { Requirement } from "../modules/eligibility/types";

interface SchemeSeed {
  title: string;
  department: string;
  state: string;
  requirements: Requirement[];
}

const MP_SCHEMES: SchemeSeed[] = [
  {
    title: "Mukhyamantri Seekho-Kamao Yojana (MMSKY)",
    department: "Directorate of Employment & Technical Education, MP",
    state: "Madhya Pradesh",
    requirements: [
      {
        id: "mmsky-domicile",
        kind: "domicile",
        op: "equals",
        value: "Madhya Pradesh",
        blocking: true,
        weight: 10,
        label: "Madhya Pradesh Domicile Required",
        source: {
          type: "scheme",
          clause:
            "Rule 4.1: Candidate must be a native resident of Madhya Pradesh.",
          documentId: "mmsky-gazette-2023",
        },
      },
      {
        id: "mmsky-age-min",
        kind: "age",
        op: "min",
        value: 18,
        blocking: true,
        weight: 10,
        label: "Minimum Age 18 Years",
        source: {
          type: "scheme",
          clause:
            "Rule 4.2: Age must be between 18 to 29 years on date of application.",
          documentId: "mmsky-gazette-2023",
        },
      },
      {
        id: "mmsky-age-max",
        kind: "age",
        op: "max",
        value: 29,
        blocking: true,
        weight: 10,
        label: "Maximum Age 29 Years",
        source: {
          type: "scheme",
          clause:
            "Rule 4.2: Age cap of 29 years for monthly on-job skill stipend.",
          documentId: "mmsky-gazette-2023",
        },
      },
      {
        id: "mmsky-qual",
        kind: "qualification",
        op: "one_of",
        value: [
          "12th Pass",
          "Higher Secondary",
          "ITI",
          "Diploma",
          "Graduate",
          "B.Tech",
          "B.E.",
          "B.Sc",
          "B.Com",
          "B.A.",
          "BCA",
          "MCA",
          "Post Graduate",
        ],
        blocking: true,
        weight: 10,
        label: "12th, ITI, Diploma, or Higher Degree",
        source: {
          type: "scheme",
          clause:
            "Rule 4.3: Candidate must have passed 12th / ITI or higher technical qualification.",
          documentId: "mmsky-gazette-2023",
        },
      },
    ],
  },
  {
    title: "Chief Minister Youth Internship Scheme (CMYIP)",
    department:
      "Atal Bihari Vajpayee Institute of Good Governance & Policy Analysis, MP",
    state: "Madhya Pradesh",
    requirements: [
      {
        id: "cmyip-domicile",
        kind: "domicile",
        op: "equals",
        value: "Madhya Pradesh",
        blocking: true,
        weight: 10,
        label: "Madhya Pradesh Domicile Required",
        source: {
          type: "scheme",
          clause:
            "Section 3.1: Candidate must be a resident of MP holding valid Samagra ID.",
          documentId: "cmyip-guidelines-2023",
        },
      },
      {
        id: "cmyip-age-min",
        kind: "age",
        op: "min",
        value: 18,
        blocking: true,
        weight: 10,
        label: "Minimum Age 18 Years",
        source: {
          type: "scheme",
          clause: "Section 3.2: Minimum age limit 18 years.",
          documentId: "cmyip-guidelines-2023",
        },
      },
      {
        id: "cmyip-age-max",
        kind: "age",
        op: "max",
        value: 29,
        blocking: true,
        weight: 10,
        label: "Maximum Age 29 Years",
        source: {
          type: "scheme",
          clause: "Section 3.2: Upper age limit 29 years on the cutoff date.",
          documentId: "cmyip-guidelines-2023",
        },
      },
      {
        id: "cmyip-qual",
        kind: "qualification",
        op: "one_of",
        value: [
          "Graduate",
          "B.Tech",
          "B.E.",
          "B.Sc",
          "B.Com",
          "B.A.",
          "BCA",
          "BBA",
          "MCA",
          "MBA",
          "Post Graduate",
        ],
        blocking: true,
        weight: 10,
        label: "Undergraduate or Postgraduate Degree",
        source: {
          type: "scheme",
          clause:
            "Section 3.3: Must have completed Graduation or Post Graduation from recognized university.",
          documentId: "cmyip-guidelines-2023",
        },
      },
    ],
  },
  {
    title: "Mukhyamantri Medhavi Vidyarthi Yojana (MMVY)",
    department: "Higher Education Department, Government of Madhya Pradesh",
    state: "Madhya Pradesh",
    requirements: [
      {
        id: "mmvy-domicile",
        kind: "domicile",
        op: "equals",
        value: "Madhya Pradesh",
        blocking: true,
        weight: 10,
        label: "Madhya Pradesh Domicile Required",
        source: {
          type: "scheme",
          clause: "Clause 2.1: Native resident of Madhya Pradesh.",
          documentId: "mmvy-gazette-2017",
        },
      },
      {
        id: "mmvy-qual",
        kind: "qualification",
        op: "one_of",
        value: [
          "12th Pass",
          "Higher Secondary",
          "Graduate",
          "B.Tech",
          "B.E.",
          "B.Sc",
          "B.Com",
          "BCA",
        ],
        blocking: true,
        weight: 10,
        label: "12th Pass with Merit",
        source: {
          type: "scheme",
          clause:
            "Clause 2.2: Scored 70% or more in MP Board or 85% in CBSE/ICSE in 12th examination.",
          documentId: "mmvy-gazette-2017",
        },
      },
    ],
  },
  {
    title: "Mukhyamantri Udyam Kranti Yojana (Self-Employment Loan Subsidy)",
    department: "Micro, Small & Medium Enterprises Department (MSME), MP",
    state: "Madhya Pradesh",
    requirements: [
      {
        id: "udyami-domicile",
        kind: "domicile",
        op: "equals",
        value: "Madhya Pradesh",
        blocking: true,
        weight: 10,
        label: "Madhya Pradesh Domicile Required",
        source: {
          type: "scheme",
          clause: "Clause 4.1: Citizen of Madhya Pradesh.",
          documentId: "msme-udyam-kranti-2022",
        },
      },
      {
        id: "udyami-age-min",
        kind: "age",
        op: "min",
        value: 18,
        blocking: true,
        weight: 10,
        label: "Minimum Age 18 Years",
        source: {
          type: "scheme",
          clause: "Clause 4.2: Minimum age 18 years.",
          documentId: "msme-udyam-kranti-2022",
        },
      },
      {
        id: "udyami-age-max",
        kind: "age",
        op: "max",
        value: 45,
        blocking: true,
        weight: 10,
        label: "Maximum Age 45 Years",
        source: {
          type: "scheme",
          clause: "Clause 4.2: Maximum age 45 years.",
          documentId: "msme-udyam-kranti-2022",
        },
      },
      {
        id: "udyami-qual",
        kind: "qualification",
        op: "one_of",
        value: [
          "10th Pass",
          "12th Pass",
          "Diploma",
          "Graduate",
          "B.Tech",
          "B.E.",
          "B.Com",
          "B.Sc",
          "B.A.",
          "BCA",
        ],
        blocking: true,
        weight: 10,
        label: "Minimum 10th or 12th Pass",
        source: {
          type: "scheme",
          clause:
            "Clause 4.3: Minimum 10th standard pass for enterprise loan up to ₹50 Lakh.",
          documentId: "msme-udyam-kranti-2022",
        },
      },
    ],
  },
  {
    title: "Swami Vivekananda Post-Matric Scholarship Scheme for OBC",
    department: "Backward Classes and Minorities Welfare Department, MP",
    state: "Madhya Pradesh",
    requirements: [
      {
        id: "pms-obc-domicile",
        kind: "domicile",
        op: "equals",
        value: "Madhya Pradesh",
        blocking: true,
        weight: 10,
        label: "Madhya Pradesh Domicile Required",
        source: {
          type: "scheme",
          clause: "Rule 1.1: Applicant must be a permanent resident of MP.",
          documentId: "mp-obc-pms-rules",
        },
      },
      {
        id: "pms-obc-cat",
        kind: "category",
        op: "equals",
        value: "OBC",
        blocking: true,
        weight: 10,
        label: "Other Backward Class (OBC)",
        source: {
          type: "scheme",
          clause:
            "Rule 1.2: Valid OBC non-creamy layer certificate issued by competent MP authority.",
          documentId: "mp-obc-pms-rules",
        },
      },
      {
        id: "pms-obc-qual",
        kind: "qualification",
        op: "one_of",
        value: [
          "12th Pass",
          "Graduate",
          "B.Tech",
          "B.E.",
          "B.Sc",
          "B.Com",
          "B.A.",
          "BCA",
          "Diploma",
          "Post Graduate",
        ],
        blocking: true,
        weight: 10,
        label: "Enrolled in Higher Post-Matric Education",
        source: {
          type: "scheme",
          clause: "Rule 1.3: Enrolled in higher education or technical degree.",
          documentId: "mp-obc-pms-rules",
        },
      },
    ],
  },
  {
    title: "Post-Matric Scholarship Scheme for SC Students",
    department: "Scheduled Caste Welfare Department, MP",
    state: "Madhya Pradesh",
    requirements: [
      {
        id: "pms-sc-domicile",
        kind: "domicile",
        op: "equals",
        value: "Madhya Pradesh",
        blocking: true,
        weight: 10,
        label: "Madhya Pradesh Domicile Required",
        source: {
          type: "scheme",
          clause: "Rule 1.1: Resident of MP.",
          documentId: "mp-sc-pms-rules",
        },
      },
      {
        id: "pms-sc-cat",
        kind: "category",
        op: "equals",
        value: "SC",
        blocking: true,
        weight: 10,
        label: "Scheduled Caste (SC)",
        source: {
          type: "scheme",
          clause: "Rule 1.2: Certified SC applicant.",
          documentId: "mp-sc-pms-rules",
        },
      },
      {
        id: "pms-sc-qual",
        kind: "qualification",
        op: "one_of",
        value: [
          "12th Pass",
          "Graduate",
          "B.Tech",
          "B.E.",
          "B.Sc",
          "B.Com",
          "B.A.",
          "BCA",
          "Diploma",
          "Post Graduate",
        ],
        blocking: true,
        weight: 10,
        label: "Higher Post-Matric Education",
        source: {
          type: "scheme",
          clause:
            "Rule 1.3: Full reimbursement of tuition & maintenance allowance.",
          documentId: "mp-sc-pms-rules",
        },
      },
    ],
  },
  {
    title: "Post-Matric Scholarship Scheme for ST Students",
    department: "Tribal Affairs Department, MP",
    state: "Madhya Pradesh",
    requirements: [
      {
        id: "pms-st-domicile",
        kind: "domicile",
        op: "equals",
        value: "Madhya Pradesh",
        blocking: true,
        weight: 10,
        label: "Madhya Pradesh Domicile Required",
        source: {
          type: "scheme",
          clause: "Rule 1.1: Resident of MP.",
          documentId: "mp-st-pms-rules",
        },
      },
      {
        id: "pms-st-cat",
        kind: "category",
        op: "equals",
        value: "ST",
        blocking: true,
        weight: 10,
        label: "Scheduled Tribe (ST)",
        source: {
          type: "scheme",
          clause: "Rule 1.2: Certified ST applicant.",
          documentId: "mp-st-pms-rules",
        },
      },
      {
        id: "pms-st-qual",
        kind: "qualification",
        op: "one_of",
        value: [
          "12th Pass",
          "Graduate",
          "B.Tech",
          "B.E.",
          "B.Sc",
          "B.Com",
          "B.A.",
          "BCA",
          "Diploma",
          "Post Graduate",
        ],
        blocking: true,
        weight: 10,
        label: "Higher Post-Matric Education",
        source: {
          type: "scheme",
          clause: "Rule 1.3: 100% course fee covered by state.",
          documentId: "mp-st-pms-rules",
        },
      },
    ],
  },
  {
    title:
      "Dr. Bhimrao Ambedkar Aarthik Kalyan Yojana (Micro-Enterprise Support)",
    department: "MP Scheduled Caste Finance & Development Corporation",
    state: "Madhya Pradesh",
    requirements: [
      {
        id: "ambedkar-domicile",
        kind: "domicile",
        op: "equals",
        value: "Madhya Pradesh",
        blocking: true,
        weight: 10,
        label: "Madhya Pradesh Domicile Required",
        source: {
          type: "scheme",
          clause: "Para 2.1: MP native certificate mandatory.",
          documentId: "ambedkar-yojana-2022",
        },
      },
      {
        id: "ambedkar-cat",
        kind: "category",
        op: "equals",
        value: "SC",
        blocking: true,
        weight: 10,
        label: "Scheduled Caste (SC)",
        source: {
          type: "scheme",
          clause: "Para 2.2: Scheduled Caste youth self-employment subsidy.",
          documentId: "ambedkar-yojana-2022",
        },
      },
      {
        id: "ambedkar-age-min",
        kind: "age",
        op: "min",
        value: 18,
        blocking: true,
        weight: 10,
        label: "Minimum Age 18 Years",
        source: {
          type: "scheme",
          clause: "Para 2.3: Age between 18 to 55 years.",
          documentId: "ambedkar-yojana-2022",
        },
      },
      {
        id: "ambedkar-age-max",
        kind: "age",
        op: "max",
        value: 55,
        blocking: true,
        weight: 10,
        label: "Maximum Age 55 Years",
        source: {
          type: "scheme",
          clause: "Para 2.3: Upper limit 55 years.",
          documentId: "ambedkar-yojana-2022",
        },
      },
    ],
  },
  {
    title: "Tantya Mama Aarthik Kalyan Yojana (ST Self-Employment)",
    department: "MP Scheduled Tribe Finance & Development Corporation",
    state: "Madhya Pradesh",
    requirements: [
      {
        id: "tantya-domicile",
        kind: "domicile",
        op: "equals",
        value: "Madhya Pradesh",
        blocking: true,
        weight: 10,
        label: "Madhya Pradesh Domicile Required",
        source: {
          type: "scheme",
          clause: "Para 2.1: Resident of MP.",
          documentId: "tantya-mama-yojana-2022",
        },
      },
      {
        id: "tantya-cat",
        kind: "category",
        op: "equals",
        value: "ST",
        blocking: true,
        weight: 10,
        label: "Scheduled Tribe (ST)",
        source: {
          type: "scheme",
          clause: "Para 2.2: Exclusively for Scheduled Tribe youth.",
          documentId: "tantya-mama-yojana-2022",
        },
      },
      {
        id: "tantya-age-min",
        kind: "age",
        op: "min",
        value: 18,
        blocking: true,
        weight: 10,
        label: "Minimum Age 18 Years",
        source: {
          type: "scheme",
          clause: "Para 2.3: Age between 18 to 55 years.",
          documentId: "tantya-mama-yojana-2022",
        },
      },
      {
        id: "tantya-age-max",
        kind: "age",
        op: "max",
        value: 55,
        blocking: true,
        weight: 10,
        label: "Maximum Age 55 Years",
        source: {
          type: "scheme",
          clause: "Para 2.3: Maximum age 55 years.",
          documentId: "tantya-mama-yojana-2022",
        },
      },
    ],
  },
  {
    title: "Gaon Ki Beti Scheme (Rural Higher Education Incentive)",
    department: "Higher Education Department, Government of Madhya Pradesh",
    state: "Madhya Pradesh",
    requirements: [
      {
        id: "gkb-domicile",
        kind: "domicile",
        op: "equals",
        value: "Madhya Pradesh",
        blocking: true,
        weight: 10,
        label: "Madhya Pradesh Domicile Required",
        source: {
          type: "scheme",
          clause: "Rule 3.1: Female resident of rural MP.",
          documentId: "gaon-ki-beti-rules",
        },
      },
      {
        id: "gkb-qual",
        kind: "qualification",
        op: "one_of",
        value: [
          "12th Pass",
          "Higher Secondary",
          "Graduate",
          "B.Tech",
          "B.Sc",
          "B.Com",
          "B.A.",
        ],
        blocking: true,
        weight: 10,
        label: "12th Pass from Village School (1st Division)",
        source: {
          type: "scheme",
          clause:
            "Rule 3.2: Passed 12th exam from a rural school in first division.",
          documentId: "gaon-ki-beti-rules",
        },
      },
    ],
  },
  {
    title: "Pratibha Kiran Yojana (Urban BPL Higher Education)",
    department: "Higher Education Department, Government of Madhya Pradesh",
    state: "Madhya Pradesh",
    requirements: [
      {
        id: "pky-domicile",
        kind: "domicile",
        op: "equals",
        value: "Madhya Pradesh",
        blocking: true,
        weight: 10,
        label: "Madhya Pradesh Domicile Required",
        source: {
          type: "scheme",
          clause: "Rule 2.1: Native resident of MP.",
          documentId: "pratibha-kiran-rules",
        },
      },
      {
        id: "pky-qual",
        kind: "qualification",
        op: "one_of",
        value: [
          "12th Pass",
          "Higher Secondary",
          "Graduate",
          "B.Tech",
          "B.Sc",
          "B.Com",
          "B.A.",
        ],
        blocking: true,
        weight: 10,
        label: "12th Pass (1st Division) from Urban Area",
        source: {
          type: "scheme",
          clause:
            "Rule 2.2: Urban area candidate scored first division in 12th.",
          documentId: "pratibha-kiran-rules",
        },
      },
    ],
  },
  {
    title: "Mukhyamantri Kaushalya Yojana (Women Technical Skills Training)",
    department: "Directorate of Skill Development, MP",
    state: "Madhya Pradesh",
    requirements: [
      {
        id: "kaushalya-domicile",
        kind: "domicile",
        op: "equals",
        value: "Madhya Pradesh",
        blocking: true,
        weight: 10,
        label: "Madhya Pradesh Domicile Required",
        source: {
          type: "scheme",
          clause: "Norm 4.1: Resident of MP.",
          documentId: "kaushalya-rules-2023",
        },
      },
      {
        id: "kaushalya-age-min",
        kind: "age",
        op: "min",
        value: 18,
        blocking: true,
        weight: 10,
        label: "Minimum Age 18 Years",
        source: {
          type: "scheme",
          clause: "Norm 4.2: Minimum age 18 years.",
          documentId: "kaushalya-rules-2023",
        },
      },
      {
        id: "kaushalya-qual",
        kind: "qualification",
        op: "one_of",
        value: [
          "10th Pass",
          "12th Pass",
          "ITI",
          "Diploma",
          "Graduate",
          "B.Tech",
          "B.Sc",
          "BCA",
        ],
        blocking: true,
        weight: 10,
        label: "10th, 12th, or ITI Pass",
        source: {
          type: "scheme",
          clause:
            "Norm 4.3: Free advanced technical certification for young women.",
          documentId: "kaushalya-rules-2023",
        },
      },
    ],
  },
];

async function main() {
  console.log("🌱 Seeding verified MP Welfare Schemes into Neon Postgres...");

  let seededCount = 0;
  for (const s of MP_SCHEMES) {
    // Check if scheme title already exists
    const [existing] = await db
      .select({ id: opportunities.id })
      .from(opportunities)
      .where(eq(opportunities.title, s.title))
      .limit(1);

    if (existing) {
      // Update requirements to latest verified schema
      await db
        .update(opportunities)
        .set({
          requirements: s.requirements,
          department: s.department,
          status: "live",
        })
        .where(eq(opportunities.id, existing.id));
      console.log(`  ↻ Updated: ${s.title}`);
    } else {
      await db.insert(opportunities).values({
        kind: "scheme",
        title: s.title,
        department: s.department,
        state: s.state,
        requirements: s.requirements,
        status: "live",
      });
      console.log(`  ✓ Inserted: ${s.title}`);
      seededCount++;
    }
  }

  console.log(
    `\n🎉 Done! Seeded ${seededCount} new schemes, updated ${MP_SCHEMES.length - seededCount}.`,
  );
}

main().catch((err) => {
  console.error("❌ Failed to seed schemes:", err);
  process.exit(1);
});
