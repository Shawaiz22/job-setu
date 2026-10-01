import { z } from "zod";

export const profileUpsertSchema = z.object({
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  category: z.string().min(1, "Category is required"),
  domicileState: z.string().min(1, "Domicile state is required"),
  qualification: z.string().min(1, "Qualification is required"),
  preference: z.enum(["govt", "private", "both"]).default("both"),
});

export type ProfileUpsertInput = z.infer<typeof profileUpsertSchema>;

export const skillCreateSchema = z.object({
  name: z.string().trim().min(1, "Skill name is required").max(100),
  evidence: z.enum(["declared", "project", "verified"]).default("declared"),
});

export type SkillCreateInput = z.infer<typeof skillCreateSchema>;

export const skillDeleteSchema = z.object({
  skillId: z.string().uuid("Invalid skill ID"),
});

export type SkillDeleteInput = z.infer<typeof skillDeleteSchema>;
