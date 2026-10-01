"use client";

import Link from "next/link";
import { VerdictBadge } from "./VerdictBadge";
import { ClauseCitation } from "./ClauseCitation";
import type { EvaluationResult } from "@/modules/eligibility/types";

export interface TargetItem {
  id: string;
  kind: "govt_post" | "scheme" | "job_description" | "archetype";
  sourceId: string;
  title: string;
  requirementsCount: number;
  evaluation: EvaluationResult | null;
}

interface TargetCardProps {
  target: TargetItem;
  onDelete?: (id: string) => void;
  deleting?: boolean;
}

const KIND_LABELS: Record<string, string> = {
  govt_post: "Government Post",
  scheme: "Welfare Scheme",
  job_description: "Job Description",
  archetype: "Role Archetype",
};

export function TargetCard({ target, onDelete, deleting }: TargetCardProps) {
  const { evaluation } = target;

  return (
    <div className="flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5 shadow-xs transition hover:shadow-md">
      <div>
        {/* Header with kind and verdict badge */}
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-neutral-600 uppercase">
            {KIND_LABELS[target.kind] || target.kind}
          </span>
          <VerdictBadge evaluation={evaluation} />
        </div>

        {/* Title */}
        <h3 className="mt-3 line-clamp-2 text-base font-semibold text-neutral-900">
          {target.title}
        </h3>

        {/* Verdict Specific Details */}
        {evaluation?.status === "blocked" && (
          <div className="mt-4 space-y-2 rounded-lg border border-rose-200 bg-rose-50/60 p-3 text-xs">
            <div className="font-semibold text-rose-900">
              Mandatory Rule Failure:
            </div>
            {evaluation.failures.map((f, i) => (
              <div key={i} className="space-y-1">
                <p className="text-rose-800">
                  <span className="font-medium">• {f.reason}</span>
                  {f.shortfall && (
                    <span className="ml-1 text-rose-600">({f.shortfall})</span>
                  )}
                </p>
                <div className="pt-0.5">
                  <ClauseCitation source={f.requirement.source} />
                </div>
              </div>
            ))}
          </div>
        )}

        {evaluation?.status === "eligible" && (
          <div className="mt-4 space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-medium text-neutral-700">
                <span>Eligibility Match Score</span>
                <span className="font-bold text-emerald-700">
                  {evaluation.score}%
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${evaluation.score}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 text-neutral-600">
              <span>
                <strong className="text-neutral-900">
                  {evaluation.met.length}
                </strong>{" "}
                rules met
              </span>
              <span>•</span>
              <span>
                <strong className="text-neutral-900">
                  {evaluation.gaps.length}
                </strong>{" "}
                priority gaps
              </span>
            </div>

            {evaluation.gaps[0] && (
              <div className="rounded-md border border-neutral-200 bg-neutral-50 p-2 text-neutral-700">
                <span className="font-semibold text-neutral-900">Top Gap:</span>{" "}
                {evaluation.gaps[0].requirement.label}
              </div>
            )}
          </div>
        )}

        {!evaluation && (
          <p className="mt-4 text-xs text-neutral-500">
            Profile details needed to calculate eligibility verdict.
          </p>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4">
        <Link
          href={`/targets/${target.id}`}
          className="inline-flex items-center text-xs font-semibold text-neutral-900 hover:text-neutral-600"
        >
          View Workspace →
        </Link>

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(target.id)}
            disabled={deleting}
            className="text-xs font-medium text-neutral-400 hover:text-rose-600 disabled:opacity-50"
          >
            {deleting ? "Removing..." : "Remove"}
          </button>
        )}
      </div>
    </div>
  );
}
