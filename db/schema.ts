import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  uuid,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { Requirement } from "@/modules/eligibility/types";

// ==========================================
// Postgres Enums
// ==========================================

export const preferenceEnum = pgEnum("preference", ["govt", "private", "both"]);

export const skillEvidenceEnum = pgEnum("skill_evidence", [
  "verified",
  "project",
  "declared",
]);

export const targetKindEnum = pgEnum("target_kind", [
  "govt_post",
  "scheme",
  "job_description",
  "archetype",
]);

export const opportunityKindEnum = pgEnum("opportunity_kind", [
  "govt_post",
  "scheme",
]);

export const opportunityStatusEnum = pgEnum("opportunity_status", [
  "draft",
  "live",
]);

// ==========================================
// Tables
// ==========================================

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Profiles table
 * Note: dateOfBirth, category, and domicileState are sensitive.
 * Application-level encryption will be wired in Milestone 2.
 */
export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  dateOfBirth: text("date_of_birth").notNull(), // encrypted at rest in M2
  category: text("category").notNull(), // caste data, encrypted at rest in M2
  domicileState: text("domicile_state").notNull(), // encrypted at rest in M2
  qualification: text("qualification").notNull(),
  preference: preferenceEnum("preference").default("both").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const skills = pgTable("skills", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  evidence: skillEvidenceEnum("evidence").default("declared").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const targets = pgTable("targets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  kind: targetKindEnum("kind").notNull(),
  sourceId: text("source_id").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const opportunities = pgTable("opportunities", {
  id: uuid("id").defaultRandom().primaryKey(),
  kind: opportunityKindEnum("kind").notNull(),
  title: text("title").notNull(),
  department: text("department").notNull(),
  state: text("state").notNull(),
  closesOn: timestamp("closes_on", { withTimezone: true }),
  requirements: jsonb("requirements").$type<Requirement[]>().notNull(),
  sourceDocumentPath: text("source_document_path"),
  status: opportunityStatusEnum("status").default("draft").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const archetypes = pgTable("archetypes", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  requirements: jsonb("requirements").$type<Requirement[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const experiences = pgTable("experiences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  company: text("company").notNull(),
  role: text("role").notNull(),
  year: integer("year").notNull(),
  rounds: jsonb("rounds")
    .$type<Array<{ name: string; description?: string }>>()
    .notNull(),
  askedAbout: jsonb("asked_about").$type<string[]>().notNull(),
  outcome: text("outcome").notNull(), // 'offered' | 'rejected' | etc.
  verificationLevel: text("verification_level").default("declared").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const consents = pgTable("consents", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  purpose: text("purpose").notNull(), // 'eligibility_processing' | 'experience_publication' | 'notifications'
  version: text("version").notNull(),
  grantedAt: timestamp("granted_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

// ==========================================
// Relations
// ==========================================

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  skills: many(skills),
  targets: many(targets),
  consents: many(consents),
  experiences: many(experiences),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const skillsRelations = relations(skills, ({ one }) => ({
  user: one(users, {
    fields: [skills.userId],
    references: [users.id],
  }),
}));

export const targetsRelations = relations(targets, ({ one }) => ({
  user: one(users, {
    fields: [targets.userId],
    references: [users.id],
  }),
}));

export const experiencesRelations = relations(experiences, ({ one }) => ({
  user: one(users, {
    fields: [experiences.userId],
    references: [users.id],
  }),
}));

export const consentsRelations = relations(consents, ({ one }) => ({
  user: one(users, {
    fields: [consents.userId],
    references: [users.id],
  }),
}));

// ==========================================
// Zod Schemas
// ==========================================

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertProfileSchema = createInsertSchema(profiles);
export const selectProfileSchema = createSelectSchema(profiles);

export const insertSkillSchema = createInsertSchema(skills);
export const selectSkillSchema = createSelectSchema(skills);

export const insertTargetSchema = createInsertSchema(targets);
export const selectTargetSchema = createSelectSchema(targets);

export const insertOpportunitySchema = createInsertSchema(opportunities);
export const selectOpportunitySchema = createSelectSchema(opportunities);

export const insertArchetypeSchema = createInsertSchema(archetypes);
export const selectArchetypeSchema = createSelectSchema(archetypes);

export const insertExperienceSchema = createInsertSchema(experiences);
export const selectExperienceSchema = createSelectSchema(experiences);

export const insertConsentSchema = createInsertSchema(consents);
export const selectConsentSchema = createSelectSchema(consents);
