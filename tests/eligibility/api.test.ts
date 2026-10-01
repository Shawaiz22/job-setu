import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, profiles, targets, opportunities } from "@/db/schema";
import { grantConsent, revokeConsent } from "@/lib/consent";
import { encryptProfileFields } from "@/lib/crypto/encryption";
import { GET } from "@/app/api/v1/targets/[id]/evaluation/route";
import { SEED_OPPORTUNITIES } from "@/modules/seed/eligibility";

let mockSessionUserId: string | null = null;

vi.mock("@/auth", () => ({
  auth: vi.fn(async () =>
    mockSessionUserId
      ? { user: { id: mockSessionUserId, email: "eval-test@example.com" } }
      : null,
  ),
}));

describe("Target Evaluation API Endpoint (M3 T5)", () => {
  let testUserId: string;
  let targetId: string;
  let oppId: string;

  beforeAll(async () => {
    // 1. Create test user
    const [u] = await db
      .insert(users)
      .values({
        email: `eval-api-${Date.now()}@example.com`,
        passwordHash: "dummy-hash",
      })
      .returning();
    testUserId = u!.id;

    // 2. Create profile: 24-year-old OBC candidate with B.Tech
    const encProfile = encryptProfileFields({
      userId: testUserId,
      dateOfBirth: "2000-01-01",
      category: "OBC",
      domicileState: "Madhya Pradesh",
      qualification: "b.tech",
      preference: "both" as const,
    });
    await db.insert(profiles).values(encProfile);

    // 3. Create opportunity (MPPSC)
    const [opp] = await db
      .insert(opportunities)
      .values({
        kind: "govt_post",
        title: `MPPSC Evaluation Test Opportunity ${Date.now()}`,
        department: "MPPSC",
        state: "Madhya Pradesh",
        status: "live",
        requirements: SEED_OPPORTUNITIES[0]!.requirements,
      })
      .returning();
    oppId = opp!.id;

    // 4. Create target pointing to opportunity
    const [t] = await db
      .insert(targets)
      .values({
        userId: testUserId,
        kind: "govt_post",
        sourceId: oppId,
        title: opp!.title,
      })
      .returning();
    targetId = t!.id;
  });

  afterAll(async () => {
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
    if (oppId) {
      await db.delete(opportunities).where(eq(opportunities.id, oppId));
    }
  });

  it("returns 401 when session is not authenticated", async () => {
    mockSessionUserId = null;
    const req = new Request(
      "http://localhost:3000/api/v1/targets/123/evaluation",
    );
    const res = await GET(req, { params: Promise.resolve({ id: targetId }) });

    expect(res.status).toBe(401);
  });

  it("returns 400 when target ID is not a valid UUID", async () => {
    mockSessionUserId = testUserId;
    const req = new Request(
      "http://localhost:3000/api/v1/targets/not-a-uuid/evaluation",
    );
    const res = await GET(req, {
      params: Promise.resolve({ id: "not-a-uuid" }),
    });

    expect(res.status).toBe(400);
  });

  it("returns 403 when active consent for eligibility processing is missing", async () => {
    mockSessionUserId = testUserId;
    await revokeConsent(testUserId, "eligibility_processing");

    const req = new Request(
      `http://localhost:3000/api/v1/targets/${targetId}/evaluation`,
    );
    const res = await GET(req, { params: Promise.resolve({ id: targetId }) });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("Active consent");
  });

  it("evaluates target successfully and returns EvaluationResult when consent is granted", async () => {
    mockSessionUserId = testUserId;
    await grantConsent(testUserId, "eligibility_processing");

    const req = new Request(
      `http://localhost:3000/api/v1/targets/${targetId}/evaluation`,
    );
    const res = await GET(req, { params: Promise.resolve({ id: targetId }) });

    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.target.id).toBe(targetId);
    expect(json.evaluation).toBeDefined();
    // Candidate is 26, OBC, has B.Tech -> meets MPPSC criteria
    expect(json.evaluation.status).toBe("eligible");
    expect(json.evaluation.score).toBeGreaterThanOrEqual(0);
  });
});
