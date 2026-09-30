import { and, eq } from "drizzle-orm";
import type { Column } from "drizzle-orm";
import { z } from "zod";

const uuidSchema = z.uuid("Invalid UUID format");

export class InvalidUuidError extends Error {
  constructor(message = "Invalid UUID identifier") {
    super(message);
    this.name = "InvalidUuidError";
  }
}

/** Validates RFC 4122 UUID format, throwing InvalidUuidError if malformed. */
export function assertValidUuid(id: string, paramName = "id"): string {
  const result = uuidSchema.safeParse(id);
  if (!result.success) {
    throw new InvalidUuidError(
      `Invalid UUID for parameter '${paramName}': ${id}`,
    );
  }
  return result.data;
}

/** Checks if a string is a valid UUID without throwing. */
export function isValidUuid(id: string): boolean {
  return uuidSchema.safeParse(id).success;
}

/** Scopes a user-owned row by entity ID and user ID (SPEC.md 9.5). */
export function withUserScope<TTable extends { id: Column; userId: Column }>(
  table: TTable,
  id: string,
  userId: string,
) {
  const validId = assertValidUuid(id, "id");
  const validUserId = assertValidUuid(userId, "userId");

  return and(eq(table.id, validId), eq(table.userId, validUserId));
}

/** Scopes query to all rows owned by userId (SPEC.md 9.5). */
export function withUserOnly<TTable extends { userId: Column }>(
  table: TTable,
  userId: string,
) {
  const validUserId = assertValidUuid(userId, "userId");
  return eq(table.userId, validUserId);
}
