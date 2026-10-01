"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ClauseCitation } from "@/components/targets/ClauseCitation";
import type { Requirement } from "@/modules/eligibility/types";

export interface OpportunityItem {
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

interface AdminNotificationsViewProps {
  initialOpportunities: OpportunityItem[];
}

export function AdminNotificationsView({
  initialOpportunities,
}: AdminNotificationsViewProps) {
  const [opportunities, setOpportunities] =
    useState<OpportunityItem[]>(initialOpportunities);
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

      setFile(null);
      setPasteText("");
      setCustomTitle("");
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

  return (
    <div className="space-y-8">
      {/* Ingestion Panel */}
      <div className="border-border/80 bg-card rounded-2xl border p-6 shadow-xs">
        <div className="border-border/60 flex items-center justify-between border-b pb-4">
          <h2 className="text-foreground text-base font-bold">
            Ingest New Document
          </h2>
          <div className="border-border bg-muted/50 flex rounded-lg border p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setIngestMode("pdf")}
              className={`rounded px-3 py-1 transition ${
                ingestMode === "pdf"
                  ? "bg-background text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              PDF Upload
            </button>
            <button
              type="button"
              onClick={() => setIngestMode("paste")}
              className={`rounded px-3 py-1 transition ${
                ingestMode === "paste"
                  ? "bg-background text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Paste Text / JD
            </button>
          </div>
        </div>

        <form onSubmit={handleIngestSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="text-foreground block text-xs font-semibold">
                Kind
              </label>
              <select
                value={kind}
                onChange={(e) =>
                  setKind(e.target.value as "govt_post" | "scheme")
                }
                className="border-input bg-background text-foreground focus:ring-ring mt-1 w-full rounded-lg border px-3 py-2 text-xs focus:ring-1 focus:outline-none"
              >
                <option value="govt_post">Government Post</option>
                <option value="scheme">Welfare Scheme</option>
              </select>
            </div>
            <div>
              <label className="text-foreground block text-xs font-semibold">
                Title Override (Optional)
              </label>
              <input
                type="text"
                placeholder="Auto-extracted if blank"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="border-input bg-background text-foreground focus:ring-ring mt-1 w-full rounded-lg border px-3 py-2 text-xs focus:ring-1 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-foreground block text-xs font-semibold">
                Department Override (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. MPPSC or Revenue Dept"
                value={customDept}
                onChange={(e) => setCustomDept(e.target.value)}
                className="border-input bg-background text-foreground focus:ring-ring mt-1 w-full rounded-lg border px-3 py-2 text-xs focus:ring-1 focus:outline-none"
              />
            </div>
          </div>

          {ingestMode === "pdf" ? (
            <div>
              <label className="text-foreground block text-xs font-semibold">
                Official PDF Document
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-muted-foreground file:bg-muted file:text-foreground hover:file:bg-muted/80 mt-1 block w-full text-xs file:mr-4 file:rounded-lg file:border-0 file:px-4 file:py-2 file:text-xs file:font-semibold"
              />
            </div>
          ) : (
            <div>
              <label className="text-foreground block text-xs font-semibold">
                Notification Text or Job Description Excerpt
              </label>
              <textarea
                rows={5}
                placeholder="Paste notification advertisement text, eligibility clauses, or JD requirements here..."
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                className="border-input bg-background text-foreground focus:ring-ring mt-1 w-full rounded-lg border p-3 font-mono text-xs focus:ring-1 focus:outline-none"
              />
            </div>
          )}

          {ingestMessage && (
            <div
              className={`rounded-lg p-3 text-xs font-medium ${
                ingestMessage.type === "success"
                  ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-destructive/30 bg-destructive/10 text-destructive border"
              }`}
            >
              {ingestMessage.text}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={ingesting}
              className="text-xs font-medium"
            >
              {ingesting
                ? "Extracting with Gemini..."
                : "Extract Rules with AI →"}
            </Button>
          </div>
        </form>
      </div>

      {/* Review & Publish Section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-foreground text-lg font-bold">
            Ingested Opportunities
          </h2>
          <p className="text-muted-foreground text-xs">
            Draft opportunities must be published to live before appearing in
            student evaluations.
          </p>
        </div>

        <div className="border-border bg-muted/50 flex rounded-lg border p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded px-3 py-1.5 transition ${
              filter === "all"
                ? "bg-background text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({opportunities.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("draft")}
            className={`rounded px-3 py-1.5 transition ${
              filter === "draft"
                ? "bg-background font-semibold text-amber-600 shadow-xs dark:text-amber-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Drafts ({draftCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("live")}
            className={`rounded px-3 py-1.5 transition ${
              filter === "live"
                ? "bg-background font-semibold text-emerald-600 shadow-xs dark:text-emerald-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Live ({liveCount})
          </button>
        </div>
      </div>

      {/* Opportunities List */}
      <div className="space-y-4">
        {filteredOpportunities.length === 0 ? (
          <div className="border-border bg-card text-muted-foreground rounded-xl border p-8 text-center text-sm">
            No opportunities match the selected filter.
          </div>
        ) : (
          filteredOpportunities.map((opp) => {
            const isExpanded = expandedId === opp.id;

            return (
              <div
                key={opp.id}
                className="border-border/80 bg-card rounded-xl border p-5 shadow-xs"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase ${
                          opp.status === "draft"
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                            : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        }`}
                      >
                        {opp.status}
                      </span>
                      <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-[11px] font-medium">
                        {opp.kind}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {opp.department}
                      </span>
                    </div>

                    <h3 className="text-foreground text-base font-semibold">
                      {opp.title}
                    </h3>

                    <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
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
                          <span className="font-mono text-[11px]">
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
                      className="border-input bg-background text-foreground hover:bg-muted rounded-md border px-3 py-1.5 text-xs font-medium"
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
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive px-3 py-1.5 text-xs"
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Expanded Clause Breakdown */}
                {isExpanded && (
                  <div className="border-border/60 mt-4 border-t pt-4">
                    <h4 className="text-foreground text-xs font-bold tracking-wide uppercase">
                      Extracted Rules &amp; Clause Citations
                    </h4>
                    <div className="mt-3 space-y-3">
                      {opp.requirements.map((req, idx) => (
                        <div
                          key={idx}
                          className="border-border/60 bg-muted/30 rounded-lg border p-3 text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-foreground font-semibold">
                              {req.label}
                            </span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                                  req.blocking
                                    ? "bg-destructive/15 text-destructive"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {req.blocking ? "Blocking" : "Weighted"}
                              </span>
                              <span className="text-muted-foreground text-[11px]">
                                Weight: {req.weight}/10
                              </span>
                            </div>
                          </div>
                          <div className="border-border/40 mt-2 border-t pt-2">
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
