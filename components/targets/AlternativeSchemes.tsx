"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export interface MatchingScheme {
  id: string;
  title: string;
  department: string;
  score: number;
}

interface AlternativeSchemesProps {
  schemes: MatchingScheme[];
}

export function AlternativeSchemes({ schemes }: AlternativeSchemesProps) {
  const [trackingIds, setTrackingIds] = useState<
    Record<string, "idle" | "adding" | "added">
  >({});

  if (!schemes || schemes.length === 0) {
    return null;
  }

  async function handleTrackScheme(scheme: MatchingScheme) {
    setTrackingIds((prev) => ({ ...prev, [scheme.id]: "adding" }));
    try {
      const res = await fetch("/api/v1/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "scheme",
          sourceId: scheme.id,
          title: scheme.title,
        }),
      });

      if (res.ok) {
        setTrackingIds((prev) => ({ ...prev, [scheme.id]: "added" }));
      } else {
        setTrackingIds((prev) => ({ ...prev, [scheme.id]: "idle" }));
      }
    } catch {
      setTrackingIds((prev) => ({ ...prev, [scheme.id]: "idle" }));
    }
  }

  return (
    <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6 shadow-xs">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-600" />
          <h3 className="text-base font-bold text-emerald-800 dark:text-emerald-300">
            Don&apos;t Lose Momentum — MP Welfare Schemes You Qualify For
          </h3>
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed">
          While this statutory recruitment is currently blocked, your profile
          qualifies for the following active Madhya Pradesh welfare and stipend
          programs right now:
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {schemes.map((scheme) => {
          const status = trackingIds[scheme.id] || "idle";

          return (
            <div
              key={scheme.id}
              className="bg-card flex flex-col justify-between rounded-xl border border-emerald-500/20 p-4 shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                    {scheme.score}% Eligible
                  </span>
                  <span className="text-muted-foreground text-[11px] font-medium uppercase">
                    MP Scheme
                  </span>
                </div>
                <h4 className="text-foreground mt-2 line-clamp-2 text-sm font-semibold">
                  {scheme.title}
                </h4>
                <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                  {scheme.department}
                </p>
              </div>

              <div className="border-border/50 mt-4 flex items-center justify-between border-t pt-3">
                {status === "added" ? (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    ✓ Tracked in Workspace
                  </span>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleTrackScheme(scheme)}
                    disabled={status === "adding"}
                    className="h-8 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                  >
                    {status === "adding" ? "Adding..." : "+ Track Scheme"}
                  </Button>
                )}

                <Link
                  href="/targets/new"
                  className="text-muted-foreground hover:text-foreground text-xs"
                >
                  View details →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
