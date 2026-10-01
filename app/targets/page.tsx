import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
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
import { Button } from "@/components/ui/button";
import { TargetsList } from "@/components/targets/TargetsList";
import type { TargetItem } from "@/components/targets/TargetCard";

export const metadata = {
  title: "Target Workspace — Kariyar Setu",
  description:
    "Track your target MP government opportunities, welfare schemes, and verified eligibility verdicts.",
};

export default async function TargetsDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
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

  let decryptedProfile = null;
  if (rawProfile) {
    try {
      decryptedProfile = decryptProfileFields(rawProfile);
    } catch {
      decryptedProfile = rawProfile;
    }
  }

  const evaluatedOn = new Date().toISOString().split("T")[0]!;

  const targetsWithEvaluation: TargetItem[] = userTargets.map((target) => {
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
      try {
        evaluation = evaluateEligibility({
          profile: decryptedProfile,
          skills: userSkills.map((s) => ({
            name: s.name,
            evidence: s.evidence,
          })),
          requirements,
          evaluatedOn,
        });
      } catch (err) {
        console.error("Target evaluation error:", err);
      }
    }

    return {
      id: target.id,
      kind: target.kind as TargetItem["kind"],
      sourceId: target.sourceId,
      title: target.title,
      requirementsCount: requirements.length,
      evaluation,
    };
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      {/* Top Header */}
      <div className="border-border/80 flex flex-col items-start justify-between gap-4 border-b pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground text-3xl font-extrabold tracking-tight">
            Target Workspace
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Real-time clause verification against MP Government recruitments,
            welfare schemes, and career paths.
          </p>
        </div>
        <Link href="/targets/new">
          <Button>+ Add Target</Button>
        </Link>
      </div>

      <TargetsList initialTargets={targetsWithEvaluation} />
    </div>
  );
}
