import { eq } from "drizzle-orm";
import { db } from "../db";
import {
  users,
  profiles,
  skills,
  consents,
  targets,
  opportunities,
  archetypes,
} from "../db/schema";
import { hashPassword } from "../lib/auth/password";
import { encryptProfileFields } from "../lib/crypto/encryption";

async function main() {
  console.log("🌱 Seeding realistic demo candidate into Kariyar Setu...");

  const demoEmail = "demo@kariyarsetu.in";
  const demoPassword = "DemoStudent123!";

  // 1. Create or fetch demo user
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, demoEmail))
    .limit(1);

  if (!user) {
    const passwordHash = await hashPassword(demoPassword);
    [user] = await db
      .insert(users)
      .values({
        email: demoEmail,
        passwordHash,
        isAdmin: false,
      })
      .returning();
    console.log(`  ✓ Created user: ${demoEmail}`);
  } else {
    console.log(`  ℹ Found existing user: ${demoEmail}`);
  }

  if (!user) {
    throw new Error("Failed to initialize user");
  }

  const userId = user.id;

  // 2. Encrypt & upsert candidate demographic profile
  const encrypted = encryptProfileFields({
    dateOfBirth: "2001-08-15", // 25 years old
    category: "OBC",
    domicileState: "Madhya Pradesh",
  });

  await db
    .insert(profiles)
    .values({
      userId,
      dateOfBirth: encrypted.dateOfBirth,
      category: encrypted.category,
      domicileState: encrypted.domicileState,
      qualification: "B.Tech - Computer Science",
      preference: "both",
    })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: {
        dateOfBirth: encrypted.dateOfBirth,
        category: encrypted.category,
        domicileState: encrypted.domicileState,
        qualification: "B.Tech - Computer Science",
        preference: "both",
        updatedAt: new Date(),
      },
    });
  console.log(
    "  ✓ Created encrypted MP student profile (B.Tech CSE, OBC, 25 yrs)",
  );

  // 3. Insert skills
  const demoSkills: {
    name: string;
    evidence: "declared" | "project" | "verified";
  }[] = [
    { name: "Python", evidence: "verified" },
    { name: "SQL", evidence: "project" },
    { name: "React", evidence: "declared" },
    { name: "Data Structures", evidence: "project" },
    { name: "Git", evidence: "declared" },
  ];

  // Clear existing skills for demo user
  await db.delete(skills).where(eq(skills.userId, userId));
  for (const sk of demoSkills) {
    await db.insert(skills).values({
      userId,
      name: sk.name,
      evidence: sk.evidence,
    });
  }
  console.log(
    `  ✓ Seeded ${demoSkills.length} declared & verified technical skills`,
  );

  // 4. Ensure consent is active
  await db
    .insert(consents)
    .values({
      userId,
      purpose: "eligibility_processing",
      version: "1.0",
    })
    .onConflictDoNothing();
  console.log("  ✓ Authorized purpose-bound processing consent (v1.0)");

  // 5. Seed diverse demo targets for immediate evaluation
  await db.delete(targets).where(eq(targets.userId, userId));

  // Find a live scheme (e.g. MMSKY)
  const [scheme] = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.kind, "scheme"))
    .limit(1);

  if (scheme) {
    await db.insert(targets).values({
      userId,
      kind: "scheme",
      sourceId: scheme.id,
      title: scheme.title,
    });
    console.log(`  ✓ Seeded scheme target: ${scheme.title}`);
  }

  // Find a government post
  const [govtPost] = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.kind, "govt_post"))
    .limit(1);

  if (govtPost) {
    await db.insert(targets).values({
      userId,
      kind: "govt_post",
      sourceId: govtPost.id,
      title: govtPost.title,
    });
    console.log(`  ✓ Seeded government post target: ${govtPost.title}`);
  }

  // Find or create an archetype
  const [arch] = await db.select().from(archetypes).limit(1);
  if (arch) {
    await db.insert(targets).values({
      userId,
      kind: "archetype",
      sourceId: arch.id,
      title: arch.title,
    });
    console.log(`  ✓ Seeded role archetype target: ${arch.title}`);
  }

  console.log("\n✨ Demo account successfully prepared!");
  console.log(`   Email:    ${demoEmail}`);
  console.log(`   Password: ${demoPassword}`);
}

main().catch((err) => {
  console.error("❌ Failed to seed demo user:", err);
  process.exit(1);
});
