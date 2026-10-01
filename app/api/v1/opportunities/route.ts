import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { opportunities, archetypes } from "@/db/schema";
import { seedEligibilityData } from "@/modules/seed/eligibility";

/**
 * Returns available opportunities and archetypes for browsing per SPEC.md 8 & 11.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const kindFilter = url.searchParams.get("kind"); // 'govt_post' | 'scheme' | 'archetype'

  // Fetch live opportunities and archetypes
  let [liveOpps, archs] = await Promise.all([
    db.select().from(opportunities).where(eq(opportunities.status, "live")),
    db.select().from(archetypes),
  ]);

  // If no opportunities are in the DB yet, auto-seed defaults
  if (liveOpps.length === 0 && archs.length === 0) {
    const seeded = await seedEligibilityData();
    liveOpps = seeded.opportunities.filter((o) => o.status === "live");
    archs = seeded.archetypes;
  }

  let filteredOpps = liveOpps;
  if (kindFilter === "govt_post" || kindFilter === "scheme") {
    filteredOpps = liveOpps.filter((o) => o.kind === kindFilter);
  }

  const resultArchetypes =
    !kindFilter || kindFilter === "archetype" ? archs : [];

  return NextResponse.json({
    opportunities: filteredOpps,
    archetypes: resultArchetypes,
    counts: {
      govt_posts: liveOpps.filter((o) => o.kind === "govt_post").length,
      schemes: liveOpps.filter((o) => o.kind === "scheme").length,
      archetypes: archs.length,
    },
  });
}
