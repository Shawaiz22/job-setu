import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("Password Hashing & Verification (lib/auth/password)", () => {
  it("generates a salt-delimited hash string", async () => {
    const hash = await hashPassword("superSecretP@ssword123");
    expect(hash).toContain(":");

    const [salt, key] = hash.split(":");
    expect(salt).toHaveLength(32); // 16 bytes in hex
    expect(key).toHaveLength(128); // 64 bytes in hex
  });

  it("produces distinct hashes for the same password due to random salting", async () => {
    const password = "myConsistentPassword999";
    const hashA = await hashPassword(password);
    const hashB = await hashPassword(password);

    expect(hashA).not.toEqual(hashB);
  });

  it("verifies matching password correctly", async () => {
    const password = "validPasswordToTest#45";
    const hash = await hashPassword(password);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it("rejects incorrect passwords", async () => {
    const hash = await hashPassword("correctPassword1");
    const isValid = await verifyPassword("wrongPassword2", hash);

    expect(isValid).toBe(false);
  });

  it("safely rejects malformed or tampered hash strings", async () => {
    expect(await verifyPassword("password", "")).toBe(false);
    expect(await verifyPassword("password", "nosaltorhash")).toBe(false);
    expect(await verifyPassword("password", "bad:salt:extra")).toBe(false);
    expect(await verifyPassword("password", "short:hash")).toBe(false);
  });
});
