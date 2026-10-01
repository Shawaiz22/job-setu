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
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          className="text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
        >
          {user.email}
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
