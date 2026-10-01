import Link from "next/link";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Kariyar Setu — MP Government Eligibility Verification Platform",
  description:
    "Deterministic eligibility verification for Madhya Pradesh government opportunities and welfare schemes. Every verdict cites the official statutory clause.",
};

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Hero Section */}
      <section className="border-border/60 from-background via-muted/20 to-background relative w-full overflow-hidden border-b bg-gradient-to-b py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <div className="border-primary/20 bg-primary/5 text-primary inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold shadow-xs">
            <span className="bg-primary flex h-2 w-2 rounded-full" />
            <span>
              Madhya Pradesh Statutory Eligibility Verification Engine
            </span>
          </div>

          <h1 className="text-foreground mt-8 text-4xl font-extrabold tracking-tight sm:text-6xl sm:leading-tight">
            Every platform recommends. <br className="hidden sm:inline" />
            <span className="from-primary via-primary/80 to-primary/60 bg-gradient-to-r bg-clip-text text-transparent">
              We decide eligibility.
            </span>
          </h1>

          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-base sm:text-lg sm:leading-relaxed">
            Enter your academic and demographic details once. Kariyar Setu
            deterministically checks your profile against every MP government
            recruitment notification and welfare scheme — citing the exact
            statutory clause every single time.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {session?.user ? (
              session.user.isAdmin ? (
                <Link href="/admin/notifications">
                  <Button size="lg" className="px-8 shadow-sm">
                    Open Admin Notification Console →
                  </Button>
                </Link>
              ) : (
                <Link href="/targets">
                  <Button size="lg" className="px-8 shadow-sm">
                    Open Your Target Workspace →
                  </Button>
                </Link>
              )
            ) : (
              <>
                <Link href="/register">
                  <Button size="lg" className="px-8 shadow-sm">
                    Get Started Free →
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="px-6">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
            <Link href="/targets/new">
              <Button variant="ghost" size="lg" className="px-6">
                Browse Live Circulars
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive Showcase Preview */}
      <section className="border-border/60 bg-muted/10 w-full border-b py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              Verdicts, Not Recommendations
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              See how our pure engine verifies your candidate criteria with
              clause-level citations.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Example Card 1: Eligible */}
            <div className="bg-card rounded-2xl border-2 border-emerald-500/30 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-md bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-700 dark:text-sky-300">
                  Government Post
                </span>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  ELIGIBLE · 92% Match
                </span>
              </div>
              <h3 className="text-foreground mt-3 text-lg font-bold">
                MPPSC State Services Examination 2026
              </h3>
              <p className="text-muted-foreground mt-1 text-xs">
                General Administration Department · Madhya Pradesh
              </p>

              <div className="border-border/60 mt-5 space-y-2.5 border-t pt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground flex items-center gap-1.5 font-medium">
                    <span className="text-emerald-600">✓</span> Age within 21–40
                    years (OBC Relaxation)
                  </span>
                  <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-[10px]">
                    Rule 4(1)(b)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground flex items-center gap-1.5 font-medium">
                    <span className="text-emerald-600">✓</span> Graduate in
                    Science / Engineering
                  </span>
                  <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-[10px]">
                    Clause 6.2
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground flex items-center gap-1.5 font-medium">
                    <span className="text-emerald-600">✓</span> Madhya Pradesh
                    Domicile Active
                  </span>
                  <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-[10px]">
                    Gazette #104
                  </span>
                </div>
              </div>
            </div>

            {/* Example Card 2: Blocked with exact clause */}
            <div className="border-destructive/30 bg-card rounded-2xl border-2 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-md bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300">
                  Uniformed Post
                </span>
                <span className="bg-destructive/15 text-destructive rounded-full px-3 py-1 text-xs font-bold">
                  BLOCKED · Statutory Disqualification
                </span>
              </div>
              <h3 className="text-foreground mt-3 text-lg font-bold">
                MP Police Sub-Inspector (Executive)
              </h3>
              <p className="text-muted-foreground mt-1 text-xs">
                Madhya Pradesh Police Headquarters · Bhopal
              </p>

              <div className="border-border/60 mt-5 space-y-2.5 border-t pt-4">
                <div className="border-destructive/20 bg-destructive/5 rounded-xl border p-3 text-xs">
                  <div className="text-destructive font-semibold">
                    Mandatory Rule Failure: Age Limit Exceeded
                  </div>
                  <p className="text-destructive/80 mt-1">
                    Maximum permissible age for UR is 33 years. Candidate age is
                    33 years 8 months (Shortfall: 8 months).
                  </p>
                  <p className="text-muted-foreground mt-2 font-mono text-[11px]">
                    Citation: MP Police Executive Cadre Recruitment Rules 2021,
                    Sec 7(3).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="w-full py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              Engineered for Fairness &amp; Transparency
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Built strictly to eliminate confusion, false promises, and
              outdated recruitment circulars.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="border-border/80 bg-card rounded-2xl border p-6 shadow-xs">
              <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl font-bold">
                ⚙️
              </div>
              <h3 className="text-foreground mt-4 text-base font-bold">
                Pure Deterministic Logic
              </h3>
              <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                Zero AI hallucinations in decisions. Eligibility evaluations are
                pure functions: inputs in, reproducible verdict out, with zero
                database side-effects.
              </p>
            </div>

            <div className="border-border/80 bg-card rounded-2xl border p-6 shadow-xs">
              <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl font-bold">
                📜
              </div>
              <h3 className="text-foreground mt-4 text-base font-bold">
                Official Gazette Citations
              </h3>
              <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                Every requirement is explicitly tied to an official
                notification, gazette notification number, or statutory rule
                clause so candidates know exactly why.
              </p>
            </div>

            <div className="border-border/80 bg-card rounded-2xl border p-6 shadow-xs">
              <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl font-bold">
                🔒
              </div>
              <h3 className="text-foreground mt-4 text-base font-bold">
                AES-256-GCM Privacy
              </h3>
              <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                Sensitive caste categories, dates of birth, and domicile status
                are encrypted at rest and protected by purpose-bound, versioned
                consent.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-border/60 bg-muted/20 w-full border-t py-12">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <h2 className="text-foreground text-xl font-bold sm:text-2xl">
            Ready to track your MP Government career path?
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Sign up in seconds, configure your profile, and receive instant
            eligibility verdicts.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link href="/register">
              <Button>Create Candidate Account</Button>
            </Link>
            <Link href="/targets/new">
              <Button variant="outline">Explore Opportunities</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
