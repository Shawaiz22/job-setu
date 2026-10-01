import { ClauseCitation } from "./ClauseCitation";
import type { EvaluationResult } from "@/modules/eligibility/types";

interface GapsTabProps {
  evaluation: EvaluationResult | null;
}

export function GapsTab({ evaluation }: GapsTabProps) {
  if (!evaluation || evaluation.gaps.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center text-sm font-medium text-emerald-700 dark:text-emerald-300">
        🎉 No gaps identified! Your profile fulfills all evaluated criteria for
        this position.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {evaluation.gaps.map((gap, idx) => (
        <div
          key={idx}
          className="border-border/80 bg-card rounded-xl border p-5 shadow-xs"
        >
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-amber-500" />
                <h4 className="text-foreground text-sm font-semibold">
                  {gap.requirement.label}
                </h4>
                <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-700 uppercase dark:text-amber-400">
                  Priority {gap.priority}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                {gap.suggestedAction?.label ||
                  "Acquire or verify this skill/credential to enhance readiness score."}
              </p>
            </div>

            <div className="text-right">
              <span className="text-muted-foreground text-xs font-semibold">
                Weight: {gap.requirement.weight}/10
              </span>
            </div>
          </div>

          <div className="border-border/60 mt-3 border-t pt-3">
            <ClauseCitation source={gap.requirement.source} />
          </div>
        </div>
      ))}
    </div>
  );
}
