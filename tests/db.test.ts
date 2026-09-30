import { describe, it, expect } from "vitest";

import { env } from "@/lib/env";
import { db } from "@/db";
import { sql } from "drizzle-orm";

describe("Database Connectivity", () => {
  it("executes a trivial query to Neon Postgres via Drizzle client", async () => {
    expect(env.DATABASE_URL).toBeDefined();
    const result = await db.execute(sql`SELECT 1 as connected`);
    expect(result.rows[0]?.connected).toBe(1);
  });
});
