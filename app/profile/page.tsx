"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConsentManager } from "@/components/privacy/ConsentManager";

export default function ProfilePage() {
  const router = useRouter();

  const [dateOfBirth, setDateOfBirth] = useState("");
  const [category, setCategory] = useState("General");
  const [domicileState, setDomicileState] = useState("Madhya Pradesh");
  const [qualification, setQualification] = useState("");
  const [preference, setPreference] = useState<"both" | "govt" | "private">(
    "both",
  );

  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/v1/profile");
        if (res.status === 401) {
          router.push("/login");
          return;
        }

        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setDateOfBirth(data.profile.dateOfBirth || "");
            setCategory(data.profile.category || "General");
            setDomicileState(data.profile.domicileState || "Madhya Pradesh");
            setQualification(data.profile.qualification || "");
            setPreference(data.profile.preference || "both");
          }
        }
      } catch {
        setMessage({
          type: "error",
          text: "Failed to load profile. Please refresh.",
        });
      } finally {
        setInitialLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    try {
      const res = await fetch("/api/v1/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateOfBirth,
          category,
          domicileState,
          qualification,
          preference,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.error || "Failed to update profile",
        });
        setSaving(false);
        return;
      }

      setMessage({
        type: "success",
        text: "Profile updated successfully.",
      });
    } catch {
      setMessage({
        type: "error",
        text: "Network error occurred while saving profile.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteData() {
    const confirmed = window.confirm(
      "Are you sure you want to delete all your profile data? This action cascades and cannot be undone.",
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch("/api/v1/profile", { method: "DELETE" });
      if (res.ok) {
        setDateOfBirth("");
        setCategory("General");
        setDomicileState("Madhya Pradesh");
        setQualification("");
        setPreference("both");
        setMessage({
          type: "success",
          text: "Your profile data has been deleted.",
        });
      } else {
        setMessage({
          type: "error",
          text: "Failed to delete data. Please try again.",
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: "Network error occurred while deleting data.",
      });
    } finally {
      setDeleting(false);
    }
  }

  if (initialLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Student Profile
          </CardTitle>
          <CardDescription>
            Enter your details once. Job Setu evaluates your eligibility across
            Madhya Pradesh government opportunities and welfare schemes.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSave}>
          <CardContent className="space-y-5">
            {message && (
              <div
                className={`rounded-lg p-3 text-sm font-medium ${
                  message.type === "success"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-destructive/15 text-destructive"
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
              />
              <p className="text-muted-foreground text-xs">
                Used to verify age eligibility and cutoff criteria.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Social Category / Reservation</Label>
              <select
                id="category"
                className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-colors focus-visible:ring-1 focus-visible:outline-none"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="General">General / UR</option>
                <option value="OBC">OBC (Other Backward Class)</option>
                <option value="SC">SC (Scheduled Caste)</option>
                <option value="ST">ST (Scheduled Tribe)</option>
                <option value="EWS">EWS (Economically Weaker Section)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="domicileState">Domicile State</Label>
              <Input
                id="domicileState"
                type="text"
                placeholder="Madhya Pradesh"
                value={domicileState}
                onChange={(e) => setDomicileState(e.target.value)}
                required
              />
              <p className="text-muted-foreground text-xs">
                Required for state-specific quotas and welfare schemes.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qualification">Highest Qualification</Label>
              <Input
                id="qualification"
                type="text"
                placeholder="e.g. 12th Pass, Graduate in Science, B.Tech CSE"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preference">Opportunity Preference</Label>
              <select
                id="preference"
                className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-colors focus-visible:ring-1 focus-visible:outline-none"
                value={preference}
                onChange={(e) =>
                  setPreference(e.target.value as "both" | "govt" | "private")
                }
              >
                <option value="both">Both Government &amp; Private</option>
                <option value="govt">Government Opportunities Only</option>
                <option value="private">Private Opportunities Only</option>
              </select>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:bg-destructive/10"
              onClick={handleDeleteData}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete My Data"}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <ConsentManager />
    </div>
  );
}
