import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { opportunities, archetypes } from "@/db/schema";
import {
  seedEligibilityData,
  SEED_OPPORTUNITIES,
  SEED_ARCHETYPES,
} from "@/modules/seed/eligibility";

describe("Seed Opportunities & Archetypes (M3 T4)", () => {
  it("idempotently seeds opportunities and archetypes without duplicates", async () => {
    const result1 = await seedEligibilityData();
    expect(result1.opportunities.length).toBeGreaterThanOrEqual(10);
    expect(result1.archetypes.length).toBeGreaterThanOrEqual(2);

    // Run again to verify idempotency (must not create duplicate records)
    await seedEligibilityData();

    // Verify zero duplicate titles in database
    const [allOpps, allArchs] = await Promise.all([
      db.select({ title: opportunities.title }).from(opportunities),
      db.select({ title: archetypes.title }).from(archetypes),
    ]);

    const oppTitles = allOpps.map((o) => o.title);
    expect(oppTitles.length).toBe(new Set(oppTitles).size);

    const archTitles = allArchs.map((a) => a.title);
    expect(archTitles.length).toBe(new Set(archTitles).size);

    // Verify MPPSC opportunity data
    const [mppsc] = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.title, SEED_OPPORTUNITIES[0]!.title))
      .limit(1);

    expect(mppsc).toBeDefined();
    expect(mppsc!.department).toContain("Madhya Pradesh");
    expect(mppsc!.requirements).toHaveLength(4);

    // Verify Software Engineer archetype data
    const [swe] = await db
      .select()
      .from(archetypes)
      .where(eq(archetypes.title, SEED_ARCHETYPES[0]!.title))
      .limit(1);

    expect(swe).toBeDefined();
    expect(swe!.requirements).toHaveLength(3);
  }, 15000);
});
