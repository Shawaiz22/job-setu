import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { skills } from "@/db/schema";
import { withUserOnly } from "@/lib/db/scope";
import {
  skillCreateSchema,
  skillDeleteSchema,
} from "@/lib/validations/profile";

/** Retrieves all skills declared by the authenticated candidate. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userSkills = await db
      .select()
      .from(skills)
      .where(withUserOnly(skills, session.user.id))
      .orderBy(desc(skills.createdAt));

    return NextResponse.json({ skills: userSkills });
  } catch (error) {
    console.error("Failed to fetch skills:", error);
    return NextResponse.json(
      { error: "Failed to retrieve skills" },
      { status: 500 },
    );
  }
}

/** Adds a new skill to the authenticated candidate's profile. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = skillCreateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const { name, evidence } = parsed.data;

    // Check for duplicate skill name for this user
    const existing = await db
      .select()
      .from(skills)
      .where(and(eq(skills.userId, session.user.id), eq(skills.name, name)))
      .limit(1);

    if (existing.length > 0 && existing[0]) {
      // Update evidence if already present
      const [updated] = await db
        .update(skills)
        .set({ evidence })
        .where(eq(skills.id, existing[0].id))
        .returning();

      return NextResponse.json({ skill: updated, updated: true });
    }

    const [created] = await db
      .insert(skills)
      .values({
        userId: session.user.id,
        name,
        evidence,
      })
      .returning();

    return NextResponse.json({ skill: created }, { status: 201 });
  } catch (error) {
    console.error("Failed to add skill:", error);
    return NextResponse.json({ error: "Failed to add skill" }, { status: 500 });
  }
}

/** Deletes a skill by ID for the authenticated candidate. */
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const idFromQuery = url.searchParams.get("id");
    let skillId = idFromQuery;

    if (!skillId) {
      try {
        const body = await request.json();
        skillId = body.skillId;
      } catch {
        // No body provided
      }
    }

    const parsed = skillDeleteSchema.safeParse({ skillId });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid skill ID", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const [deleted] = await db
      .delete(skills)
      .where(
        and(
          eq(skills.id, parsed.data.skillId),
          eq(skills.userId, session.user.id),
        ),
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: deleted.id });
  } catch (error) {
    console.error("Failed to delete skill:", error);
    return NextResponse.json(
      { error: "Failed to delete skill" },
      { status: 500 },
    );
  }
}
