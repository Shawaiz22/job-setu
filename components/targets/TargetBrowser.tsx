"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Requirement } from "@/modules/eligibility/types";

export interface OpportunityItem {
  id: string;
  kind: "govt_post" | "scheme";
  title: string;
  department: string;
  state: string;
  closesOn: string | null;
  requirements: Requirement[];
  sourceDocumentPath: string | null;
}

export interface ArchetypeItem {
  id: string;
  title: string;
  requirements: Requirement[];
}

interface TargetBrowserProps {
  opportunities: OpportunityItem[];
  archetypes: ArchetypeItem[];
  initialExistingSourceIds: string[];
}

export function TargetBrowser({
  opportunities,
  archetypes,
  initialExistingSourceIds,
}: TargetBrowserProps) {
  const [activeTab, setActiveTab] = useState<
    "govt_post" | "scheme" | "archetype"
  >("govt_post");
  const [existingSourceIds, setExistingSourceIds] = useState<Set<string>>(
    new Set(initialExistingSourceIds),
  );
  const [addingId, setAddingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
    <div className="space-y-6">
      {/* Tabs and Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="border-border bg-muted/50 flex flex-wrap rounded-xl border p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("govt_post")}
            className={`rounded-lg px-4 py-2 transition ${
              activeTab === "govt_post"
                ? "bg-background text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Government Posts ({govtPosts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("scheme")}
            className={`rounded-lg px-4 py-2 transition ${
              activeTab === "scheme"
                ? "bg-background text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Welfare Schemes ({schemes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("archetype")}
            className={`rounded-lg px-4 py-2 transition ${
              activeTab === "archetype"
                ? "bg-background text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
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
            className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring w-full rounded-lg border px-3 py-2 text-xs focus:ring-1 focus:outline-none"
          />
        </div>
      </div>

      {/* List Container */}
      <div>
        {/* Govt Posts Tab */}
        {activeTab === "govt_post" && (
          <div className="space-y-4">
            {filteredGovt.length === 0 ? (
              <div className="border-border bg-card text-muted-foreground rounded-xl border p-8 text-center text-sm">
                No government posts match your search query.
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
                    className="border-border/80 bg-card flex flex-col justify-between gap-4 rounded-xl border p-5 shadow-xs transition hover:shadow-md sm:flex-row sm:items-center"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:text-sky-300">
                          {post.department}
                        </span>
                        <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-[11px] font-medium">
                          MP Domicile Verified
                        </span>
                      </div>
                      <h3 className="text-foreground text-base font-semibold">
                        {post.title}
                      </h3>
                      <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
                        <span>
                          {post.requirements.length} statutory rule
                          {post.requirements.length === 1 ? "" : "s"}
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
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
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
                            handleAddTarget("govt_post", post.id, post.title)
                          }
                          disabled={isAdding}
                          size="sm"
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
              <div className="border-border bg-card text-muted-foreground rounded-xl border p-8 text-center text-sm">
                No welfare schemes match your search query.
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
                    className="border-border/80 bg-card flex flex-col justify-between gap-4 rounded-xl border p-5 shadow-xs transition hover:shadow-md sm:flex-row sm:items-center"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-purple-500/15 px-2 py-0.5 text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                          {scheme.department}
                        </span>
                        <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-[11px] font-medium">
                          State Welfare
                        </span>
                      </div>
                      <h3 className="text-foreground text-base font-semibold">
                        {scheme.title}
                      </h3>
                      <div className="text-muted-foreground flex items-center gap-3 text-xs">
                        <span>
                          {scheme.requirements.length} eligibility rule
                          {scheme.requirements.length === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {isAdded ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
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
                            handleAddTarget("scheme", scheme.id, scheme.title)
                          }
                          disabled={isAdding}
                          size="sm"
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
              <div className="border-border bg-card text-muted-foreground rounded-xl border p-8 text-center text-sm">
                No role archetypes match your search query.
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
                    className="border-border/80 bg-card flex flex-col justify-between gap-4 rounded-xl border p-5 shadow-xs transition hover:shadow-md sm:flex-row sm:items-center"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                          Industry Role
                        </span>
                        <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-[11px] font-medium">
                          Private &amp; Tech
                        </span>
                      </div>
                      <h3 className="text-foreground text-base font-semibold">
                        {arch.title}
                      </h3>
                      <div className="text-muted-foreground flex items-center gap-3 text-xs">
                        <span>
                          {arch.requirements.length} skill &amp; credential rule
                          {arch.requirements.length === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {isAdded ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
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
                            handleAddTarget("archetype", arch.id, arch.title)
                          }
                          disabled={isAdding}
                          size="sm"
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
    </div>
  );
}
