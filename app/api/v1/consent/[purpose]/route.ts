import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { CONSENT_PURPOSES, revokeConsent, ConsentPurpose } from "@/lib/consent";

/**
 * Revokes active consent for a specific purpose.
 */
export async function DELETE(
  _request: Request,
  props: { params: Promise<{ purpose: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { purpose } = await props.params;

  if (!CONSENT_PURPOSES.includes(purpose as ConsentPurpose)) {
    return NextResponse.json(
      { error: `Invalid consent purpose: ${purpose}` },
      { status: 400 },
    );
  }

  await revokeConsent(session.user.id, purpose as ConsentPurpose);

  return NextResponse.json({
    success: true,
    message: `Consent for ${purpose} has been revoked`,
  });
}
