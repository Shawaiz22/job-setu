import Link from "next/link";
import { auth } from "@/auth";
import { AuthButtons } from "@/components/auth-buttons";

export async function Header() {
  const session = await auth();
  const isAdmin = session?.user?.isAdmin === true;

  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-40 w-full border-b backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-foreground flex items-center gap-2 font-bold tracking-tight transition-opacity hover:opacity-90"
          >
            <span className="bg-primary text-primary-foreground flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black shadow-xs">
              KS
            </span>
            <span className="text-base sm:text-lg">Kariyar Setu</span>
          </Link>
          <span className="text-muted-foreground/80 hidden text-xs font-medium sm:inline">
            MP Opportunities &amp; Schemes
          </span>
        </div>

        <nav className="flex items-center gap-2 sm:gap-4">
          {session?.user && (
            <>
              {isAdmin ? (
                <Link
                  href="/admin/notifications"
                  className="rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-500/20 dark:text-amber-300"
                >
                  Admin Console
                </Link>
              ) : (
                <>
                  <Link
                    href="/targets"
                    className="text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                  >
                    Targets
                  </Link>
                  <Link
                    href="/profile"
                    className="text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                  >
                    Profile
                  </Link>
                </>
              )}
            </>
          )}
          <AuthButtons user={session?.user} />
        </nav>
      </div>
    </header>
  );
}
