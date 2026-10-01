import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { targets } from "@/db/schema";
import { withUserOnly } from "@/lib/db/scope";

const uuidSchema = z.string().uuid("Invalid target ID format");

/**
 * Retrieves a single target for the authenticated user.
 */
export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await props.params;
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) {
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
  }

  const [target] = await db
    .select()
    .from(targets)
    .where(and(eq(targets.id, id), withUserOnly(targets, session.user.id)))
    .limit(1);

  if (!target) {
    return NextResponse.json({ error: "Target not found" }, { status: 404 });
  }

  return NextResponse.json({ target });
}

/**
 * Removes a target from the user's workspace.
 */
export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await props.params;
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) {
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
  }

  const deleted = await db
    .delete(targets)
    .where(and(eq(targets.id, id), withUserOnly(targets, session.user.id)))
    .returning();

  if (deleted.length === 0) {
    return NextResponse.json({ error: "Target not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: "Target removed successfully",
  });
}
