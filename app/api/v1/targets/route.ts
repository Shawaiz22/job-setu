import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
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
import { evaluateEligibility } from "@/modules/eligibility/evaluate";
import type {
  EvaluationResult,
  Requirement,
} from "@/modules/eligibility/types";

const createTargetSchema = z.object({
  kind: z.enum(["govt_post", "scheme", "job_description", "archetype"]),
  sourceId: z.string().min(1),
  title: z.string().min(1),
});

/**
 * Retrieves all targets for the authenticated user, augmented with live evaluation verdicts.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [
    userTargets,
    [rawProfile],
    userSkills,
    liveOpportunities,
    liveArchetypes,
  ] = await Promise.all([
    db
      .select()
      .from(targets)
      .where(withUserOnly(targets, userId))
      .orderBy(desc(targets.createdAt)),
    db.select().from(profiles).where(withUserOnly(profiles, userId)).limit(1),
    db.select().from(skills).where(withUserOnly(skills, userId)),
    db.select().from(opportunities).where(eq(opportunities.status, "live")),
    db.select().from(archetypes),
  ]);

  const oppMap = new Map(liveOpportunities.map((o) => [o.id, o]));
  const oppTitleMap = new Map(liveOpportunities.map((o) => [o.title, o]));
  const archMap = new Map(liveArchetypes.map((a) => [a.id, a]));
  const archTitleMap = new Map(liveArchetypes.map((a) => [a.title, a]));

  const decryptedProfile = rawProfile ? decryptProfileFields(rawProfile) : null;
  const evaluatedOn = new Date().toISOString().split("T")[0]!;

  const targetsWithEvaluation = userTargets.map((target) => {
    let requirements: Requirement[] = [];

    if (target.kind === "govt_post" || target.kind === "scheme") {
      const opp = oppMap.get(target.sourceId) || oppTitleMap.get(target.title);
      if (opp) requirements = opp.requirements;
    } else if (target.kind === "archetype") {
      const arch =
        archMap.get(target.sourceId) || archTitleMap.get(target.title);
      if (arch) requirements = arch.requirements;
    }

    let evaluation: EvaluationResult | null = null;
    if (decryptedProfile && requirements.length > 0) {
      evaluation = evaluateEligibility({
        profile: decryptedProfile,
        skills: userSkills.map((s) => ({
          name: s.name,
          evidence: s.evidence,
        })),
        requirements,
        evaluatedOn,
      });
    }

    return {
      ...target,
      requirementsCount: requirements.length,
      evaluation,
    };
  });

  return NextResponse.json({
    targets: targetsWithEvaluation,
    profileComplete: Boolean(decryptedProfile),
  });
}

/**
 * Adds a new target to the user's workspace.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createTargetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const { kind, sourceId, title } = parsed.data;

    // Check if target already added to prevent duplicates
    const [existing] = await db
      .select()
      .from(targets)
      .where(
        and(
          withUserOnly(targets, session.user.id),
          eq(targets.sourceId, sourceId),
        ),
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({
        success: true,
        target: existing,
        alreadyExists: true,
      });
    }

    const [inserted] = await db
      .insert(targets)
      .values({
        userId: session.user.id,
        kind,
        sourceId,
        title,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        target: inserted,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
