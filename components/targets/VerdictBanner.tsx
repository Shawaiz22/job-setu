import { VerdictBadge } from "./VerdictBadge";
import { ClauseCitation } from "./ClauseCitation";
import type { EvaluationResult } from "@/modules/eligibility/types";

interface VerdictBannerProps {
  evaluation: EvaluationResult;
  evaluatedOn: string;
}

export function VerdictBanner({ evaluation, evaluatedOn }: VerdictBannerProps) {
  return (
    <div>
      {evaluation.status === "blocked" ? (
        <div className="border-destructive/30 bg-destructive/5 rounded-2xl border-2 p-6 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="bg-destructive flex h-3 w-3 animate-pulse rounded-full" />
                <h2 className="text-destructive text-lg font-bold tracking-tight sm:text-xl">
                  {evaluation.futureEligibleOn
                    ? `SOON · Ineligible Now (Eligible ${evaluation.futureEligibleOn})`
                    : "BLOCKED · Disqualified by Statutory Rules"}
                </h2>
              </div>
              <p className="text-muted-foreground mt-2 text-sm">
                One or more mandatory statutory clauses disqualify your current
                profile.
              </p>
            </div>
            <VerdictBadge evaluation={evaluation} className="self-start" />
          </div>

          {/* Failing Clause List */}
          <div className="mt-5 space-y-3">
            {evaluation.failures.map((f, idx) => (
              <div
                key={idx}
                className="border-destructive/20 bg-card rounded-xl border p-4 shadow-xs"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                  <div className="text-destructive text-sm font-semibold">
                    {f.requirement.label}: {f.reason}
                  </div>
                  {f.shortfall && (
                    <span className="bg-destructive/15 text-destructive rounded px-2 py-0.5 text-xs font-bold">
                      Shortfall: {f.shortfall}
                    </span>
                  )}
                </div>
                <div className="border-border/60 mt-2 border-t pt-2">
                  <ClauseCitation source={f.requirement.source} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-3 w-3 rounded-full bg-emerald-600" />
                <h2 className="text-lg font-bold tracking-tight text-emerald-700 sm:text-xl dark:text-emerald-300">
                  ELIGIBLE · Ready to Apply
                </h2>
              </div>
              <p className="text-muted-foreground mt-2 text-sm">
                Your profile satisfies all mandatory statutory criteria for this
                position.
              </p>
            </div>
            <VerdictBadge evaluation={evaluation} className="self-start" />
          </div>

          {/* Progress and highlights */}
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="bg-card rounded-xl border border-emerald-500/20 p-4 shadow-xs">
              <div className="text-muted-foreground text-xs">
                Readiness Score
              </div>
              <div className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {evaluation.score}%
              </div>
            </div>
            <div className="bg-card rounded-xl border border-emerald-500/20 p-4 shadow-xs">
              <div className="text-muted-foreground text-xs">
                Mandatory Rules Met
              </div>
              <div className="text-foreground mt-1 text-2xl font-bold">
                {evaluation.met.length}
              </div>
            </div>
            <div className="bg-card rounded-xl border border-emerald-500/20 p-4 shadow-xs">
              <div className="text-muted-foreground text-xs">
                Suggested Enhancements
              </div>
              <div className="text-foreground mt-1 text-2xl font-bold">
                {evaluation.gaps.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {evaluatedOn && (
        <div className="text-muted-foreground mt-2 text-right text-[11px]">
          Evaluated as of: {evaluatedOn}
        </div>
      )}
    </div>
  );
}
