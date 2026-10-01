import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import {
  encrypt,
  decrypt,
  encryptProfileFields,
  decryptProfileFields,
} from "@/lib/crypto/encryption";
import { db } from "@/db";
import { users, profiles } from "@/db/schema";

describe("Application-Level Encryption (lib/crypto/encryption.ts)", () => {
  it("encrypts and decrypts strings bidirectionally", () => {
    const original = "1998-08-15";
    const ciphertext = encrypt(original);

    expect(ciphertext).not.toBe(original);
    expect(ciphertext).not.toContain(original);
    expect(decrypt(ciphertext)).toBe(original);
  });

  it("produces unique ciphertexts for identical plaintext due to random IV", () => {
    const plaintext = "OBC";
    const cipher1 = encrypt(plaintext);
    const cipher2 = encrypt(plaintext);

    expect(cipher1).not.toBe(cipher2);
    expect(decrypt(cipher1)).toBe(plaintext);
    expect(decrypt(cipher2)).toBe(plaintext);
  });

  it("detects tampering and throws an authentication error on corrupted tag or ciphertext", () => {
    const ciphertext = encrypt("Madhya Pradesh");
    const [iv, tag, data] = ciphertext.split(":");

    // Corrupt the ciphertext data
    const corruptedData = "a" + data!.slice(1);
    const corruptedCiphertext = `${iv}:${tag}:${corruptedData}`;

    expect(() => decrypt(corruptedCiphertext)).toThrow();
  });

  it("throws error for invalid ciphertext formats", () => {
    expect(() => decrypt("not-a-valid-cipher")).toThrow(/expected iv:tag:data/);
  });

  it("correctly encrypts and decrypts sensitive profile object fields", () => {
    const rawData = {
      dateOfBirth: "1995-12-25",
      category: "SC",
      domicileState: "Madhya Pradesh",
      qualification: "B.Tech",
    };

    const encrypted = encryptProfileFields(rawData);

    // Sensitive fields are encrypted
    expect(encrypted.dateOfBirth).not.toBe(rawData.dateOfBirth);
    expect(encrypted.category).not.toBe(rawData.category);
    expect(encrypted.domicileState).not.toBe(rawData.domicileState);

    // Non-sensitive fields stay untouched
    expect(encrypted.qualification).toBe("B.Tech");

    const decrypted = decryptProfileFields(encrypted);
    expect(decrypted.dateOfBirth).toBe(rawData.dateOfBirth);
    expect(decrypted.category).toBe(rawData.category);
    expect(decrypted.domicileState).toBe(rawData.domicileState);
    expect(decrypted.qualification).toBe("B.Tech");
  });

  describe("Database Storage Verification", () => {
    const testEmail = `crypto-test-${Date.now()}@example.com`;
    let createdUserId: string;

    beforeAll(async () => {
      const [u] = await db
        .insert(users)
        .values({
          email: testEmail,
          passwordHash: "dummy-hash",
        })
        .returning();
      createdUserId = u!.id;
    });

    afterAll(async () => {
      if (createdUserId) {
        await db.delete(users).where(eq(users.id, createdUserId));
      }
    });

    it("stores encrypted ciphertext in Postgres and allows decryption on read", async () => {
      const sensitiveProfile = {
        userId: createdUserId,
        dateOfBirth: "2000-01-01",
        category: "ST",
        domicileState: "Madhya Pradesh",
        qualification: "Graduate",
        preference: "both" as const,
      };

      const encryptedPayload = encryptProfileFields(sensitiveProfile);

      // Insert directly into DB
      await db.insert(profiles).values(encryptedPayload);

      // Query raw database row
      const [rawRow] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.userId, createdUserId))
        .limit(1);

      expect(rawRow).toBeDefined();

      // Verify that raw database columns contain ciphertext, NOT plaintext
      expect(rawRow!.dateOfBirth).not.toBe("2000-01-01");
      expect(rawRow!.dateOfBirth).toContain(":"); // iv:tag:data
      expect(rawRow!.category).not.toBe("ST");
      expect(rawRow!.domicileState).not.toBe("Madhya Pradesh");

      // Verify decryption restores original values
      const decrypted = decryptProfileFields(rawRow!);
      expect(decrypted.dateOfBirth).toBe("2000-01-01");
      expect(decrypted.category).toBe("ST");
      expect(decrypted.domicileState).toBe("Madhya Pradesh");
    });
  });
});
