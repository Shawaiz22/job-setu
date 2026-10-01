import type { RequirementSource } from "@/modules/eligibility/types";

interface ClauseCitationProps {
  source: RequirementSource;
  className?: string;
}

export function ClauseCitation({
  source,
  className = "",
}: ClauseCitationProps) {
  if (source.type === "notification") {
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-700 ${className}`}
      >
        <span className="font-semibold text-neutral-900">Doc Citation:</span>
        <span className="font-mono text-neutral-800">{source.clause}</span>
        {source.page && (
          <span className="text-neutral-500">(p. {source.page})</span>
        )}
      </div>
    );
  }

  if (source.type === "scheme") {
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-700 ${className}`}
      >
        <span className="font-semibold text-neutral-900">Scheme Clause:</span>
        <span className="font-mono text-neutral-800">{source.clause}</span>
      </div>
    );
  }

  if (source.type === "interview_evidence") {
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-600 ${className}`}
      >
        <span>Interview Evidence:</span>
        <span className="font-semibold text-neutral-800">
          {source.matchCount}/{source.sampleSize} verified
        </span>
      </div>
    );
  }

  if (source.type === "job_description") {
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-600 ${className}`}
      >
        <span>JD Excerpt:</span>
        <span className="text-neutral-700 italic">
          &quot;{source.excerpt}&quot;
        </span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] text-neutral-600 ${className}`}
    >
      <span>Rule Note:</span>
      <span>{source.note}</span>
    </div>
  );
}
