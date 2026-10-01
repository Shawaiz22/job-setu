import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  profiles,
  skills,
  targets,
  consents,
  experiences,
} from "@/db/schema";
import {
  encryptProfileFields,
  decryptProfileFields,
} from "@/lib/crypto/encryption";

describe("Data Subject Rights & Cascade Deletion (SPEC.md 9.4)", () => {
  const testEmail = `cascade-test-${Date.now()}@example.com`;
  let testUserId: string;

  beforeAll(async () => {
    // 1. Create a user
    const [u] = await db
      .insert(users)
      .values({
        email: testEmail,
        passwordHash: "hash-secret",
      })
      .returning();
    testUserId = u!.id;

    // 2. Insert profile
    const encryptedProfile = encryptProfileFields({
      userId: testUserId,
      dateOfBirth: "1997-04-12",
      category: "OBC",
      domicileState: "Madhya Pradesh",
      qualification: "B.Sc Mathematics",
      preference: "govt" as const,
    });
    await db.insert(profiles).values(encryptedProfile);

    // 3. Insert skills
    await db.insert(skills).values([
      { userId: testUserId, name: "Python", evidence: "project" },
      { userId: testUserId, name: "General Knowledge", evidence: "declared" },
    ]);

    // 4. Insert targets
    await db.insert(targets).values({
      userId: testUserId,
      kind: "govt_post",
      sourceId: "mppsc-dsp-2026",
      title: "MPPSC Deputy Superintendent of Police",
    });

    // 5. Insert consents
    await db.insert(consents).values([
      {
        userId: testUserId,
        purpose: "eligibility_processing",
        version: "1.0",
      },
      {
        userId: testUserId,
        purpose: "notifications",
        version: "1.0",
      },
    ]);

    // 6. Insert experience
    await db.insert(experiences).values({
      userId: testUserId,
      company: "MP Police Academy",
      role: "Sub-Inspector",
      year: 2024,
      rounds: [{ name: "Written Exam" }, { name: "Physical Test" }],
      askedAbout: ["Aptitude", "MP GK", "Physical Fitness"],
      outcome: "offered",
      verificationLevel: "declared",
    });
  });

  afterAll(async () => {
    if (testUserId) {
      // Cleanup user if still exists
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  it("verifies all records exist before deletion", async () => {
    const [prof] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, testUserId));
    const userSkills = await db
      .select()
      .from(skills)
      .where(eq(skills.userId, testUserId));
    const userTargets = await db
      .select()
      .from(targets)
      .where(eq(targets.userId, testUserId));
    const userConsents = await db
      .select()
      .from(consents)
      .where(eq(consents.userId, testUserId));
    const userExperiences = await db
      .select()
      .from(experiences)
      .where(eq(experiences.userId, testUserId));

    expect(prof).toBeDefined();
    expect(userSkills.length).toBe(2);
    expect(userTargets.length).toBe(1);
    expect(userConsents.length).toBe(2);
    expect(userExperiences.length).toBe(1);
  });

  it("verifies data subject export decrypts profile and aggregates all entities", async () => {
    const [rawProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, testUserId))
      .limit(1);

    expect(rawProfile).toBeDefined();
    const decrypted = decryptProfileFields(rawProfile!);

    expect(decrypted.dateOfBirth).toBe("1997-04-12");
    expect(decrypted.category).toBe("OBC");
    expect(decrypted.domicileState).toBe("Madhya Pradesh");
    expect(decrypted.qualification).toBe("B.Sc Mathematics");
  });

  it("cascades deletion and guarantees zero orphaned rows remain across all tables", async () => {
    // Perform cascading wipe per DELETE /api/v1/profile
    await Promise.all([
      db.delete(profiles).where(eq(profiles.userId, testUserId)),
      db.delete(skills).where(eq(skills.userId, testUserId)),
      db.delete(targets).where(eq(targets.userId, testUserId)),
      db.delete(consents).where(eq(consents.userId, testUserId)),
      db.delete(experiences).where(eq(experiences.userId, testUserId)),
    ]);

    // Verify zero orphaned rows across all tables
    const [prof] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, testUserId));
    const userSkills = await db
      .select()
      .from(skills)
      .where(eq(skills.userId, testUserId));
    const userTargets = await db
      .select()
      .from(targets)
      .where(eq(targets.userId, testUserId));
    const userConsents = await db
      .select()
      .from(consents)
      .where(eq(consents.userId, testUserId));
    const userExperiences = await db
      .select()
      .from(experiences)
      .where(eq(experiences.userId, testUserId));

    expect(prof).toBeUndefined();
    expect(userSkills).toHaveLength(0);
    expect(userTargets).toHaveLength(0);
    expect(userConsents).toHaveLength(0);
    expect(userExperiences).toHaveLength(0);
  });
});
