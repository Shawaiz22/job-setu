import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { opportunities, users } from "@/db/schema";
import { RequirementArraySchema } from "@/modules/eligibility/types";

const uuidSchema = z.string().uuid();

const updateOpportunitySchema = z.object({
  title: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  status: z.enum(["draft", "live"]).optional(),
  closesOn: z.string().nullable().optional(),
  requirements: RequirementArraySchema.optional(),
});

async function verifyAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (session.user.isAdmin) {
    return { userId: session.user.id };
  }

  const [dbUser] = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!dbUser?.isAdmin) {
    return {
      response: NextResponse.json(
        { error: "Forbidden: Admin required" },
        { status: 403 },
      ),
    };
  }

  return { userId: session.user.id };
}

/**
 * Returns single opportunity details for admin review.
 */
export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const authCheck = await verifyAdmin();
  if (authCheck.response) return authCheck.response;

  const { id } = await props.params;
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) {
    return NextResponse.json(
      { error: "Invalid opportunity ID" },
      { status: 400 },
    );
  }

  const [opp] = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.id, id))
    .limit(1);

  if (!opp) {
    return NextResponse.json(
      { error: "Opportunity not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ opportunity: opp });
}

/**
 * Updates an opportunity and publishes it to "live".
 * SPEC.md 7.3: Once reviewed, admin publishes to status "live".
 */
export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const authCheck = await verifyAdmin();
  if (authCheck.response) return authCheck.response;

  const { id } = await props.params;
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) {
    return NextResponse.json(
      { error: "Invalid opportunity ID" },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();
    const parsed = updateOpportunitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const updates: Partial<typeof opportunities.$inferInsert> = {};
    if (parsed.data.title !== undefined) updates.title = parsed.data.title;
    if (parsed.data.department !== undefined)
      updates.department = parsed.data.department;
    if (parsed.data.state !== undefined) updates.state = parsed.data.state;
    if (parsed.data.status !== undefined) updates.status = parsed.data.status;
    if (parsed.data.closesOn !== undefined) {
      updates.closesOn = parsed.data.closesOn
        ? new Date(parsed.data.closesOn)
        : null;
    }
    if (parsed.data.requirements !== undefined) {
      updates.requirements = parsed.data.requirements;
    }

    const [updated] = await db
      .update(opportunities)
      .set(updates)
      .where(eq(opportunities.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, opportunity: updated });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Deletes an opportunity.
 */
export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const authCheck = await verifyAdmin();
  if (authCheck.response) return authCheck.response;

  const { id } = await props.params;
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) {
    return NextResponse.json(
      { error: "Invalid opportunity ID" },
      { status: 400 },
    );
  }

  const deleted = await db
    .delete(opportunities)
    .where(eq(opportunities.id, id))
    .returning();

  if (deleted.length === 0) {
    return NextResponse.json(
      { error: "Opportunity not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true, message: "Opportunity deleted" });
}
