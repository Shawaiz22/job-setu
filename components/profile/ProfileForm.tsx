"use client";

import { useState } from "react";
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

export interface SkillItem {
  id: string;
  name: string;
  evidence: "declared" | "project" | "verified";
}

interface ProfileData {
  dateOfBirth?: string;
  category?: string;
  domicileState?: string;
  qualification?: string;
  preference?: "both" | "govt" | "private";
}

interface ProfileFormProps {
  initialProfile: ProfileData | null;
  initialSkills?: SkillItem[];
}

const POPULAR_QUALIFICATIONS = [
  { label: "B.Tech / B.E. (Engineering)", category: "Undergraduate Degrees" },
  { label: "BCA (Computer Applications)", category: "Undergraduate Degrees" },
  {
    label: "B.Sc (Science / Computer Science)",
    category: "Undergraduate Degrees",
  },
  { label: "B.Com (Commerce)", category: "Undergraduate Degrees" },
  { label: "B.A. (Arts / Humanities)", category: "Undergraduate Degrees" },
  { label: "BBA (Business Administration)", category: "Undergraduate Degrees" },
  { label: "M.Tech / M.E. (Engineering)", category: "Postgraduate Degrees" },
  { label: "MCA (Computer Applications)", category: "Postgraduate Degrees" },
  { label: "M.Sc (Master of Science)", category: "Postgraduate Degrees" },
  { label: "MBA (Management)", category: "Postgraduate Degrees" },
  { label: "M.Com (Commerce)", category: "Postgraduate Degrees" },
  { label: "M.A. (Arts / Humanities)", category: "Postgraduate Degrees" },
  { label: "Diploma / Polytechnic", category: "Diploma & Technical" },
  {
    label: "12th Pass (Higher Secondary / 10+2)",
    category: "School Education",
  },
  { label: "10th Pass (Matriculation)", category: "School Education" },
  { label: "Ph.D. / Doctorate", category: "Doctorate" },
];

const SUGGESTED_SKILLS = [
  "Python",
  "SQL",
  "JavaScript",
  "React",
  "Node.js",
  "Java",
  "C++",
  "Data Structures",
  "Git",
  "Machine Learning",
  "Quantitative Aptitude",
  "Logical Reasoning",
  "General Studies",
  "MP GK",
];

