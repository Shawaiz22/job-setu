"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TargetHeader } from "./TargetHeader";
import { VerdictBanner } from "./VerdictBanner";
import { ReadinessTab } from "./ReadinessTab";
import { GapsTab } from "./GapsTab";
import { PrepIntelTab } from "./PrepIntelTab";
import { AlternativeSchemes, type MatchingScheme } from "./AlternativeSchemes";
import type { EvaluationResult } from "@/modules/eligibility/types";

interface TargetDetailViewProps {
  target: {
    id: string;
    kind: string;
    sourceId: string;
    title: string;
  };
  evaluation: EvaluationResult | null;
  evaluatedOn: string;
  hasConsent: boolean;
  hasProfile: boolean;
  alternativeSchemes?: MatchingScheme[];
}

export function TargetDetailView({
  target,
  evaluation,
  evaluatedOn,
  hasConsent,
  hasProfile,
  alternativeSchemes = [],
}: TargetDetailViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"readiness" | "gaps" | "intel">(
    "readiness",
  );
  const [grantingConsent, setGrantingConsent] = useState(false);

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

      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to grant consent");
      setGrantingConsent(false);
    }
  }

  return (
    <div className="space-y-6">
      <TargetHeader id={target.id} kind={target.kind} title={target.title} />

      {/* Consent Notice */}
      {!hasConsent && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-amber-700 dark:text-amber-300">
                Consent Required for Eligibility Verification
              </h3>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                To evaluate this opportunity against your encrypted profile,
                Kariyar Setu requires explicit purpose-bound processing consent.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleGrantConsent}
              disabled={grantingConsent}
              className="shrink-0 self-start bg-amber-600 text-white hover:bg-amber-700 sm:self-auto"
            >
              {grantingConsent ? "Granting..." : "Grant Consent Now"}
            </Button>
          </div>
        </div>
      )}

      {/* Incomplete Profile Notice */}
      {hasConsent && !hasProfile && (
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-6 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-sky-700 dark:text-sky-300">
                Profile Incomplete
              </h3>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                Please complete your date of birth, category, and domicile state
                to calculate statutory eligibility verdicts.
              </p>
            </div>
            <Link href="/profile" className="shrink-0 self-start sm:self-auto">
              <Button>Complete Profile →</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Verdict Banner */}
      {evaluation && (
        <VerdictBanner evaluation={evaluation} evaluatedOn={evaluatedOn} />
      )}

      {/* Alternative MP Welfare Schemes when Blocked */}
      {evaluation?.status === "blocked" && alternativeSchemes.length > 0 && (
        <AlternativeSchemes schemes={alternativeSchemes} />
      )}

      {/* Tabs Navigation */}
      <div className="border-border border-b">
        <nav className="flex space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab("readiness")}
            className={`border-b-2 py-3 text-sm font-semibold transition ${
              activeTab === "readiness"
                ? "border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground border-transparent"
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
                ? "border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground border-transparent"
            }`}
          >
            Gaps ({evaluation?.gaps.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("intel")}
            className={`border-b-2 py-3 text-sm font-semibold transition ${
              activeTab === "intel"
                ? "border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground border-transparent"
            }`}
          >
            Prep Intel
          </button>
        </nav>
      </div>

      {/* Active Tab Panel */}
      <div>
        {activeTab === "readiness" && <ReadinessTab evaluation={evaluation} />}
        {activeTab === "gaps" && <GapsTab evaluation={evaluation} />}
        {activeTab === "intel" && <PrepIntelTab />}
      </div>
    </div>
  );
}
