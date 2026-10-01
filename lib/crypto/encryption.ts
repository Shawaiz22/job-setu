import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { env } from "@/lib/env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 12 bytes is standard for GCM

function getEncryptionKey(): Buffer {
  const secret = env.ENCRYPTION_KEY || env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "Missing encryption secret: Please configure ENCRYPTION_KEY or AUTH_SECRET in your environment.",
    );
  }
  // Deterministically derive a 32-byte (256-bit) key
  return createHash("sha256").update(secret).digest();
}

/**
 * Encrypts plaintext string using AES-256-GCM authenticated encryption.
 * Output format: `ivHex:authTagHex:ciphertextHex`
 */
export function encrypt(plaintext: string): string {
  if (typeof plaintext !== "string") {
    throw new TypeError("Plaintext must be a string");
  }

  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts AES-256-GCM ciphertext in `ivHex:authTagHex:ciphertextHex` format.
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext || typeof ciphertext !== "string") {
    throw new TypeError("Ciphertext must be a non-empty string");
  }

  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid ciphertext format: expected iv:tag:data");
  }

  const [ivHex, tagHex, dataHex] = parts as [string, string, string];
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(tagHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(dataHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export type SensitiveProfileData = {
  dateOfBirth: string;
  category: string;
  domicileState: string;
};

/**
 * Encrypts sensitive profile attributes at rest before writing to database.
 */
export function encryptProfileFields<T extends SensitiveProfileData>(
  data: T,
): T {
  return {
    ...data,
    dateOfBirth: encrypt(data.dateOfBirth),
    category: encrypt(data.category),
    domicileState: encrypt(data.domicileState),
  };
}

/**
 * Decrypts sensitive profile attributes after reading from database.
 */
export function decryptProfileFields<T extends SensitiveProfileData>(
  data: T,
): T {
  return {
    ...data,
    dateOfBirth: decrypt(data.dateOfBirth),
    category: decrypt(data.category),
    domicileState: decrypt(data.domicileState),
  };
}
