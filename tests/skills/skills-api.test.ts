import type { Session } from "next-auth";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  GET as skillsGetHandler,
  POST as skillsPostHandler,
  DELETE as skillsDeleteHandler,
} from "@/app/api/v1/profile/skills/route";

const testUserA = {
  id: "660e8400-e29b-41d4-a716-446655449901",
  email: `test-skills-a-${Date.now()}@example.com`,
  passwordHash: "hash",
};

const testUserB = {
  id: "660e8400-e29b-41d4-a716-446655449902",
  email: `test-skills-b-${Date.now()}@example.com`,
  passwordHash: "hash",
};

const mockedAuth = vi.fn<() => Promise<Session | null>>();

vi.mock("@/auth", () => ({
  auth: () => mockedAuth(),
}));

describe("Candidate Skills API (/api/v1/profile/skills)", () => {
  beforeAll(async () => {
    await db
      .insert(users)
      .values([
        {
          id: testUserA.id,
          email: testUserA.email,
          passwordHash: testUserA.passwordHash,
        },
        {
          id: testUserB.id,
          email: testUserB.email,
          passwordHash: testUserB.passwordHash,
        },
      ])
      .onConflictDoNothing();
  });

  afterAll(async () => {
    await db.delete(users).where(eq(users.id, testUserA.id));
    await db.delete(users).where(eq(users.id, testUserB.id));
  });

  it("rejects unauthenticated requests with 401", async () => {
    mockedAuth.mockResolvedValueOnce(null);
    const res = await skillsGetHandler();
    expect(res.status).toBe(401);
  });

  it("allows candidate to add a skill with evidence level", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: testUserA.id, email: testUserA.email, isAdmin: false },
      expires: "2099-01-01",
    });

    const req = new Request("http://localhost:3000/api/v1/profile/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Python", evidence: "project" }),
    });

    const res = await skillsPostHandler(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.skill.name).toBe("Python");
    expect(data.skill.evidence).toBe("project");
    expect(data.skill.userId).toBe(testUserA.id);
  });

  it("lists declared skills for candidate", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: testUserA.id, email: testUserA.email, isAdmin: false },
      expires: "2099-01-01",
    });

    const res = await skillsGetHandler();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.skills)).toBe(true);
    expect(data.skills.some((s: { name: string }) => s.name === "Python")).toBe(
      true,
    );
  });

  it("prevents user B from deleting user A's skill (tenant isolation)", async () => {
    // Get skill ID from user A
    mockedAuth.mockResolvedValue({
      user: { id: testUserA.id, email: testUserA.email, isAdmin: false },
      expires: "2099-01-01",
    });
    const listRes = await skillsGetHandler();
    const listData = await listRes.json();
    const skillA = listData.skills.find(
      (s: { name: string }) => s.name === "Python",
    );
    expect(skillA).toBeDefined();

    // User B attempts to delete User A's skill
    mockedAuth.mockResolvedValue({
      user: { id: testUserB.id, email: testUserB.email, isAdmin: false },
      expires: "2099-01-01",
    });
    const delReq = new Request(
      `http://localhost:3000/api/v1/profile/skills?id=${skillA.id}`,
      { method: "DELETE" },
    );
    const delRes = await skillsDeleteHandler(delReq);
    expect(delRes.status).toBe(404);
  });

  it("allows user A to delete their own skill", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: testUserA.id, email: testUserA.email, isAdmin: false },
      expires: "2099-01-01",
    });
    const listRes = await skillsGetHandler();
    const listData = await listRes.json();
    const skillA = listData.skills.find(
      (s: { name: string }) => s.name === "Python",
    );

    const delReq = new Request(
      `http://localhost:3000/api/v1/profile/skills?id=${skillA.id}`,
      { method: "DELETE" },
    );
    const delRes = await skillsDeleteHandler(delReq);
    expect(delRes.status).toBe(200);
  });
});