export function ProfileForm({
  initialProfile,
  initialSkills = [],
}: ProfileFormProps) {
  const [dateOfBirth, setDateOfBirth] = useState(
    initialProfile?.dateOfBirth || "",
  );
  const [category, setCategory] = useState(
    initialProfile?.category || "General",
  );
  const [domicileState, setDomicileState] = useState(
    initialProfile?.domicileState || "Madhya Pradesh",
  );
  const [qualification, setQualification] = useState(
    initialProfile?.qualification || "",
  );
  const [preference, setPreference] = useState<"both" | "govt" | "private">(
    initialProfile?.preference || "both",
  );

  // Skills state
  const [skillsList, setSkillsList] = useState<SkillItem[]>(initialSkills);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillEvidence, setNewSkillEvidence] = useState<
    "declared" | "project" | "verified"
  >("declared");
  const [addingSkill, setAddingSkill] = useState(false);
  const [deletingSkillId, setDeletingSkillId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Calculate age display helper
  const calculateAge = (dobString: string) => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;
    const today = new Date();
    let ageYears = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      ageYears--;
    }
    return ageYears >= 0 ? ageYears : null;
  };

  const currentAge = calculateAge(dateOfBirth);

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

  async function handleAddSkill(
    nameToAdd?: string,
    evidenceToAdd?: "declared" | "project" | "verified",
  ) {
    const skillName = (nameToAdd || newSkillName).trim();
    const evidence = evidenceToAdd || newSkillEvidence;

    if (!skillName) return;

    setAddingSkill(true);
    try {
      const res = await fetch("/api/v1/profile/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: skillName, evidence }),
      });

      const data = await res.json();
      if (res.ok && data.skill) {
        setSkillsList((prev) => {
          const exists = prev.find(
            (s) =>
              s.id === data.skill.id ||
              s.name.toLowerCase() === skillName.toLowerCase(),
          );
          if (exists) {
            return prev.map((s) => (s.id === data.skill.id ? data.skill : s));
          }
          return [data.skill, ...prev];
        });
        if (!nameToAdd) {
          setNewSkillName("");
        }
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to add skill",
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: "Network error occurred while adding skill.",
      });
    } finally {
      setAddingSkill(false);
    }
  }

  async function handleDeleteSkill(id: string) {
    setDeletingSkillId(id);
    try {
      const res = await fetch(`/api/v1/profile/skills?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSkillsList((prev) => prev.filter((s) => s.id !== id));
      } else {
        const data = await res.json();
        setMessage({
          type: "error",
          text: data.error || "Failed to delete skill",
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: "Network error occurred while deleting skill.",
      });
    } finally {
      setDeletingSkillId(null);
    }
  }

  async function handleDeleteData() {
    const confirmed = window.confirm(
      "Are you sure you want to delete all your profile data? This action cascades across all your targets and cannot be undone.",
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
        setSkillsList([]);
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

  return (
    <div className="space-y-6">
      <Card className="border-border/70 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Academic &amp; Demographic Profile
          </CardTitle>
          <CardDescription>
            Enter your details once. Kariyar Setu evaluates your eligibility
            across Madhya Pradesh government opportunities and welfare schemes
            with statutory citations.
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

            {/* Date of Birth */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                {currentAge !== null && (
                  <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-semibold">
                    Current Age: {currentAge} years
                  </span>
                )}
              </div>
              <Input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
              />
              <p className="text-muted-foreground text-xs">
                Used to verify age criteria and relaxation rules. Encrypted at
                rest.
              </p>
            </div>

            {/* Category / Reservation */}
            <div className="space-y-2">
              <Label htmlFor="category">Social Category / Reservation</Label>
              <select
                id="category"
                className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-colors focus-visible:ring-1 focus-visible:outline-none"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="General">General / UR (Unreserved)</option>
                <option value="OBC">
                  OBC (Other Backward Class - Non Creamy)
                </option>
                <option value="SC">SC (Scheduled Caste)</option>
                <option value="ST">ST (Scheduled Tribe)</option>
                <option value="EWS">EWS (Economically Weaker Section)</option>
              </select>
              <p className="text-muted-foreground text-xs">
                State notifications grant statutory age extensions and fee
                concessions based on this classification.
              </p>
            </div>

            {/* Domicile State */}
            <div className="space-y-2">
              <Label htmlFor="domicileState">Domicile State</Label>
              <div className="flex gap-2">
                <Input
                  id="domicileState"
                  type="text"
                  placeholder="Madhya Pradesh"
                  value={domicileState}
                  onChange={(e) => setDomicileState(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDomicileState("Madhya Pradesh")}
                  className="shrink-0 text-xs"
                >
                  Set MP Domicile
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                Required for state-specific quotas, police/exam domicile bars,
                and welfare schemes.
              </p>
            </div>

            {/* Highest Qualification with Dropdown & Autocomplete */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="qualification">
                  Highest Educational Qualification
                </Label>
                <span className="text-muted-foreground text-xs">
                  Select from list or type below
                </span>
              </div>

              {/* Standard Curated Dropdown */}
              <select
                className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-colors focus-visible:ring-1 focus-visible:outline-none"
                value={
                  POPULAR_QUALIFICATIONS.some((q) => q.label === qualification)
                    ? qualification
                    : "custom"
                }
                onChange={(e) => {
                  if (e.target.value !== "custom") {
                    setQualification(e.target.value);
                  }
                }}
              >
                <option value="custom">
                  -- Choose standard qualification or custom --
                </option>
                <optgroup label="Undergraduate Degrees">
                  <option value="B.Tech / B.E. (Engineering)">
                    B.Tech / B.E. (Engineering)
                  </option>
                  <option value="BCA (Computer Applications)">
                    BCA (Computer Applications)
                  </option>
                  <option value="B.Sc (Science / Computer Science)">
                    B.Sc (Science / Computer Science)
                  </option>
                  <option value="B.Com (Commerce)">B.Com (Commerce)</option>
                  <option value="B.A. (Arts / Humanities)">
                    B.A. (Arts / Humanities)
                  </option>
                  <option value="BBA (Business Administration)">
                    BBA (Business Administration)
                  </option>
                </optgroup>
                <optgroup label="Postgraduate Degrees">
                  <option value="M.Tech / M.E. (Engineering)">
                    M.Tech / M.E. (Engineering)
                  </option>
                  <option value="MCA (Computer Applications)">
                    MCA (Computer Applications)
                  </option>
                  <option value="M.Sc (Master of Science)">
                    M.Sc (Master of Science)
                  </option>
                  <option value="MBA (Management)">MBA (Management)</option>
                  <option value="M.Com (Commerce)">M.Com (Commerce)</option>
                  <option value="M.A. (Arts / Humanities)">
                    M.A. (Arts / Humanities)
                  </option>
                </optgroup>
                <optgroup label="School & Technical Diplomas">
                  <option value="Diploma / Polytechnic">
                    Diploma / Polytechnic
                  </option>
                  <option value="12th Pass (Higher Secondary / 10+2)">
                    12th Pass (Higher Secondary / 10+2)
                  </option>
                  <option value="10th Pass (Matriculation)">
                    10th Pass (Matriculation)
                  </option>
                  <option value="Ph.D. / Doctorate">Ph.D. / Doctorate</option>
                </optgroup>
              </select>

              {/* Editable Field with Datalist Autocomplete */}
              <div className="pt-1">
                <Input
                  id="qualification"
                  list="qualifications-list"
                  type="text"
                  placeholder="e.g. B.Tech - Computer Science, BCA, B.Sc Mathematics, 12th Pass"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  required
                />
                <datalist id="qualifications-list">
                  {POPULAR_QUALIFICATIONS.map((q) => (
                    <option key={q.label} value={q.label} />
                  ))}
                  <option value="B.Tech - Computer Science and Engineering" />
                  <option value="B.Tech - Information Technology" />
                  <option value="B.Tech - Mechanical Engineering" />
                  <option value="B.Tech - Civil Engineering" />
                  <option value="B.Tech - Electrical Engineering" />
                  <option value="B.Sc Computer Science" />
                  <option value="B.Sc Mathematics" />
                </datalist>
              </div>
              <p className="text-muted-foreground text-xs">
                Our eligibility engine matches degrees across branch
                specializations, acronyms (B.Tech / B.E.), and equivalents.
              </p>
            </div>

            {/* Opportunity Preference */}
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
          <CardFooter className="flex flex-col gap-4 pt-2 sm:flex-row sm:justify-between">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving Profile..." : "Save Profile Details"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:bg-destructive/10"
              onClick={handleDeleteData}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete All My Data"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Candidate Skills & Competencies Section */}
      <Card className="border-border/70 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">
                Skills &amp; Competencies
              </CardTitle>
              <CardDescription>
                Add your technical and aptitude skills. Skills are evaluated
                against private tech roles and skill-based government
                requirements.
              </CardDescription>
            </div>
            <span className="bg-secondary text-secondary-foreground rounded-full px-2.5 py-1 text-xs font-semibold">
              {skillsList.length} declared
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Active Skills Badges */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Your Current Skills
            </Label>
            {skillsList.length === 0 ? (
              <p className="text-muted-foreground py-2 text-sm italic">
                No skills added yet. Choose from suggestions below or enter
                custom skills.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {skillsList.map((skill) => (
                  <span
                    key={skill.id}
                    className="border-border/80 bg-background inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium shadow-xs"
                  >
                    <span>{skill.name}</span>
                    <span
                      className={`py-0.2 rounded px-1 text-[10px] font-semibold uppercase ${
                        skill.evidence === "verified"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : skill.evidence === "project"
                            ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {skill.evidence}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSkill(skill.id)}
                      disabled={deletingSkillId === skill.id}
                      className="text-muted-foreground hover:text-destructive ml-1 transition-colors"
                      title="Remove skill"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick-Add Popular Suggestions */}
          <div className="border-border/50 space-y-2 border-t pt-2">
            <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Quick-Add Common Skills
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_SKILLS.filter(
                (s) =>
                  !skillsList.some(
                    (existing) =>
                      existing.name.toLowerCase() === s.toLowerCase(),
                  ),
              ).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleAddSkill(s, "declared")}
                  disabled={addingSkill}
                  className="border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 rounded-full border border-dashed px-2.5 py-0.5 text-xs transition-colors"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          {/* Add Custom Skill Form */}
          <div className="border-border/50 space-y-3 border-t pt-3">
            <Label className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Add Custom Skill
            </Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                type="text"
                placeholder="Skill name (e.g. Next.js, Docker, Aptitude)"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                className="flex-1"
              />
              <select
                className="border-input bg-background focus-visible:ring-ring flex h-9 rounded-md border px-3 py-1 text-sm shadow-xs transition-colors focus-visible:ring-1 focus-visible:outline-none sm:w-44"
                value={newSkillEvidence}
                onChange={(e) =>
                  setNewSkillEvidence(
                    e.target.value as "declared" | "project" | "verified",
                  )
                }
              >
                <option value="declared">Declared (0.5x)</option>
                <option value="project">Project-backed (0.8x)</option>
                <option value="verified">Verified Certificate (1.0x)</option>
              </select>
              <Button
                type="button"
                onClick={() => handleAddSkill()}
                disabled={addingSkill || !newSkillName.trim()}
                className="shrink-0"
              >
                {addingSkill ? "Adding..." : "Add Skill"}
              </Button>
            </div>
            <p className="text-muted-foreground text-[11px]">
              Evidence multipliers: Verified certifications count for 100%
              weighting, project evidence counts for 80%, and self-declared
              skills count for 50%.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
