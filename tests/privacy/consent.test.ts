import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  grantConsent,
  revokeConsent,
  hasActiveConsent,
  getUserConsents,
} from "@/lib/consent";

describe("Purpose-Bound Consent Model (SPEC.md 9.3)", () => {
  const testEmail = `consent-test-${Date.now()}@example.com`;
  let testUserId: string;

  beforeAll(async () => {
    const [u] = await db
      .insert(users)
      .values({
        email: testEmail,
        passwordHash: "dummy-hash",
      })
      .returning();
    testUserId = u!.id;
  });

  afterAll(async () => {
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  it("initially indicates no active consent", async () => {
    const active = await hasActiveConsent(testUserId, "eligibility_processing");
    expect(active).toBe(false);
  });

  it("grants purpose-bound versioned consent and verifies active state", async () => {
    const record = await grantConsent(
      testUserId,
      "eligibility_processing",
      "1.0",
    );
    expect(record).toBeDefined();
    expect(record.purpose).toBe("eligibility_processing");
    expect(record.version).toBe("1.0");
    expect(record.revokedAt).toBeNull();

    const active = await hasActiveConsent(testUserId, "eligibility_processing");
    expect(active).toBe(true);
  });

  it("checks version matching strictly", async () => {
    const v1Active = await hasActiveConsent(
      testUserId,
      "eligibility_processing",
      "1.0",
    );
    expect(v1Active).toBe(true);

    const v2Active = await hasActiveConsent(
      testUserId,
      "eligibility_processing",
      "2.0",
    );
    expect(v2Active).toBe(false);
  });

  it("revokes consent immediately and reflects in active check", async () => {
    await revokeConsent(testUserId, "eligibility_processing");

    const active = await hasActiveConsent(testUserId, "eligibility_processing");
    expect(active).toBe(false);

    // Verify raw DB row has revokedAt set
    const allConsents = await getUserConsents(testUserId);
    const revoked = allConsents.find(
      (c) => c.purpose === "eligibility_processing",
    );
    expect(revoked).toBeDefined();
    expect(revoked!.revokedAt).not.toBeNull();
  });

  it("supports re-granting consent cleanly after revocation", async () => {
    await grantConsent(testUserId, "eligibility_processing", "1.1");

    const active = await hasActiveConsent(
      testUserId,
      "eligibility_processing",
      "1.1",
    );
    expect(active).toBe(true);

    const history = await getUserConsents(testUserId);
    expect(history.length).toBeGreaterThanOrEqual(2);
  });

  it("keeps different consent purposes completely isolated", async () => {
    // eligibility_processing is active, notifications should still be inactive
    const notificationsActive = await hasActiveConsent(
      testUserId,
      "notifications",
    );
    expect(notificationsActive).toBe(false);

    await grantConsent(testUserId, "notifications");
    expect(await hasActiveConsent(testUserId, "notifications")).toBe(true);
    expect(await hasActiveConsent(testUserId, "eligibility_processing")).toBe(
      true,
    );

    // Revoke notifications only
    await revokeConsent(testUserId, "notifications");
    expect(await hasActiveConsent(testUserId, "notifications")).toBe(false);
    expect(await hasActiveConsent(testUserId, "eligibility_processing")).toBe(
      true,
    );
  });
});
