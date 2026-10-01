"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TargetCard, type TargetItem } from "@/components/targets/TargetCard";

export default function TargetsDashboardPage() {
  const router = useRouter();
  const [targets, setTargets] = useState<TargetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "eligible" | "blocked">("all");

  useEffect(() => {
    let active = true;

    async function fetchTargets() {
      try {
        const res = await fetch("/api/v1/targets");
        if (res.status === 401) {
          router.push("/login");
          return;
        }

        if (!res.ok) {
          throw new Error("Failed to load targets");
        }

        const data = await res.json();
        if (active) {
          setTargets(data.targets || []);
        }
      } catch (err: unknown) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Error loading targets",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchTargets();

    return () => {
      active = false;
    };
  }, [router]);

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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            Target Workspace
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Real-time clause verification against MP Government recruitments,
            welfare schemes, and career paths.
          </p>
        </div>
        <Link href="/targets/new">
          <Button className="bg-neutral-900 text-white hover:bg-neutral-800">
            + Add Target
          </Button>
        </Link>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {/* Summary KPI Counters */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
          <div className="text-xs font-medium text-neutral-500">
            Total Targets
          </div>
          <div className="mt-1 text-2xl font-bold text-neutral-900">
            {loading ? "..." : targets.length}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs">
          <div className="text-xs font-medium text-emerald-700">Eligible</div>
          <div className="mt-1 text-2xl font-bold text-emerald-900">
            {loading ? "..." : eligibleCount}
          </div>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 shadow-2xs">
          <div className="text-xs font-medium text-rose-700">Blocked</div>
          <div className="mt-1 text-2xl font-bold text-rose-900">
            {loading ? "..." : blockedCount}
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-2xs">
          <div className="text-xs font-medium text-amber-700">
            Needs Profile
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-900">
            {loading ? "..." : needsInfoCount}
          </div>
        </div>
      </div>

      {/* Filter Tabs if targets exist */}
      {!loading && targets.length > 0 && (
        <div className="mt-8 flex items-center justify-between">
          <div className="flex rounded-lg border border-neutral-200 bg-neutral-100 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-md px-3 py-1.5 transition ${
                filter === "all"
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              All ({targets.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("eligible")}
              className={`rounded-md px-3 py-1.5 transition ${
                filter === "eligible"
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Eligible ({eligibleCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("blocked")}
              className={`rounded-md px-3 py-1.5 transition ${
                filter === "blocked"
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Blocked ({blockedCount})
            </button>
          </div>

          <div className="text-xs text-neutral-500">
            Showing {filteredTargets.length} items
          </div>
        </div>
      )}

      {/* Target Content Grid / Loading / Empty State */}
      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-64 animate-pulse rounded-xl border border-neutral-200 bg-neutral-100/70 p-5"
              />
            ))}
          </div>
        ) : targets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/70 p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-200 text-xl font-bold text-neutral-600">
              🎯
            </div>
            <h3 className="mt-4 text-base font-semibold text-neutral-900">
              No targets tracked yet
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">
              Select verified MP recruitment notifications, welfare schemes, or
              career paths to run deterministic clause checks.
            </p>
            <div className="mt-6">
              <Link href="/targets/new">
                <Button className="bg-neutral-900 text-white hover:bg-neutral-800">
                  Browse Opportunities & Add Target
                </Button>
              </Link>
            </div>
          </div>
        ) : filteredTargets.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
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
