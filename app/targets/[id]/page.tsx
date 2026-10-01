import Link from "next/link";
import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  targets,
  profiles,
  skills,
  consents,
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
import { TargetDetailView } from "@/components/targets/TargetDetailView";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Target Evaluation — Kariyar Setu",
  description:
    "Deterministic eligibility verification and statutory clause citations.",
};

export default async function TargetWorkspacePage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const userId = session.user.id;

  // 1. Fetch Target
  const [target] = await db
    .select()
    .from(targets)
    .where(and(withUserOnly(targets, userId), eq(targets.id, id)))
    .limit(1);

  if (!target) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-foreground text-2xl font-bold">Target Not Found</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          This target may have been removed or does not exist in your workspace.
        </p>
        <div className="mt-6">
          <Link href="/targets">
            <Button variant="outline">Return to Targets</Button>
          </Link>
        </div>
      </div>
    );
  }

  // 2. Fetch Consent Status
  const [consent] = await db
    .select()
    .from(consents)
    .where(
      and(
        withUserOnly(consents, userId),
        eq(consents.purpose, "eligibility_processing"),
        isNull(consents.revokedAt),
      ),
    )
    .limit(1);

  const hasConsent = Boolean(consent);

  // 3. Fetch Profile
  const [rawProfile] = await db
    .select()
    .from(profiles)
    .where(withUserOnly(profiles, userId))
    .limit(1);

  const hasProfile = Boolean(rawProfile);

  // 4. Perform evaluation if consent and profile exist
  let evaluation: EvaluationResult | null = null;
  const evaluatedOn = new Date().toISOString().split("T")[0]!;

  if (hasConsent && hasProfile && rawProfile) {
    let decryptedProfile = null;
    try {
      decryptedProfile = decryptProfileFields(rawProfile);
    } catch {
      decryptedProfile = rawProfile;
    }

    const [userSkills, [opp], [arch]] = await Promise.all([
      db.select().from(skills).where(withUserOnly(skills, userId)),
      target.kind === "govt_post" || target.kind === "scheme"
        ? db
            .select()
            .from(opportunities)
            .where(
              and(
                eq(opportunities.id, target.sourceId),
                eq(opportunities.status, "live"),
              ),
            )
            .limit(1)
        : Promise.resolve([]),
      target.kind === "archetype"
        ? db
            .select()
            .from(archetypes)
            .where(eq(archetypes.id, target.sourceId))
            .limit(1)
        : Promise.resolve([]),
    ]);

    let requirements: Requirement[] = [];
    if (opp) {
      requirements = opp.requirements;
    } else if (arch) {
      requirements = arch.requirements;
    }

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
        console.error("Target clause evaluation error:", err);
      }
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <TargetDetailView
        target={{
          id: target.id,
          kind: target.kind,
          sourceId: target.sourceId,
          title: target.title,
        }}
        evaluation={evaluation}
        evaluatedOn={evaluatedOn}
        hasConsent={hasConsent}
        hasProfile={hasProfile}
      />
    </div>
  );
}
