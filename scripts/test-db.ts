import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ No DATABASE_URL found in .env.local");
    process.exit(1);
  }

  console.log("📡 Connecting to Neon Postgres...");
  const sql = neon(url);
  const result = await sql`
    SELECT 
      current_database() as database, 
      current_user as user, 
      version() as pg_version,
      now() as server_time;
  `;

  console.log("✅ Live connection successful!");
  console.log("Database Name:", result[0]?.database);
  console.log("Connected User:", result[0]?.user);
  console.log("Server Time:", result[0]?.server_time);
  console.log("PostgreSQL Version:", result[0]?.pg_version);
}

main().catch((err) => {
  console.error("❌ Connection failed:", err);
  process.exit(1);
});
