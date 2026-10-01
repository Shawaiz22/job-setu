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
            <Link
              href="/profile"
              className="text-muted-foreground hover:text-foreground hidden text-xs font-medium transition-colors sm:inline"
            >
              Profile
            </Link>
          )}
          <AuthButtons user={session?.user} />
        </div>
      </div>
    </header>
  );
}
