import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  GET as getAdminNotifications,
  POST as postAdminNotification,
} from "@/app/api/v1/admin/notifications/route";
import {
  GET as getOpportunityDetail,
  PUT as putOpportunity,
  DELETE as deleteOpportunity,
} from "@/app/api/v1/admin/notifications/[id]/route";
import { GET as getPublicOpportunities } from "@/app/api/v1/opportunities/route";

const adminUser = {
  id: "00000000-0000-4000-a000-000000000001",
  email: "admin@jobsetu.mp.gov.in",
  isAdmin: true,
};

const regularUser = {
  id: "00000000-0000-4000-a000-000000000002",
  email: "student@test.com",
  isAdmin: false,
};

let currentSession: {
  user?: { id: string; email: string; isAdmin: boolean };
} | null = null;

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => currentSession),
}));

describe("Admin Notifications Ingestion & Review API (M5 T2)", () => {
  beforeEach(async () => {
    // Seed users in db
    await db
      .insert(users)
      .values([
        {
          id: adminUser.id,
          email: adminUser.email,
          passwordHash: "hash-admin",
          isAdmin: true,
        },
        {
          id: regularUser.id,
          email: regularUser.email,
          passwordHash: "hash-student",
          isAdmin: false,
        },
      ])
      .onConflictDoNothing();
  });

  it("rejects unauthenticated requests with 401", async () => {
    currentSession = null;
    const res = await getAdminNotifications();
    expect(res.status).toBe(401);
  });

  it("rejects non-admin users with 403", async () => {
    currentSession = { user: regularUser };
    const res = await getAdminNotifications();
    expect(res.status).toBe(403);
  });

  it("allows admin to ingest notification as draft, keeping it isolated from public opportunities until published", async () => {
    currentSession = { user: adminUser };

    const sampleText = `
      MADHYA PRADESH REVENUE DEPARTMENT
      Recruitment Notice for Patwari 2026
      Department: Revenue Department, MP
      Deadline: 2026-12-31

      Criteria:
      Clause 2.1: Candidates must be between 18 and 40 years of age.
      Clause 3.1: Candidate must hold a recognized Bachelor's Degree.
      Clause 4.1: Must possess MP Domicile Certificate.
    `;

    // 1. Ingest via admin API
    const postReq = new Request(
      "http://localhost:3000/api/v1/admin/notifications",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: sampleText,
          title: "MP Patwari Examination 2026",
          department: "Revenue Department, MP",
        }),
      },
    );

    const postRes = await postAdminNotification(postReq);
    expect(postRes.status).toBe(201);
    const postJson = await postRes.json();

    expect(postJson.success).toBe(true);
    expect(postJson.opportunity.status).toBe("draft");
    const oppId = postJson.opportunity.id;

    // 2. Draft Isolation Check (SPEC.md 7.3): Public opportunities must NOT include drafts
    const publicReq = new Request("http://localhost:3000/api/v1/opportunities");
    const publicRes = await getPublicOpportunities(publicReq);
    const publicJson = await publicRes.json();
    const foundInPublic = publicJson.opportunities.find(
      (o: { id: string }) => o.id === oppId,
    );
    expect(foundInPublic).toBeUndefined();

    // 3. Admin can inspect draft opportunity
    const detailRes = await getOpportunityDetail(
      new Request("http://localhost"),
      {
        params: Promise.resolve({ id: oppId }),
      },
    );
    expect(detailRes.status).toBe(200);

    // 4. Admin publishes opportunity to 'live'
    const publishReq = new Request(
      `http://localhost:3000/api/v1/admin/notifications/${oppId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "live" }),
      },
    );
    const publishRes = await putOpportunity(publishReq, {
      params: Promise.resolve({ id: oppId }),
    });
    expect(publishRes.status).toBe(200);
    const publishJson = await publishRes.json();
    expect(publishJson.opportunity.status).toBe("live");

    // 5. Now public opportunities includes it
    const publicAfterRes = await getPublicOpportunities(publicReq);
    const publicAfterJson = await publicAfterRes.json();
    const liveFound = publicAfterJson.opportunities.find(
      (o: { id: string }) => o.id === oppId,
    );
    expect(liveFound).toBeDefined();
    expect(liveFound.status).toBe("live");

    // Clean up
    await deleteOpportunity(new Request("http://localhost"), {
      params: Promise.resolve({ id: oppId }),
    });
  }, 35000); // 35s timeout for live AI extraction
});
