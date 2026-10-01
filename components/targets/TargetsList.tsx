"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TargetCard, type TargetItem } from "./TargetCard";

interface TargetsListProps {
  initialTargets: TargetItem[];
}

export function TargetsList({ initialTargets }: TargetsListProps) {
  const [targets, setTargets] = useState<TargetItem[]>(initialTargets);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "eligible" | "blocked">("all");

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to remove this target?")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/v1/targets/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to remove target");
      }

      setTargets((prev) => prev.filter((t) => t.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Could not delete target");
    } finally {
      setDeletingId(null);
    }
  }

  const eligibleCount = targets.filter(
    (t) => t.evaluation?.status === "eligible",
  ).length;
  const blockedCount = targets.filter(
    (t) => t.evaluation?.status === "blocked",
  ).length;
  const needsInfoCount = targets.filter((t) => !t.evaluation).length;

  const filteredTargets = targets.filter((t) => {
    if (filter === "eligible") return t.evaluation?.status === "eligible";
    if (filter === "blocked") return t.evaluation?.status === "blocked";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Summary KPI Counters */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="border-border/80 bg-card rounded-xl border p-4 shadow-xs">
          <div className="text-muted-foreground text-xs font-medium">
            Total Targets
          </div>
          <div className="text-foreground mt-1 text-2xl font-bold">
            {targets.length}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-xs">
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            Eligible
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {eligibleCount}
          </div>
        </div>

        <div className="border-destructive/20 bg-destructive/5 rounded-xl border p-4 shadow-xs">
          <div className="text-destructive text-xs font-semibold">Blocked</div>
          <div className="text-destructive mt-1 text-2xl font-bold">
            {blockedCount}
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-xs">
          <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
            Needs Profile
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-300">
            {needsInfoCount}
          </div>
        </div>
      </div>

      {/* Filter Tabs if targets exist */}
      {targets.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="border-border bg-muted/50 flex rounded-lg border p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-md px-3 py-1.5 transition ${
                filter === "all"
                  ? "bg-background text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({targets.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("eligible")}
              className={`rounded-md px-3 py-1.5 transition ${
                filter === "eligible"
                  ? "bg-background font-semibold text-emerald-600 shadow-xs dark:text-emerald-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Eligible ({eligibleCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("blocked")}
              className={`rounded-md px-3 py-1.5 transition ${
                filter === "blocked"
                  ? "bg-background text-destructive font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Blocked ({blockedCount})
            </button>
          </div>

          <div className="text-muted-foreground text-xs">
            Showing {filteredTargets.length} item
            {filteredTargets.length === 1 ? "" : "s"}
          </div>
        </div>
      )}

      {/* Target Content Grid / Empty States */}
      <div>
        {targets.length === 0 ? (
          <div className="border-border bg-muted/20 flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center">
            <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold">
              🎯
            </div>
            <h3 className="text-foreground mt-4 text-base font-semibold">
              No targets tracked yet
            </h3>
            <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm">
              Select verified MP recruitment notifications, welfare schemes, or
              career paths to run deterministic clause checks.
            </p>
            <div className="mt-6">
              <Link href="/targets/new">
                <Button>Browse Opportunities &amp; Add Target</Button>
              </Link>
            </div>
          </div>
        ) : filteredTargets.length === 0 ? (
          <div className="border-border bg-card text-muted-foreground rounded-xl border p-8 text-center text-sm">
            No targets match the selected filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTargets.map((target) => (
              <TargetCard
                key={target.id}
                target={target}
                onDelete={handleDelete}
                deleting={deletingId === target.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
