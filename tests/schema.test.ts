import { describe, it, expect } from "vitest";
import { db } from "@/db";
import {
  users,
  profiles,
  skills,
  targets,
  opportunities,
  archetypes,
  experiences,
  consents,
} from "@/db/schema";
import { eq } from "drizzle-orm";

describe("Database Schema & Neon Postgres Verification", () => {
  it("verifies all 8 tables can be queried without errors", async () => {
    // Queries each table concurrently to verify schema existence and query compatibility
    const [u, p, s, t, o, a, e, c] = await Promise.all([
      db.select().from(users).limit(1),
      db.select().from(profiles).limit(1),
      db.select().from(skills).limit(1),
      db.select().from(targets).limit(1),
      db.select().from(opportunities).limit(1),
      db.select().from(archetypes).limit(1),
      db.select().from(experiences).limit(1),
      db.select().from(consents).limit(1),
    ]);

    expect(Array.isArray(u)).toBe(true);
    expect(Array.isArray(p)).toBe(true);
    expect(Array.isArray(s)).toBe(true);
    expect(Array.isArray(t)).toBe(true);
    expect(Array.isArray(o)).toBe(true);
    expect(Array.isArray(a)).toBe(true);
    expect(Array.isArray(e)).toBe(true);
    expect(Array.isArray(c)).toBe(true);
  }, 15000);

  it("verifies user and profile relation with cascade deletion integrity", async () => {
    const testEmail = `test-user-${Date.now()}@example.com`;

    // 1. Insert test user
    const [insertedUser] = await db
      .insert(users)
      .values({
        email: testEmail,
        passwordHash: "hash-secret-test",
        isAdmin: false,
      })
      .returning();

    expect(insertedUser).toBeDefined();
    expect(insertedUser?.email).toBe(testEmail);

    // 2. Insert associated profile
    const [insertedProfile] = await db
      .insert(profiles)
      .values({
        userId: insertedUser!.id,
        dateOfBirth: "2000-01-01",
        category: "General",
        domicileState: "Madhya Pradesh",
        qualification: "Graduate in Computer Science",
        attemptsUsed: 0,
        preference: "both",
      })
      .returning();

    expect(insertedProfile).toBeDefined();
    expect(insertedProfile?.userId).toBe(insertedUser!.id);

    // 3. Delete user and verify cascade delete removes the profile
    await db.delete(users).where(eq(users.id, insertedUser!.id));

    const remainingProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, insertedUser!.id));

    expect(remainingProfile).toHaveLength(0);
  });
});
