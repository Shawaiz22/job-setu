"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ClauseCitation } from "@/components/targets/ClauseCitation";
import type { Requirement } from "@/modules/eligibility/types";

interface OpportunityItem {
  id: string;
  kind: "govt_post" | "scheme";
  title: string;
  department: string;
  state: string;
  status: "draft" | "live";
  closesOn: string | null;
  requirements: Requirement[];
  sourceDocumentPath: string | null;
  createdAt: string;
}

export default function AdminNotificationsPage() {
  const router = useRouter();

  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "draft" | "live">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Ingestion form state
  const [ingestMode, setIngestMode] = useState<"pdf" | "paste">("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customDept, setCustomDept] = useState("");
  const [kind, setKind] = useState<"govt_post" | "scheme">("govt_post");
  const [ingesting, setIngesting] = useState(false);
  const [ingestMessage, setIngestMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch("/api/v1/admin/notifications");
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (res.status === 403) {
          if (active)
            setAuthError(
              "Admin access privileges are required to view this portal.",
            );
          return;
        }
        if (!res.ok) {
          throw new Error("Failed to load notifications");
        }

        const data = await res.json();
        if (active) setOpportunities(data.opportunities || []);
      } catch (err: unknown) {
        if (active)
          setAuthError(
            err instanceof Error ? err.message : "Error loading data",
          );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleIngestSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIngesting(true);
    setIngestMessage(null);

    try {
      let res: Response;

      if (ingestMode === "pdf") {
        if (!file) {
          throw new Error("Please select a PDF file to upload");
        }
        const formData = new FormData();
        formData.append("file", file);
        formData.append("kind", kind);
        if (customTitle) formData.append("title", customTitle);
        if (customDept) formData.append("department", customDept);

        res = await fetch("/api/v1/admin/notifications", {
          method: "POST",
          body: formData,
        });
      } else {
        if (!pasteText.trim()) {
          throw new Error("Please enter notification or job description text");
        }
        res = await fetch("/api/v1/admin/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: pasteText,
            kind,
            title: customTitle || undefined,
            department: customDept || undefined,
          }),
        });
      }

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to extract notification");
      }

      setIngestMessage({
        type: "success",
        text: `Extracted ${json.extracted.requirementsCount} rule(s) successfully into Drafts (dropped ${json.extracted.droppedCount} un-cited).`,
      });

      // Clear form
      setFile(null);
      setPasteText("");
      setCustomTitle("");
      // Add newly extracted opportunity to list
      if (json.opportunity) {
        setOpportunities((prev) => [json.opportunity, ...prev]);
      }
    } catch (err: unknown) {
      setIngestMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Extraction failed",
      });
    } finally {
      setIngesting(false);
    }
  }

  async function handlePublish(id: string) {
    try {
      const res = await fetch(`/api/v1/admin/notifications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "live" }),
      });

      if (!res.ok) throw new Error("Failed to publish opportunity");

      setOpportunities((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: "live" } : o)),
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Publishing failed");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this opportunity?")) return;

    try {
      const res = await fetch(`/api/v1/admin/notifications/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");
      setOpportunities((prev) => prev.filter((o) => o.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Deletion failed");
    }
  }

  const draftCount = opportunities.filter((o) => o.status === "draft").length;
  const liveCount = opportunities.filter((o) => o.status === "live").length;

  const filteredOpportunities = opportunities.filter((o) => {
    if (filter === "draft") return o.status === "draft";
    if (filter === "live") return o.status === "live";
    return true;
  });

  if (authError) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center sm:px-6">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
          <h2 className="text-base font-bold text-rose-900">
            Access Restricted
          </h2>
          <p className="mt-1">{authError}</p>
          <div className="mt-4">
            <Link href="/">
              <Button variant="outline">Return Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Top Header */}
      <div className="border-b border-neutral-200 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900 uppercase">
            Admin Portal
          </span>
          <span className="text-xs text-neutral-500">M5 Ingestion Engine</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
          Notification Ingestion & Review
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Extract deterministic, clause-cited eligibility criteria from official
          recruitment PDFs and job descriptions. All extracted items are stored
          as drafts until published.
        </p>
      </div>

      {/* Ingestion Panel */}
      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <h2 className="text-base font-bold text-neutral-900">
            Ingest New Document
          </h2>
          <div className="flex rounded-lg border border-neutral-200 bg-neutral-100 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setIngestMode("pdf")}
              className={`rounded px-3 py-1 transition ${
                ingestMode === "pdf"
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              PDF Upload
            </button>
            <button
              type="button"
              onClick={() => setIngestMode("paste")}
              className={`rounded px-3 py-1 transition ${
                ingestMode === "paste"
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Paste Text / JD
            </button>
          </div>
        </div>

        <form onSubmit={handleIngestSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                Kind
              </label>
              <select
                value={kind}
                onChange={(e) =>
                  setKind(e.target.value as "govt_post" | "scheme")
                }
                className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-900 focus:outline-none"
              >
                <option value="govt_post">Government Post</option>
                <option value="scheme">Welfare Scheme</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                Title Override (Optional)
              </label>
              <input
                type="text"
                placeholder="Auto-extracted if blank"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                Department Override (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. MPPSC or Revenue Dept"
                value={customDept}
                onChange={(e) => setCustomDept(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-900 focus:outline-none"
              />
            </div>
          </div>

          {ingestMode === "pdf" ? (
            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                Official PDF Document
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mt-1 block w-full text-xs text-neutral-600 file:mr-4 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-neutral-700 hover:file:bg-neutral-200"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                Notification Text or Job Description Excerpt
              </label>
              <textarea
                rows={5}
                placeholder="Paste notification advertisement text, eligibility clauses, or JD requirements here..."
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-200 bg-white p-3 font-mono text-xs text-neutral-900 focus:outline-none"
              />
            </div>
          )}

          {ingestMessage && (
            <div
              className={`rounded-lg p-3 text-xs font-medium ${
                ingestMessage.type === "success"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border border-rose-200 bg-rose-50 text-rose-800"
              }`}
            >
              {ingestMessage.text}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={ingesting}
              className="bg-neutral-900 text-xs font-medium text-white hover:bg-neutral-800"
            >
              {ingesting
                ? "Extracting with Gemini..."
                : "Extract Rules with AI →"}
            </Button>
          </div>
        </form>
      </div>

      {/* Review & Publish Section */}
      <div className="mt-8 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">
            Ingested Opportunities
          </h2>
          <p className="text-xs text-neutral-500">
            Draft opportunities must be published to live before appearing in
            student evaluations.
          </p>
        </div>

        <div className="flex rounded-lg border border-neutral-200 bg-neutral-100 p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded px-3 py-1.5 transition ${
              filter === "all"
                ? "bg-white text-neutral-900 shadow-xs"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            All ({opportunities.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("draft")}
            className={`rounded px-3 py-1.5 transition ${
              filter === "draft"
                ? "bg-white text-neutral-900 shadow-xs"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Drafts ({draftCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("live")}
            className={`rounded px-3 py-1.5 transition ${
              filter === "live"
                ? "bg-white text-neutral-900 shadow-xs"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Live ({liveCount})
          </button>
        </div>
      </div>

      {/* Opportunities List */}
      <div className="mt-4 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="h-32 animate-pulse rounded-xl border border-neutral-200 bg-neutral-100/70"
              />
            ))}
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
            No opportunities match the selected filter.
          </div>
        ) : (
          filteredOpportunities.map((opp) => {
            const isExpanded = expandedId === opp.id;

            return (
              <div
                key={opp.id}
                className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase ${
                          opp.status === "draft"
                            ? "bg-amber-100 text-amber-900"
                            : "bg-emerald-100 text-emerald-900"
                        }`}
                      >
                        {opp.status}
                      </span>
                      <span className="rounded bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                        {opp.kind}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {opp.department}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-neutral-900">
                      {opp.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                      <span>{opp.requirements.length} extracted rules</span>
                      {opp.closesOn && (
                        <>
                          <span>•</span>
                          <span>
                            Closes:{" "}
                            {new Date(opp.closesOn).toISOString().split("T")[0]}
                          </span>
                        </>
                      )}
                      {opp.sourceDocumentPath && (
                        <>
                          <span>•</span>
                          <span className="font-mono">
                            Doc: {opp.sourceDocumentPath}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-start">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : opp.id)}
                      className="rounded border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      {isExpanded ? "Hide Rules ▲" : "Inspect Rules ▼"}
                    </button>

                    {opp.status === "draft" && (
                      <Button
                        type="button"
                        onClick={() => handlePublish(opp.id)}
                        className="bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Publish Live ✓
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDelete(opp.id)}
                      className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Expanded Clause Breakdown */}
                {isExpanded && (
                  <div className="mt-4 border-t border-neutral-100 pt-4">
                    <h4 className="text-xs font-bold text-neutral-900 uppercase">
                      Extracted Rules & Clause Citations
                    </h4>
                    <div className="mt-3 space-y-3">
                      {opp.requirements.map((req, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-neutral-100 bg-neutral-50/70 p-3 text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold text-neutral-900">
                              {req.label}
                            </span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                                  req.blocking
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-neutral-200 text-neutral-700"
                                }`}
                              >
                                {req.blocking ? "Blocking" : "Weighted"}
                              </span>
                              <span className="text-[11px] text-neutral-500">
                                Weight: {req.weight}/10
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 border-t border-neutral-200/60 pt-2">
                            <ClauseCitation source={req.source} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
