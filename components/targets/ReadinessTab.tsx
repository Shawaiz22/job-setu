import { ClauseCitation } from "./ClauseCitation";
import type { EvaluationResult } from "@/modules/eligibility/types";

interface ReadinessTabProps {
  evaluation: EvaluationResult | null;
}

export function ReadinessTab({ evaluation }: ReadinessTabProps) {
  if (!evaluation) {
    return (
      <div className="border-border bg-card text-muted-foreground rounded-xl border p-8 text-center text-sm">
        Evaluation data unavailable. Complete your candidate profile or grant
        processing consent.
      </div>
    );
  }

  if (evaluation.status === "blocked") {
    return (
      <div className="space-y-4">
        <div className="border-destructive/20 bg-destructive/5 text-destructive rounded-xl border p-4 text-xs">
          <span className="font-semibold">Notice:</span> Overall readiness is
          currently blocked by {evaluation.failures.length} statutory rule
          failure{evaluation.failures.length > 1 ? "s" : ""}.
        </div>

        {evaluation.failures.map((f, idx) => (
          <div
            key={idx}
            className="border-destructive/20 bg-card rounded-xl border p-5 shadow-xs"
          >
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-destructive flex h-2 w-2 rounded-full" />
                  <h4 className="text-foreground text-sm font-semibold">
                    {f.requirement.label}
                  </h4>
                  <span className="bg-destructive/15 text-destructive rounded px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase">
                    Blocked
                  </span>
                </div>
                <p className="text-destructive/90 text-xs">
                  {f.reason} {f.shortfall && `(${f.shortfall})`}
                </p>
              </div>
            </div>
            <div className="border-border/60 mt-3 border-t pt-3">
              <ClauseCitation source={f.requirement.source} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (evaluation.met.length === 0) {
    return (
      <div className="border-border bg-card text-muted-foreground rounded-xl border p-8 text-center text-sm">
        No met statutory requirements to display yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {evaluation.met.map((req, idx) => (
        <div
          key={idx}
          className="border-border/80 bg-card rounded-xl border p-5 shadow-xs"
        >
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                <h4 className="text-foreground text-sm font-semibold">
                  {req.label}
                </h4>
                <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-600 uppercase dark:text-emerald-400">
                  Satisfied
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                Rule verified against candidate profile attributes.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-[11px] font-medium">
                Weight: {req.weight}/10
              </span>
            </div>
          </div>

          <div className="border-border/60 mt-3 border-t pt-3">
            <ClauseCitation source={req.source} />
          </div>
        </div>
      ))}
    </div>
  );
}
