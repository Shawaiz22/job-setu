import Link from "next/link";
import { auth } from "@/auth";
import { AuthButtons } from "@/components/auth-buttons";

export async function Header() {
  const session = await auth();

  return (
    <header className="border-border/60 bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="font-semibold tracking-tight hover:opacity-90"
          >
            Job Setu
          </Link>
          <span className="text-muted-foreground hidden font-mono text-xs sm:inline">
            MP Eligibility Engine
          </span>
        </div>
        <div className="flex items-center gap-4">
          {session?.user && (
            <>
              <Link
                href="/targets"
                className="text-muted-foreground hover:text-foreground hidden text-xs font-medium transition-colors sm:inline"
              >
                Targets
              </Link>
              <Link
                href="/profile"
                className="text-muted-foreground hover:text-foreground hidden text-xs font-medium transition-colors sm:inline"
              >
                Profile
              </Link>
              {session.user.isAdmin && (
                <Link
                  href="/admin/notifications"
                  className="hidden rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-200 sm:inline"
                >
                  Admin
                </Link>
              )}
            </>
          )}
          <AuthButtons user={session?.user} />
        </div>
      </div>
    </header>
  );
}
