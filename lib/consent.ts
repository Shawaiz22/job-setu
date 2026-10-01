import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { consents } from "@/db/schema";
import { withUserOnly } from "@/lib/db/scope";

export const CONSENT_PURPOSES = [
  "eligibility_processing",
  "experience_publication",
  "notifications",
] as const;

export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number];

export const CURRENT_CONSENT_VERSIONS: Record<ConsentPurpose, string> = {
  eligibility_processing: "1.0",
  experience_publication: "1.0",
  notifications: "1.0",
};

/**
 * Grants or refreshes versioned consent for a specific purpose.
 */
export async function grantConsent(
  userId: string,
  purpose: ConsentPurpose,
  version = CURRENT_CONSENT_VERSIONS[purpose],
) {
  // First, revoke any previous active consents for this purpose
  await revokeConsent(userId, purpose);

  const [inserted] = await db
    .insert(consents)
    .values({
      userId,
      purpose,
      version,
      grantedAt: new Date(),
      revokedAt: null,
    })
    .returning();

  if (!inserted) {
    throw new Error("Failed to record consent");
  }

  return inserted;
}

/**
 * Immediately revokes active consent for a specific purpose by setting revokedAt timestamp.
 */
export async function revokeConsent(userId: string, purpose: ConsentPurpose) {
  return db
    .update(consents)
    .set({ revokedAt: new Date() })
    .where(
      and(
        withUserOnly(consents, userId),
        eq(consents.purpose, purpose),
        isNull(consents.revokedAt),
      ),
    );
}

/**
 * Verifies whether the user currently holds valid, unrevoked consent for the specified purpose.
 */
export async function hasActiveConsent(
  userId: string,
  purpose: ConsentPurpose,
  minVersion?: string,
): Promise<boolean> {
  const [record] = await db
    .select()
    .from(consents)
    .where(
      and(
        withUserOnly(consents, userId),
        eq(consents.purpose, purpose),
        isNull(consents.revokedAt),
      ),
    )
    .orderBy(desc(consents.grantedAt))
    .limit(1);

  if (!record) {
    return false;
  }

  if (minVersion && record.version !== minVersion) {
    return false;
  }

  return true;
}

/**
 * Retrieves all consent records for a user.
 */
export async function getUserConsents(userId: string) {
  return db
    .select()
    .from(consents)
    .where(withUserOnly(consents, userId))
    .orderBy(desc(consents.grantedAt));
}
