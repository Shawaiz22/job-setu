import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  targets,
  profiles,
  skills,
  opportunities,
  archetypes,
} from "@/db/schema";
import { withUserOnly } from "@/lib/db/scope";
import { decryptProfileFields } from "@/lib/crypto/encryption";
import { hasActiveConsent } from "@/lib/consent";
import { evaluateEligibility } from "@/modules/eligibility/evaluate";
import type { Requirement } from "@/modules/eligibility/types";

const uuidSchema = z.string().uuid("Invalid target ID format");

/**
 * Runs the deterministic eligibility engine on a user target per SPEC.md 6 & 8.
 */
export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await props.params;
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) {
    return NextResponse.json(
      { error: "Invalid target ID", issues: parsedId.error.issues },
      { status: 400 },
    );
  }

  const userId = session.user.id;

  // 1. Verify consent for eligibility processing (SPEC.md 9.3)
  const consentGiven = await hasActiveConsent(userId, "eligibility_processing");
  if (!consentGiven) {
    return NextResponse.json(
      {
        error:
          "Active consent for eligibility processing is required to evaluate targets.",
      },
      { status: 403 },
    );
  }

  // 2. Fetch target with strict user scoping (SPEC.md 9.5)
  const [target] = await db
    .select()
    .from(targets)
    .where(and(eq(targets.id, id), withUserOnly(targets, userId)))
    .limit(1);

  if (!target) {
    return NextResponse.json({ error: "Target not found" }, { status: 404 });
  }

  // 3. Fetch user profile and skills
  const [[rawProfile], userSkills] = await Promise.all([
    db.select().from(profiles).where(withUserOnly(profiles, userId)).limit(1),
    db.select().from(skills).where(withUserOnly(skills, userId)),
  ]);

  if (!rawProfile) {
    return NextResponse.json(
      {
        error:
          "Profile not found. Please complete your profile before evaluating eligibility.",
      },
      { status: 404 },
    );
  }

  const decryptedProfile = decryptProfileFields(rawProfile);

  // 4. Resolve requirements from source opportunity or archetype
  let requirements: Requirement[] = [];

  if (target.kind === "govt_post" || target.kind === "scheme") {
    // Check by ID or sourceId
    const [opp] = await db
      .select()
      .from(opportunities)
      .where(
        target.sourceId.includes("-") && target.sourceId.length === 36
          ? eq(opportunities.id, target.sourceId)
          : eq(opportunities.title, target.title),
      )
      .limit(1);

    if (opp && opp.status === "live") {
      requirements = opp.requirements;
    }
  } else if (target.kind === "archetype") {
    const [arch] = await db
      .select()
      .from(archetypes)
      .where(
        target.sourceId.includes("-") && target.sourceId.length === 36
          ? eq(archetypes.id, target.sourceId)
          : eq(archetypes.title, target.title),
      )
      .limit(1);

    if (arch) {
      requirements = arch.requirements;
    }
  }

  // 5. Run pure eligibility evaluation
  const evaluatedOn = new Date().toISOString().split("T")[0]!;
  const evaluation = evaluateEligibility({
    profile: decryptedProfile,
    skills: userSkills.map((s) => ({
      name: s.name,
      evidence: s.evidence,
    })),
    requirements,
    evaluatedOn,
  });

  return NextResponse.json({
    success: true,
    target,
    evaluation,
    evaluatedOn,
  });
}
