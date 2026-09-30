import { describe, it, expect } from "vitest";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

describe("Database Connectivity", () => {
  it("executes a trivial query to Neon Postgres", async () => {
    const dbUrl = process.env.DATABASE_URL;
    expect(dbUrl).toBeDefined();
    const sql = neon(dbUrl!);
    const result = await sql`SELECT 1 as connected`;
    expect(result[0]?.connected).toBe(1);
  });
});
