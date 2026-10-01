import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { opportunities, users } from "@/db/schema";
import { extractTextFromPDF } from "@/modules/ingestion/pdf";
import { extractRequirementsFromText } from "@/modules/ingestion/extract";

const textPayloadSchema = z.object({
  text: z.string().min(10, "Text must be at least 10 characters"),
  kind: z.enum(["govt_post", "scheme", "job_description"]).default("govt_post"),
  title: z.string().optional(),
  department: z.string().optional(),
  state: z.string().default("Madhya Pradesh"),
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
 * Lists all draft and live opportunities for admin review.
 */
export async function GET() {
  const authCheck = await verifyAdmin();
  if (authCheck.response) return authCheck.response;

  const allOpportunities = await db
    .select()
    .from(opportunities)
    .orderBy(desc(opportunities.createdAt));

  return NextResponse.json({ opportunities: allOpportunities });
}

/**
 * Uploads a PDF or pastes text, runs extraction pipeline, and saves as draft.
 * SPEC.md 7.3: Extracted opportunities are strictly saved with status "draft".
 */
export async function POST(request: Request) {
  const authCheck = await verifyAdmin();
  if (authCheck.response) return authCheck.response;

  const contentType = request.headers.get("content-type") || "";

  try {
    let rawText = "";
    let kind: "govt_post" | "scheme" = "govt_post";
    let documentId = `doc-${crypto.randomUUID().slice(0, 8)}`;
    let defaultTitle: string | undefined;
    let defaultDepartment: string | undefined;
    let defaultState = "Madhya Pradesh";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json(
          { error: "No file uploaded" },
          { status: 400 },
        );
      }

      documentId = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const arrayBuffer = await file.arrayBuffer();
      const pdfExtract = await extractTextFromPDF(arrayBuffer);
      rawText = pdfExtract.text;

      const formKind = formData.get("kind");
      if (formKind === "scheme") kind = "scheme";
      defaultTitle =
        (formData.get("title") as string) || file.name.replace(/\.[^/.]+$/, "");
      defaultDepartment =
        (formData.get("department") as string) ||
        "Government of Madhya Pradesh";
    } else {
      const body = await request.json();
      const parsed = textPayloadSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", issues: parsed.error.issues },
          { status: 400 },
        );
      }

      rawText = parsed.data.text;
      if (parsed.data.kind === "scheme") kind = "scheme";
      defaultTitle = parsed.data.title;
      defaultDepartment = parsed.data.department;
      defaultState = parsed.data.state;
    }

    if (!rawText.trim()) {
      return NextResponse.json(
        { error: "Could not extract readable text from document" },
        { status: 400 },
      );
    }

    // Run deterministic extraction with Gemini and clause enforcement
    const extracted = await extractRequirementsFromText({
      text: rawText,
      sourceType: kind === "scheme" ? "scheme" : "notification",
      documentId,
      defaultTitle,
      defaultDepartment,
      defaultState,
    });

    // Store strictly with status "draft" (SPEC.md 7.3)
    const [inserted] = await db
      .insert(opportunities)
      .values({
        kind,
        title: extracted.title,
        department: extracted.department,
        state: extracted.state,
        closesOn: extracted.closesOn ? new Date(extracted.closesOn) : null,
        requirements: extracted.requirements,
        sourceDocumentPath: documentId,
        status: "draft",
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        opportunity: inserted,
        extracted: {
          requirementsCount: extracted.requirements.length,
          droppedCount: extracted.droppedCount,
        },
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "AI provider extraction failed. Check provider availability.",
      },
      { status: 503 },
    );
  }
}
