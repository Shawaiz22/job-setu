import { describe, it, expect } from "vitest";
import {
  assertValidUuid,
  isValidUuid,
  InvalidUuidError,
  withUserScope,
  withUserOnly,
} from "@/lib/db/scope";
import { skills, users } from "@/db/schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";

describe("User Query Scoping Helpers (SPEC.md 9.5)", () => {
  const validUuid1 = "123e4567-e89b-12d3-a456-426614174000";
  const validUuid2 = "987fcdeb-51a2-43f7-9876-543210abcdef";
  const invalidUuid = "not-a-valid-uuid";

  describe("UUID Validation", () => {
    it("accepts valid RFC 4122 UUID strings", () => {
      expect(isValidUuid(validUuid1)).toBe(true);
      expect(assertValidUuid(validUuid1)).toBe(validUuid1);
    });

    it("rejects non-UUID strings and throws InvalidUuidError", () => {
      expect(isValidUuid(invalidUuid)).toBe(false);
      expect(() => assertValidUuid(invalidUuid, "id")).toThrow(
        InvalidUuidError,
      );
    });
  });

  describe("withUserScope condition", () => {
    it("builds a compound condition scoping by id and userId", () => {
      const condition = withUserScope(skills, validUuid1, validUuid2);
      expect(condition).toBeDefined();
    });

    it("fails immediately on invalid id or userId before SQL evaluation", () => {
      expect(() => withUserScope(skills, invalidUuid, validUuid2)).toThrow(
        InvalidUuidError,
      );
      expect(() => withUserScope(skills, validUuid1, invalidUuid)).toThrow(
        InvalidUuidError,
      );
    });
  });

  describe("withUserOnly condition", () => {
    it("builds condition scoping strictly by userId", () => {
      const condition = withUserOnly(skills, validUuid1);
      expect(condition).toBeDefined();
    });

    it("fails immediately on invalid userId", () => {
      expect(() => withUserOnly(skills, invalidUuid)).toThrow(InvalidUuidError);
    });
  });

  describe("Live Database Scoping Execution", () => {
    it("isolates data so user A cannot read user B's records", async () => {
      // 1. Create two test users
      const [userA] = await db
        .insert(users)
        .values({
          email: `user-a-${Date.now()}@example.com`,
          passwordHash: "hash-a",
        })
        .returning();

      const [userB] = await db
        .insert(users)
        .values({
          email: `user-b-${Date.now()}@example.com`,
          passwordHash: "hash-b",
        })
        .returning();

      expect(userA).toBeDefined();
      expect(userB).toBeDefined();

      // 2. Insert a skill owned by user A
      const [skillA] = await db
        .insert(skills)
        .values({
          userId: userA!.id,
          name: "TypeScript",
          evidence: "verified",
        })
        .returning();

      expect(skillA).toBeDefined();

      // 3. User A queries with their own userId -> found
      const [foundByA] = await db
        .select()
        .from(skills)
        .where(withUserScope(skills, skillA!.id, userA!.id));
      expect(foundByA?.id).toBe(skillA!.id);

      // 4. User B queries for user A's skill ID with User B's userId -> not found (returns empty)
      const notFoundByB = await db
        .select()
        .from(skills)
        .where(withUserScope(skills, skillA!.id, userB!.id));
      expect(notFoundByB).toHaveLength(0);

      // Clean up
      await db.delete(users).where(eq(users.id, userA!.id));
      await db.delete(users).where(eq(users.id, userB!.id));
    }, 15000);
  });
});
