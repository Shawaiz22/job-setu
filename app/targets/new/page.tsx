"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Requirement } from "@/modules/eligibility/types";

interface OpportunityItem {
  id: string;
  kind: "govt_post" | "scheme";
  title: string;
  department: string;
  state: string;
  closesOn: string | null;
  requirements: Requirement[];
  sourceDocumentPath: string | null;
}

interface ArchetypeItem {
  id: string;
  title: string;
  requirements: Requirement[];
}

export default function NewTargetBrowserPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "govt_post" | "scheme" | "archetype"
  >("govt_post");
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [archetypes, setArchetypes] = useState<ArchetypeItem[]>([]);
  const [existingSourceIds, setExistingSourceIds] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [oppsRes, targetsRes] = await Promise.all([
          fetch("/api/v1/opportunities"),
          fetch("/api/v1/targets"),
        ]);

        if (targetsRes.status === 401) {
          router.push("/login");
          return;
        }

        if (!oppsRes.ok) {
          throw new Error("Failed to load opportunities");
        }

        const oppsData = await oppsRes.json();
        const targetsData = targetsRes.ok ? await targetsRes.json() : null;

        if (active) {
          setOpportunities(oppsData.opportunities || []);
          setArchetypes(oppsData.archetypes || []);

          if (targetsData?.targets) {
            const ids = new Set<string>(
              targetsData.targets.map(
                (t: { sourceId: string; title: string }) => t.sourceId,
              ),
            );
            // Also add titles for archetype fallback matching
            targetsData.targets.forEach((t: { title: string }) =>
              ids.add(t.title),
            );
            setExistingSourceIds(ids);
          }
        }
      } catch (err: unknown) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Error loading opportunities",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleAddTarget(
    kind: "govt_post" | "scheme" | "archetype",
    sourceId: string,
    title: string,
  ) {
    setAddingId(sourceId);
    try {
      const res = await fetch("/api/v1/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, sourceId, title }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add target");
      }

      setExistingSourceIds((prev) => new Set([...prev, sourceId, title]));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error adding target");
    } finally {
      setAddingId(null);
    }
  }

  const govtPosts = opportunities.filter((o) => o.kind === "govt_post");
  const schemes = opportunities.filter((o) => o.kind === "scheme");

  // Filtering based on search query
  const filteredGovt = govtPosts.filter(
    (o) =>
      o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.department.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredSchemes = schemes.filter(
    (o) =>
      o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.department.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredArchetypes = archetypes.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Back button and page title */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-5">
        <div>
          <Link
            href="/targets"
            className="inline-flex items-center text-xs font-semibold text-neutral-500 hover:text-neutral-900"
          >
            ← Back to Targets
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            Browse Opportunities & Targets
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Select verified MP notifications, schemes, or role archetypes to add
            to your personal eligibility tracker.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {/* Tabs and Search Bar */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-xl border border-neutral-200 bg-neutral-100 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("govt_post")}
            className={`rounded-lg px-4 py-2 transition ${
              activeTab === "govt_post"
                ? "bg-white text-neutral-900 shadow-xs"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Government Posts ({govtPosts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("scheme")}
            className={`rounded-lg px-4 py-2 transition ${
              activeTab === "scheme"
                ? "bg-white text-neutral-900 shadow-xs"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Welfare Schemes ({schemes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("archetype")}
            className={`rounded-lg px-4 py-2 transition ${
              activeTab === "archetype"
                ? "bg-white text-neutral-900 shadow-xs"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Role Archetypes ({archetypes.length})
          </button>
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or dept..."
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
          />
        </div>
      </div>

      {/* List Container */}
      <div className="mt-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-28 animate-pulse rounded-xl border border-neutral-200 bg-neutral-100/70 p-5"
              />
            ))}
          </div>
        ) : (
          <div>
            {/* Govt Posts Tab */}
            {activeTab === "govt_post" && (
              <div className="space-y-4">
                {filteredGovt.length === 0 ? (
                  <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
                    No government posts match your search.
                  </div>
                ) : (
                  filteredGovt.map((post) => {
                    const isAdded =
                      existingSourceIds.has(post.id) ||
                      existingSourceIds.has(post.title);
                    const isAdding = addingId === post.id;

                    return (
                      <div
                        key={post.id}
                        className="flex flex-col justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs transition hover:shadow-xs sm:flex-row sm:items-center"
                      >
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-800">
                              {post.department}
                            </span>
                            <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                              MP Domicile Verified
                            </span>
                          </div>
                          <h3 className="text-base font-semibold text-neutral-900">
                            {post.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                            <span>
                              {post.requirements.length} eligibility rules
                            </span>
                            {post.closesOn && (
                              <>
                                <span>•</span>
                                <span>
                                  Closes:{" "}
                                  {
                                    new Date(post.closesOn)
                                      .toISOString()
                                      .split("T")[0]
                                  }
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          {isAdded ? (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                              <svg
                                className="h-3.5 w-3.5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              In Targets
                            </span>
                          ) : (
                            <Button
                              type="button"
                              onClick={() =>
                                handleAddTarget(
                                  "govt_post",
                                  post.id,
                                  post.title,
                                )
                              }
                              disabled={isAdding}
                              className="bg-neutral-900 text-xs font-medium text-white hover:bg-neutral-800"
                            >
                              {isAdding ? "Adding..." : "+ Add Target"}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Schemes Tab */}
            {activeTab === "scheme" && (
              <div className="space-y-4">
                {filteredSchemes.length === 0 ? (
                  <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
                    No welfare schemes match your search.
                  </div>
                ) : (
                  filteredSchemes.map((scheme) => {
                    const isAdded =
                      existingSourceIds.has(scheme.id) ||
                      existingSourceIds.has(scheme.title);
                    const isAdding = addingId === scheme.id;

                    return (
                      <div
                        key={scheme.id}
                        className="flex flex-col justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs transition hover:shadow-xs sm:flex-row sm:items-center"
                      >
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-800">
                              {scheme.department}
                            </span>
                            <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                              State Welfare
                            </span>
                          </div>
                          <h3 className="text-base font-semibold text-neutral-900">
                            {scheme.title}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-neutral-500">
                            <span>
                              {scheme.requirements.length} eligibility rules
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          {isAdded ? (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                              <svg
                                className="h-3.5 w-3.5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              In Targets
                            </span>
                          ) : (
                            <Button
                              type="button"
                              onClick={() =>
                                handleAddTarget(
                                  "scheme",
                                  scheme.id,
                                  scheme.title,
                                )
                              }
                              disabled={isAdding}
                              className="bg-neutral-900 text-xs font-medium text-white hover:bg-neutral-800"
                            >
                              {isAdding ? "Adding..." : "+ Add Target"}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Archetypes Tab */}
            {activeTab === "archetype" && (
              <div className="space-y-4">
                {filteredArchetypes.length === 0 ? (
                  <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
                    No role archetypes match your search.
                  </div>
                ) : (
                  filteredArchetypes.map((arch) => {
                    const isAdded =
                      existingSourceIds.has(arch.id) ||
                      existingSourceIds.has(arch.title);
                    const isAdding = addingId === arch.id;

                    return (
                      <div
                        key={arch.id}
                        className="flex flex-col justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs transition hover:shadow-xs sm:flex-row sm:items-center"
                      >
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                              Industry Role
                            </span>
                            <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                              Private & Tech
                            </span>
                          </div>
                          <h3 className="text-base font-semibold text-neutral-900">
                            {arch.title}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-neutral-500">
                            <span>
                              {arch.requirements.length} skill & experience
                              rules
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          {isAdded ? (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                              <svg
                                className="h-3.5 w-3.5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              In Targets
                            </span>
                          ) : (
                            <Button
                              type="button"
                              onClick={() =>
                                handleAddTarget(
                                  "archetype",
                                  arch.id,
                                  arch.title,
                                )
                              }
                              disabled={isAdding}
                              className="bg-neutral-900 text-xs font-medium text-white hover:bg-neutral-800"
                            >
                              {isAdding ? "Adding..." : "+ Add Target"}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
