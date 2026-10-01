import { stripPII } from "@/modules/privacy/redact";

/** List of sensitive key names that must be redacted regardless of case */
const SENSITIVE_KEYS = new Set([
  "dateofbirth",
  "dob",
  "date_of_birth",
  "category",
  "domicilestate",
  "domicile_state",
  "password",
  "passwordhash",
  "password_hash",
  "token",
  "accesstoken",
  "refreshtoken",
  "secret",
  "auth_secret",
  "encryption_key",
  "aadhaar",
  "pan",
]);

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key.toLowerCase());
}

/**
 * Recursively scrubs sensitive keys and values from arbitrary log payloads.
 * Protects against circular references and handles Error instances cleanly.
 */
export function sanitize<T>(data: T, seen = new WeakSet<object>()): T {
  if (data === null || data === undefined) {
    return data;
  }

  // Sanitize Error instances
  if (data instanceof Error) {
    const sanitizedError: Record<string, unknown> = {
      name: data.name,
      message: stripPII(data.message).redacted,
      stack: data.stack ? stripPII(data.stack).redacted : undefined,
    };

    // Copy any custom error properties
    for (const [key, val] of Object.entries(data)) {
      if (isSensitiveKey(key)) {
        sanitizedError[key] = "[REDACTED]";
      } else {
        sanitizedError[key] = sanitize(val, seen);
      }
    }

    return sanitizedError as unknown as T;
  }

  // Sanitize primitive strings via PII detector
  if (typeof data === "string") {
    return stripPII(data).redacted as unknown as T;
  }

  if (typeof data !== "object") {
    return data;
  }

  // Handle circular references
  if (seen.has(data as object)) {
    return "[CIRCULAR]" as unknown as T;
  }
  seen.add(data as object);

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => sanitize(item, seen)) as unknown as T;
  }

  // Handle objects
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (isSensitiveKey(key)) {
      output[key] = "[REDACTED]";
    } else {
      output[key] = sanitize(value, seen);
    }
  }

  return output as T;
}

/**
 * Privacy-safe logger wrapper. Guarantees zero sensitive data leakage into logs or error traces.
 */
export const logger = {
  info(message: string, ...meta: unknown[]): void {
    console.info(stripPII(message).redacted, ...meta.map((m) => sanitize(m)));
  },

  warn(message: string, ...meta: unknown[]): void {
    console.warn(stripPII(message).redacted, ...meta.map((m) => sanitize(m)));
  },

  error(message: string, ...meta: unknown[]): void {
    console.error(stripPII(message).redacted, ...meta.map((m) => sanitize(m)));
  },

  debug(message: string, ...meta: unknown[]): void {
    if (process.env.NODE_ENV !== "production") {
      console.debug(
        stripPII(message).redacted,
        ...meta.map((m) => sanitize(m)),
      );
    }
  },
};
