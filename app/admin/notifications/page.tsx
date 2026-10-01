import Link from "next/link";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { opportunities } from "@/db/schema";
import {
  AdminNotificationsView,
  type OpportunityItem,
} from "@/components/admin/AdminNotificationsView";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Admin Notifications & Extraction — Kariyar Setu",
  description:
    "Extract deterministic, clause-cited eligibility rules from official MP recruitment PDFs and gazettes.",
};

export default async function AdminNotificationsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!session.user.isAdmin) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6">
        <div className="border-destructive/30 bg-destructive/10 mx-auto max-w-md rounded-2xl border p-8">
          <div className="bg-destructive/20 text-destructive inline-flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold">
            🛡️
          </div>
          <h2 className="text-foreground mt-4 text-xl font-bold">
            Access Restricted
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Administrative privileges are required to access the notification
            ingestion pipeline.
          </p>
          <div className="mt-6">
            <Link href="/">
              <Button variant="outline">Return to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Pre-load opportunities directly on the server
  const rawOpportunities = await db
    .select()
    .from(opportunities)
    .orderBy(desc(opportunities.createdAt));

  const initialOpportunities: OpportunityItem[] = rawOpportunities.map((o) => ({
    id: o.id,
    kind: o.kind as OpportunityItem["kind"],
    title: o.title,
    department: o.department,
    state: o.state,
    status: o.status as OpportunityItem["status"],
    closesOn: o.closesOn ? o.closesOn.toISOString() : null,
    requirements: o.requirements,
    sourceDocumentPath: o.sourceDocumentPath,
    createdAt: o.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      {/* Top Header */}
      <div className="border-border/80 border-b pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-primary/10 text-primary rounded-full px-3 py-0.5 text-xs font-bold uppercase">
            Admin Console
          </span>
          <span className="text-muted-foreground text-xs">
            Ingestion &amp; AI Extraction Pipeline
          </span>
        </div>
        <h1 className="text-foreground mt-2 text-3xl font-extrabold tracking-tight">
          Notification Ingestion &amp; Review
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Extract deterministic, clause-cited eligibility criteria from official
          recruitment PDFs and gazettes. All extracted items are stored as
          drafts until published.
        </p>
      </div>

      <AdminNotificationsView initialOpportunities={initialOpportunities} />
    </div>
  );
}
