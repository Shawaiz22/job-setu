import type { Session } from "next-auth";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, users } from "@/db/schema";
import { POST as registerHandler } from "@/app/api/v1/auth/register/route";
import {
  DELETE as profileDeleteHandler,
  GET as profileGetHandler,
  PUT as profilePutHandler,
} from "@/app/api/v1/profile/route";

const testUser = {
  id: "660e8400-e29b-41d4-a716-446655440001",
  email: `test-api-${Date.now()}@example.com`,
  password: "StrongPassword123!",
};

const mockSession: Session = {
  user: { id: testUser.id, email: testUser.email, isAdmin: false },
  expires: "2099-01-01",
};

const mockedAuth = vi.fn<() => Promise<Session | null>>();

vi.mock("@/auth", () => ({
  auth: () => mockedAuth(),
}));

describe("Registration and Profile API Endpoints", () => {
  beforeAll(async () => {
    await db.delete(users).where(eq(users.email, testUser.email));
  });

  afterAll(async () => {
    await db.delete(users).where(eq(users.email, testUser.email));
  });

  it("POST /api/v1/auth/register validates payload and rejects invalid inputs", async () => {
    const res = await registerHandler(
      new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "invalid-email", password: "short" }),
      }),
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Validation failed");
    expect(data.issues).toBeDefined();
  });

  it("POST /api/v1/auth/register creates a new user successfully", async () => {
    const res = await registerHandler(
      new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      }),
    );

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.email).toBe(testUser.email.toLowerCase());
    expect(data.user.id).toBeDefined();

    testUser.id = data.user.id;
    mockSession.user.id = data.user.id;
  });

  it("POST /api/v1/auth/register prevents duplicate email registrations", async () => {
    const res = await registerHandler(
      new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      }),
    );

    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toBe("Email already registered");
  });

  it("GET /api/v1/profile rejects unauthenticated requests with 401", async () => {
    mockedAuth.mockResolvedValueOnce(null);

    const res = await profileGetHandler();
    expect(res.status).toBe(401);
  });

  it("GET /api/v1/profile returns 404 if profile does not exist yet", async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);

    const res = await profileGetHandler();
    expect(res.status).toBe(404);
  });

  it("PUT /api/v1/profile validates input and upserts profile data", async () => {
    mockedAuth.mockResolvedValue(mockSession);

    const badRes = await profilePutHandler(
      new Request("http://localhost/api/v1/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "",
        }),
      }),
    );
    expect(badRes.status).toBe(400);

    const validPayload = {
      dateOfBirth: "2000-01-15",
      category: "OBC",
      domicileState: "Madhya Pradesh",
      qualification: "B.Tech Computer Science",
      preference: "govt" as const,
    };

    const goodRes = await profilePutHandler(
      new Request("http://localhost/api/v1/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validPayload),
      }),
    );

    expect(goodRes.status).toBe(200);
    const data = await goodRes.json();
    expect(data.success).toBe(true);
    expect(data.profile.qualification).toBe(validPayload.qualification);
    expect(data.profile.userId).toBe(testUser.id);
  });

  it("GET /api/v1/profile retrieves the newly saved profile", async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);

    const res = await profileGetHandler();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.profile.userId).toBe(testUser.id);
    expect(data.profile.category).toBe("OBC");
  });

  it("DELETE /api/v1/profile deletes user profile data", async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);

    const res = await profileDeleteHandler();
    expect(res.status).toBe(200);

    const [deletedProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, testUser.id));

    expect(deletedProfile).toBeUndefined();
  });
});
