"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface TargetHeaderProps {
  id: string;
  kind: string;
  title: string;
}

export function TargetHeader({ id, kind, title }: TargetHeaderProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        "Are you sure you want to remove this target from your workspace?",
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/targets/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete target");
      }

      router.push("/targets");
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Could not delete target");
      setDeleting(false);
    }
  }

  return (
    <div className="border-border/80 flex flex-col items-start justify-between gap-4 border-b pb-5 sm:flex-row sm:items-center">
      <div>
        <Link
          href="/targets"
          className="text-muted-foreground hover:text-foreground inline-flex items-center text-xs font-semibold transition-colors"
        >
          ← Back to Targets
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="bg-muted text-muted-foreground rounded-md px-2.5 py-0.5 text-xs font-semibold tracking-wider uppercase">
            {kind.replace("_", " ")}
          </span>
          <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-center">
        <Button
          type="button"
          variant="outline"
          onClick={handleDelete}
          disabled={deleting}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive text-xs"
        >
          {deleting ? "Removing..." : "Remove Target"}
        </Button>
      </div>
    </div>
  );
}
