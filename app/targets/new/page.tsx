import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { opportunities, archetypes, targets } from "@/db/schema";
import { withUserOnly } from "@/lib/db/scope";
import {
  TargetBrowser,
  type OpportunityItem,
  type ArchetypeItem,
} from "@/components/targets/TargetBrowser";

export const metadata = {
  title: "Browse Opportunities — Kariyar Setu",
  description:
    "Browse verified MP recruitment circulars, welfare schemes, and role archetypes.",
};

export default async function NewTargetBrowserPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [liveOpportunities, allArchetypes, userTargets] = await Promise.all([
    db.select().from(opportunities).where(eq(opportunities.status, "live")),
    db.select().from(archetypes),
    db.select().from(targets).where(withUserOnly(targets, session.user.id)),
  ]);

  const existingSourceIds = userTargets.flatMap((t) => [t.sourceId, t.title]);

  const oppItems: OpportunityItem[] = liveOpportunities.map((o) => ({
    id: o.id,
    kind: o.kind as OpportunityItem["kind"],
    title: o.title,
    department: o.department,
    state: o.state,
    closesOn: o.closesOn ? o.closesOn.toISOString() : null,
    requirements: o.requirements,
    sourceDocumentPath: o.sourceDocumentPath,
  }));

  const archItems: ArchetypeItem[] = allArchetypes.map((a) => ({
    id: a.id,
    title: a.title,
    requirements: a.requirements,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <div className="border-border/80 flex items-center justify-between border-b pb-5">
        <div>
          <Link
            href="/targets"
            className="text-muted-foreground hover:text-foreground inline-flex items-center text-xs font-semibold transition-colors"
          >
            ← Back to Targets
          </Link>
          <h1 className="text-foreground mt-2 text-3xl font-extrabold tracking-tight">
            Browse Opportunities &amp; Targets
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Select verified MP notifications, schemes, or role archetypes to add
            to your personal eligibility tracker.
          </p>
        </div>
      </div>

      <TargetBrowser
        opportunities={oppItems}
        archetypes={archItems}
        initialExistingSourceIds={existingSourceIds}
      />
    </div>
  );
}
