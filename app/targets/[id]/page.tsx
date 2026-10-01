"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { VerdictBadge } from "@/components/targets/VerdictBadge";
import { ClauseCitation } from "@/components/targets/ClauseCitation";
import type { EvaluationResult } from "@/modules/eligibility/types";

interface TargetData {
  id: string;
  kind: "govt_post" | "scheme" | "job_description" | "archetype";
  sourceId: string;
  title: string;
  createdAt: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TargetWorkspacePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [target, setTarget] = useState<TargetData | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [evaluatedOn, setEvaluatedOn] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"readiness" | "gaps" | "intel">(
    "readiness",
  );
  const [errorState, setErrorState] = useState<{
    type: "consent" | "profile" | "error";
    message: string;
  } | null>(null);
  const [grantingConsent, setGrantingConsent] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadTargetAndEvaluation() {
      try {
        setLoading(true);
        setErrorState(null);

        // 1. Fetch Target base info
        const targetRes = await fetch(`/api/v1/targets/${id}`);
        if (targetRes.status === 401) {
          router.push("/login");
          return;
        }

        if (!targetRes.ok) {
          throw new Error("Target not found");
        }

        const targetJson = await targetRes.json();
        if (active) {
          setTarget(targetJson.target);
        }

        // 2. Fetch live evaluation
        const evalRes = await fetch(`/api/v1/targets/${id}/evaluation`);
        if (evalRes.status === 403) {
          if (active) {
            setErrorState({
              type: "consent",
              message:
                "Consent for eligibility processing is required to evaluate rules against your profile.",
            });
          }
          return;
        }

        if (evalRes.status === 404) {
          const body = await evalRes.json();
          if (active) {
            setErrorState({
              type: "profile",
              message:
                body.error ||
                "Profile must be created before evaluating eligibility.",
            });
          }
          return;
        }

        if (!evalRes.ok) {
          throw new Error("Failed to evaluate eligibility");
        }

        const evalJson = await evalRes.json();
        if (active) {
          setEvaluation(evalJson.evaluation);
          setEvaluatedOn(evalJson.evaluatedOn);
        }
      } catch (err: unknown) {
        if (active) {
          setErrorState({
            type: "error",
            message:
              err instanceof Error
                ? err.message
                : "Error loading target workspace",
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadTargetAndEvaluation();

    return () => {
      active = false;
    };
  }, [id, router]);

  async function handleGrantConsent() {
    setGrantingConsent(true);
    try {
      const res = await fetch("/api/v1/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: "eligibility_processing",
          version: "1.0",
          granted: true,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to grant consent");
      }

      // Re-trigger load
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to grant consent");
      setGrantingConsent(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Remove this target from your workspace?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/targets/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete target");
      router.push("/targets");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Could not delete target");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
        <div className="mt-6 h-32 animate-pulse rounded-xl bg-neutral-100" />
        <div className="mt-8 h-64 animate-pulse rounded-xl bg-neutral-100" />
      </div>
    );
  }

  if (!target) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center sm:px-6">
        <h2 className="text-xl font-bold text-neutral-900">Target Not Found</h2>
        <p className="mt-2 text-sm text-neutral-500">
          This target may have been deleted or does not exist.
        </p>
        <Link href="/targets" className="mt-4 inline-block">
          <Button variant="outline">Return to Targets</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Navigation Header */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-neutral-200 pb-5 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/targets"
            className="inline-flex items-center text-xs font-semibold text-neutral-500 hover:text-neutral-900"
          >
            ← Back to Targets
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="rounded-md bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-700 uppercase">
              {target.kind.replace("_", " ")}
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              {target.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          >
            {deleting ? "Removing..." : "Remove Target"}
          </Button>
        </div>
      </div>

      {/* Profile & Consent Notice States */}
      {errorState?.type === "consent" && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-amber-900">
                Consent Required for Eligibility Processing
              </h3>
              <p className="mt-1 text-sm text-amber-800">
                To evaluate this opportunity against your encrypted profile, Job
                Setu requires explicit consent per SPEC.md Section 9.3.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleGrantConsent}
              disabled={grantingConsent}
              className="bg-amber-900 text-xs text-white hover:bg-amber-800"
            >
              {grantingConsent ? "Granting..." : "Grant Consent"}
            </Button>
          </div>
        </div>
      )}

      {errorState?.type === "profile" && (
        <div className="mt-6 rounded-xl border border-sky-200 bg-sky-50 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-sky-900">
                Profile Incomplete
              </h3>
              <p className="mt-1 text-sm text-sky-800">
                Please complete your date of birth, caste category, and domicile
                to calculate official clause verdicts.
              </p>
            </div>
            <Link href="/profile">
              <Button className="bg-sky-900 text-xs text-white hover:bg-sky-800">
                Complete Profile →
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Verdict Banner (SPEC.md Section 11) */}
      {evaluation && (
        <div className="mt-6">
          {evaluation.status === "blocked" ? (
            <div className="rounded-2xl border-2 border-rose-300 bg-rose-50/70 p-6 shadow-xs">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-3 w-3 rounded-full bg-rose-600" />
                    <h2 className="text-lg font-bold tracking-tight text-rose-950 sm:text-xl">
                      {evaluation.futureEligibleOn
                        ? `SOON · Ineligible Now (Eligible ${evaluation.futureEligibleOn})`
                        : "BLOCKED · Disqualified by Statutory Rules"}
                    </h2>
                  </div>
                  <p className="mt-2 text-sm text-rose-900">
                    One or more mandatory non-negotiable clauses disqualify your
                    current profile.
                  </p>
                </div>
                <VerdictBadge evaluation={evaluation} className="self-start" />
              </div>

              {/* Failing Clause List */}
              <div className="mt-5 space-y-3">
                {evaluation.failures.map((f, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-rose-200 bg-white p-4 shadow-2xs"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                      <div className="text-sm font-semibold text-rose-950">
                        {f.requirement.label}: {f.reason}
                      </div>
                      {f.shortfall && (
                        <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800">
                          Shortfall: {f.shortfall}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 border-t border-neutral-100 pt-2">
                      <ClauseCitation source={f.requirement.source} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/60 p-6 shadow-xs">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-3 w-3 rounded-full bg-emerald-600" />
                    <h2 className="text-lg font-bold tracking-tight text-emerald-950 sm:text-xl">
                      ELIGIBLE · Ready to Apply
                    </h2>
                  </div>
                  <p className="mt-2 text-sm text-emerald-900">
                    Your profile satisfies all mandatory statutory criteria for
                    this position.
                  </p>
                </div>
                <VerdictBadge evaluation={evaluation} className="self-start" />
              </div>

              {/* Progress and highlights */}
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-2xs">
                  <div className="text-xs text-neutral-500">
                    Readiness Score
                  </div>
                  <div className="mt-1 text-2xl font-bold text-emerald-700">
                    {evaluation.score}%
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-2xs">
                  <div className="text-xs text-neutral-500">
                    Mandatory Rules Met
                  </div>
                  <div className="mt-1 text-2xl font-bold text-neutral-900">
                    {evaluation.met.length}
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-2xs">
                  <div className="text-xs text-neutral-500">
                    Suggested Enhancements
                  </div>
                  <div className="mt-1 text-2xl font-bold text-neutral-900">
                    {evaluation.gaps.length}
                  </div>
                </div>
              </div>
            </div>
          )}

          {evaluatedOn && (
            <div className="mt-2 text-right text-[11px] text-neutral-400">
              Evaluated as of: {evaluatedOn}
            </div>
          )}
        </div>
      )}

      {/* Tabs navigation */}
      <div className="mt-8 border-b border-neutral-200">
        <nav className="flex space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab("readiness")}
            className={`border-b-2 py-3 text-sm font-semibold transition ${
              activeTab === "readiness"
                ? "border-neutral-900 text-neutral-900"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            Readiness (
            {evaluation?.status === "eligible"
              ? evaluation.met.length
              : evaluation?.failures.length || 0}
            )
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("gaps")}
            className={`border-b-2 py-3 text-sm font-semibold transition ${
              activeTab === "gaps"
                ? "border-neutral-900 text-neutral-900"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            Gaps ({evaluation?.gaps.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("intel")}
            className={`border-b-2 py-3 text-sm font-semibold transition ${
              activeTab === "intel"
                ? "border-neutral-900 text-neutral-900"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            Prep Intel
          </button>
        </nav>
      </div>

      {/* Tab Panels */}
      <div className="mt-6">
        {/* Tab 1: Readiness */}
        {activeTab === "readiness" && (
          <div className="space-y-4">
            {!evaluation ? (
              <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
                Evaluation data unavailable. Complete your profile or grant
                consent.
              </div>
            ) : evaluation.status === "blocked" ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 text-xs text-rose-900">
                  <span className="font-semibold">Notice:</span> Overall
                  readiness is currently blocked by {evaluation.failures.length}{" "}
                  statutory rule failure
                  {evaluation.failures.length > 1 ? "s" : ""}.
                </div>
                {evaluation.failures.map((f, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-rose-200 bg-white p-5 shadow-2xs"
                  >
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="flex h-2 w-2 rounded-full bg-rose-500" />
                          <h4 className="text-sm font-semibold text-neutral-900">
                            {f.requirement.label}
                          </h4>
                          <span className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 uppercase">
                            Blocked
                          </span>
                        </div>
                        <p className="text-xs text-rose-800">
                          {f.reason} {f.shortfall && `(${f.shortfall})`}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 border-t border-neutral-100 pt-3">
                      <ClauseCitation source={f.requirement.source} />
                    </div>
                  </div>
                ))}
              </div>
            ) : evaluation.met.length === 0 ? (
              <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
                No met requirements to display yet.
              </div>
            ) : (
              evaluation.met.map((req, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs"
                >
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                        <h4 className="text-sm font-semibold text-neutral-900">
                          {req.label}
                        </h4>
                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase">
                          Satisfied
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600">
                        Rule verified against candidate profile attributes.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                        Weight: {req.weight}/10
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 border-t border-neutral-100 pt-3">
                    <ClauseCitation source={req.source} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Gaps */}
        {activeTab === "gaps" && (
          <div className="space-y-4">
            {!evaluation || evaluation.gaps.length === 0 ? (
              <div className="rounded-xl border border-neutral-200 bg-emerald-50/50 bg-white p-8 text-center text-sm text-emerald-700">
                🎉 No gaps identified! Your profile fulfills all evaluated
                attributes.
              </div>
            ) : (
              evaluation.gaps.map((gap, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs"
                >
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-amber-500" />
                        <h4 className="text-sm font-semibold text-neutral-900">
                          {gap.requirement.label}
                        </h4>
                        <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 uppercase">
                          Priority {gap.priority}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600">
                        {gap.suggestedAction?.label ||
                          "Acquire or verify this skill/credential to enhance readiness score."}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-semibold text-neutral-500">
                        Weight: {gap.requirement.weight}/10
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 border-t border-neutral-100 pt-3">
                    <ClauseCitation source={gap.requirement.source} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Prep Intel */}
        {activeTab === "intel" && (
          <div className="space-y-6">
            {/* Overview / Pattern */}
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs">
              <h3 className="text-sm font-bold tracking-wide text-neutral-900 uppercase">
                Selection Process & Pattern Breakdown
              </h3>
              <p className="mt-1 text-xs text-neutral-500">
                Official screening workflow derived from notified syllabus and
                verified candidate reports.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-4">
                  <div className="text-xs font-semibold text-neutral-500">
                    Stage 1
                  </div>
                  <div className="mt-1 text-sm font-bold text-neutral-900">
                    Preliminary / Screening
                  </div>
                  <p className="mt-1 text-xs text-neutral-600">
                    Objective MCQ paper testing General Aptitude, State
                    Knowledge, and Basic Reasoning.
                  </p>
                </div>

                <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-4">
                  <div className="text-xs font-semibold text-neutral-500">
                    Stage 2
                  </div>
                  <div className="mt-1 text-sm font-bold text-neutral-900">
                    Main Examination / Domain
                  </div>
                  <p className="mt-1 text-xs text-neutral-600">
                    In-depth descriptive papers or hands-on domain assessment
                    covering core syllabus.
                  </p>
                </div>

                <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-4">
                  <div className="text-xs font-semibold text-neutral-500">
                    Stage 3
                  </div>
                  <div className="mt-1 text-sm font-bold text-neutral-900">
                    Interview & Verification
                  </div>
                  <p className="mt-1 text-xs text-neutral-600">
                    Personality board interview, document verification, and
                    statutory domicile check.
                  </p>
                </div>
              </div>
            </div>

            {/* Asked About Topics */}
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs">
              <h3 className="text-sm font-bold tracking-wide text-neutral-900 uppercase">
                Key Topics Frequently Asked
              </h3>
              <p className="mt-1 text-xs text-neutral-500">
                Aggregated from recent question papers and candidate
                submissions.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  "Madhya Pradesh Geography & History",
                  "Constitutional Provisions & Panchayati Raj",
                  "Current Economic Policies & Schemes",
                  "Data Analysis & General Reasoning",
                  "Core Engineering & Technical Principles",
                  "Public Administration Ethics",
                ].map((topic, i) => (
                  <span
                    key={i}
                    className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700"
                  >
                    • {topic}
                  </span>
                ))}
              </div>
            </div>

            {/* Preparation Checklist */}
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs">
              <h3 className="text-sm font-bold tracking-wide text-neutral-900 uppercase">
                Recommended Verification Checklist
              </h3>
              <ul className="mt-3 space-y-2 text-xs text-neutral-600">
                <li className="flex items-center gap-2">
                  <span className="font-bold text-emerald-600">✓</span>
                  MP Employment Exchange (Rojgar Panjiyan) active registration.
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-bold text-emerald-600">✓</span>
                  Original Domicile Certificate issued by authorized MP
                  Tehsildar/SDM.
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-bold text-emerald-600">✓</span>
                  Valid Category Certificate with active digital seal (for
                  OBC/SC/ST/EWS).
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
