import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/db";
import { profiles, skills } from "@/db/schema";
import { withUserOnly } from "@/lib/db/scope";
import { decryptProfileFields } from "@/lib/crypto/encryption";
import { ProfileForm, SkillItem } from "@/components/profile/ProfileForm";
import { ConsentManager } from "@/components/privacy/ConsentManager";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Profile & Privacy — Kariyar Setu",
  description:
    "Manage your educational profile and privacy settings for automated eligibility verification.",
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Admin users manage circulars and do not maintain a student candidate profile
  if (session.user.isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Card className="border-border/80 shadow-md">
          <CardHeader>
            <div className="bg-primary/10 text-primary inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
              System Administrator
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Admin Console Overview
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              You are signed in with an administrative account. Student
              demographic forms and personal eligibility checks are disabled for
              admins. You have full access to ingest notifications, parse rule
              clauses, and oversee candidate intelligence.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-3 text-sm">
            <p>
              To extract eligibility rules from government circulars or PDF
              notifications, proceed to the notification management console.
            </p>
          </CardContent>
          <CardFooter className="pt-2">
            <Link href="/admin/notifications">
              <Button>Go to Admin Notifications &amp; Extraction</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Fetch student profile directly from database
  let initialProfile = null;
  try {
    const [rawProfile] = await db
      .select()
      .from(profiles)
      .where(withUserOnly(profiles, session.user.id));

    if (rawProfile) {
      try {
        const decrypted = decryptProfileFields(rawProfile);
        initialProfile = {
          dateOfBirth: decrypted.dateOfBirth,
          category: decrypted.category,
          domicileState: decrypted.domicileState,
          qualification: decrypted.qualification,
          preference: decrypted.preference,
        };
      } catch {
        // Fallback in case raw plaintext exists
        initialProfile = {
          dateOfBirth: rawProfile.dateOfBirth,
          category: rawProfile.category,
          domicileState: rawProfile.domicileState,
          qualification: rawProfile.qualification,
          preference: rawProfile.preference,
        };
      }
    }
  } catch (error) {
    console.error("Failed to load profile on server:", error);
  }

  // Fetch candidate skills
  let initialSkills: SkillItem[] = [];
  try {
    const userSkills = await db
      .select({
        id: skills.id,
        name: skills.name,
        evidence: skills.evidence,
      })
      .from(skills)
      .where(withUserOnly(skills, session.user.id));

    initialSkills = userSkills as SkillItem[];
  } catch (error) {
    console.error("Failed to load user skills on server:", error);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-foreground text-3xl font-extrabold tracking-tight">
          Candidate Profile
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Enter your demographic and academic qualifications once. Kariyar Setu
          evaluates every MP government notification against your exact profile.
        </p>
      </div>

      <ProfileForm
        initialProfile={initialProfile}
        initialSkills={initialSkills}
      />

      <ConsentManager />
    </div>
  );
}
