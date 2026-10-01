"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button, buttonVariants } from "@/components/ui/button";

interface AuthButtonsProps {
  user?: {
    email?: string | null;
    isAdmin?: boolean;
  } | null;
}

export function AuthButtons({ user }: AuthButtonsProps) {
  if (user) {
    const destination = user.isAdmin ? "/admin/notifications" : "/profile";

    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href={destination}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs font-medium transition-colors"
        >
          <span className="max-w-[130px] truncate sm:max-w-[200px]">
            {user.email}
          </span>
          {user.isAdmin && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
              Admin
            </span>
          )}
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Log out
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        Log in
      </Link>
      <Link
        href="/register"
        className={buttonVariants({ variant: "default", size: "sm" })}
      >
        Register
      </Link>
    </div>
  );
}
