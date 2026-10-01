import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { consents, experiences, profiles, skills, targets } from "@/db/schema";
import { withUserOnly } from "@/lib/db/scope";
import { profileUpsertSchema } from "@/lib/validations/profile";

/** Retrieves the current authenticated user's profile. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(withUserOnly(profiles, session.user.id))
    .limit(1);

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ profile });
}

/** Creates or updates the authenticated user's profile. */
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = profileUpsertSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const { dateOfBirth, category, domicileState, qualification, preference } =
      parsed.data;

    const [upserted] = await db
      .insert(profiles)
      .values({
        userId: session.user.id,
        dateOfBirth,
        category,
        domicileState,
        qualification,
        preference,
      })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          dateOfBirth,
          category,
          domicileState,
          qualification,
          preference,
          updatedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json({ success: true, profile: upserted });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/** Cascades deletion of all user data per SPEC.md 8 & 9.5. */
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  await Promise.all([
    db.delete(profiles).where(eq(profiles.userId, userId)),
    db.delete(skills).where(eq(skills.userId, userId)),
    db.delete(targets).where(eq(targets.userId, userId)),
    db.delete(consents).where(eq(consents.userId, userId)),
    db.delete(experiences).where(eq(experiences.userId, userId)),
  ]);

  return NextResponse.json({
    success: true,
    message: "User profile and associated data deleted",
  });
}
