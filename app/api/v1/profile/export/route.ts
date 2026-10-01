import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  users,
  profiles,
  skills,
  targets,
  consents,
  experiences,
} from "@/db/schema";
import { withUserOnly } from "@/lib/db/scope";
import { decryptProfileFields } from "@/lib/crypto/encryption";

/**
 * Data Subject Access Right (GDPR/DPDP export) per SPEC.md 9.4.
 * Returns the user's complete data export with sensitive fields decrypted.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [
    userRows,
    profileRows,
    userSkills,
    userTargets,
    userConsents,
    userExperiences,
  ] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),

    db.select().from(profiles).where(withUserOnly(profiles, userId)).limit(1),

    db.select().from(skills).where(withUserOnly(skills, userId)),

    db.select().from(targets).where(withUserOnly(targets, userId)),

    db.select().from(consents).where(withUserOnly(consents, userId)),

    db.select().from(experiences).where(withUserOnly(experiences, userId)),
  ]);

  const user = userRows[0];
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const rawProfile = profileRows[0];
  const profile = rawProfile ? decryptProfileFields(rawProfile) : null;

  return NextResponse.json({
    user,
    profile,
    skills: userSkills,
    targets: userTargets,
    consents: userConsents,
    experiences: userExperiences,
    exportedAt: new Date().toISOString(),
  });
}
