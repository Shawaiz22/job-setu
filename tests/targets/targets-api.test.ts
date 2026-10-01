import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, targets } from "@/db/schema";
import {
  GET as getTargets,
  POST as postTarget,
} from "@/app/api/v1/targets/route";
import { DELETE as deleteTarget } from "@/app/api/v1/targets/[id]/route";
import { GET as getOpportunities } from "@/app/api/v1/opportunities/route";

let mockUserId: string | null = null;

vi.mock("@/auth", () => ({
  auth: vi.fn(async () =>
    mockUserId
      ? { user: { id: mockUserId, email: "targets-test@example.com" } }
      : null,
  ),
}));

describe("Targets & Opportunities CRUD API (M4 T1)", () => {
  let userA: string;
  let userB: string;
  let targetAId: string;

  beforeAll(async () => {
    const [uA] = await db
      .insert(users)
      .values({ email: `user-a-${Date.now()}@test.com`, passwordHash: "h" })
      .returning();
    const [uB] = await db
      .insert(users)
      .values({ email: `user-b-${Date.now()}@test.com`, passwordHash: "h" })
      .returning();

    userA = uA!.id;
    userB = uB!.id;
  });

  afterAll(async () => {
    if (userA) await db.delete(users).where(eq(users.id, userA));
    if (userB) await db.delete(users).where(eq(users.id, userB));
  });

  it("requires authentication for targets list", async () => {
    mockUserId = null;
    const res = await getTargets();
    expect(res.status).toBe(401);
  });

  it("creates a new target for user A", async () => {
    mockUserId = userA;
    const req = new Request("http://localhost:3000/api/v1/targets", {
      method: "POST",
      body: JSON.stringify({
        kind: "govt_post",
        sourceId: "mppsc-test-source-1",
        title: "MPPSC Test Post",
      }),
    });

    const res = await postTarget(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.target.title).toBe("MPPSC Test Post");
    targetAId = json.target.id;
  });

  it("lists targets for user A with scoping", async () => {
    mockUserId = userA;
    const res = await getTargets();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.targets).toHaveLength(1);
    expect(json.targets[0].id).toBe(targetAId);

    // User B should have 0 targets
    mockUserId = userB;
    const resB = await getTargets();
    const jsonB = await resB.json();
    expect(jsonB.targets).toHaveLength(0);
  });

  it("prevents user B from deleting user A's target (returns 404)", async () => {
    mockUserId = userB;
    const req = new Request(
      `http://localhost:3000/api/v1/targets/${targetAId}`,
      {
        method: "DELETE",
      },
    );
    const res = await deleteTarget(req, {
      params: Promise.resolve({ id: targetAId }),
    });

    expect(res.status).toBe(404);

    // Target still exists
    const [t] = await db
      .select()
      .from(targets)
      .where(eq(targets.id, targetAId));
    expect(t).toBeDefined();
  });

  it("allows user A to delete their own target", async () => {
    mockUserId = userA;
    const req = new Request(
      `http://localhost:3000/api/v1/targets/${targetAId}`,
      {
        method: "DELETE",
      },
    );
    const res = await deleteTarget(req, {
      params: Promise.resolve({ id: targetAId }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);

    const [t] = await db
      .select()
      .from(targets)
      .where(eq(targets.id, targetAId));
    expect(t).toBeUndefined();
  });

  it("browses available opportunities via GET /api/v1/opportunities", async () => {
    const req = new Request("http://localhost:3000/api/v1/opportunities");
    const res = await getOpportunities(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.opportunities.length).toBeGreaterThanOrEqual(1);
    expect(json.archetypes.length).toBeGreaterThanOrEqual(1);
  });
});
