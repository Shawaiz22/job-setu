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
    expect(result1.opportunities.length).toBeGreaterThanOrEqual(2);
    expect(result1.archetypes.length).toBeGreaterThanOrEqual(2);

    // Run again to verify idempotency
    const result2 = await seedEligibilityData();
    expect(result2.opportunities.length).toBe(result1.opportunities.length);
    expect(result2.archetypes.length).toBe(result1.archetypes.length);

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
