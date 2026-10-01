import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  CONSENT_PURPOSES,
  grantConsent,
  getUserConsents,
  ConsentPurpose,
} from "@/lib/consent";

const postConsentSchema = z.object({
  purpose: z.enum(CONSENT_PURPOSES),
  version: z.string().min(1).optional(),
});

/**
 * Retrieves the authenticated user's consent records.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userConsents = await getUserConsents(session.user.id);
  const activeMap: Record<string, boolean> = {};

  for (const purpose of CONSENT_PURPOSES) {
    const active = userConsents.some(
      (c) => c.purpose === purpose && c.revokedAt === null,
    );
    activeMap[purpose] = active;
  }

  return NextResponse.json({
    consents: userConsents,
    active: activeMap,
  });
}

/**
 * Grants or updates versioned consent for a specific purpose.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = postConsentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const { purpose, version } = parsed.data;
    const consent = await grantConsent(
      session.user.id,
      purpose as ConsentPurpose,
      version,
    );

    return NextResponse.json({
      success: true,
      consent,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
