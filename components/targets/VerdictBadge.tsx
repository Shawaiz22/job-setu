import type { EvaluationResult } from "@/modules/eligibility/types";

interface VerdictBadgeProps {
  evaluation: EvaluationResult | null;
  className?: string;
}

export function VerdictBadge({
  evaluation,
  className = "",
}: VerdictBadgeProps) {
  if (!evaluation) {
    return (
      <span
        className={`inline-flex items-center rounded-full border border-neutral-300 bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-700 ${className}`}
      >
        PROFILE REQUIRED
      </span>
    );
  }

  if (evaluation.status === "blocked") {
    if (evaluation.futureEligibleOn) {
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 ${className}`}
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
          SOON · Eligible {evaluation.futureEligibleOn}
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-800 ${className}`}
      >
        <span className="h-2 w-2 rounded-full bg-rose-600" />
        BLOCKED · Ineligible
      </span>
    );
  }

  // Eligible
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 ${className}`}
    >
      <span className="h-2 w-2 rounded-full bg-emerald-600" />
      ELIGIBLE · {evaluation.score}/100 Match
    </span>
  );
}
