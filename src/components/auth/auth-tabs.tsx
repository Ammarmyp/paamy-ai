import Link from "next/link"

import { cn } from "@/lib/utils"

interface AuthTabsProps {
  active: "sign-in" | "sign-up"
}

export function AuthTabs({ active }: AuthTabsProps) {
  return (
    <nav
      aria-label="Authentication"
      className="mb-8 flex items-center gap-6 border-b border-surface-border pb-3"
    >
      <Link
        href="/sign-in"
        className={cn(
          "text-sm font-medium transition-colors",
          active === "sign-in"
            ? "text-copy-primary"
            : "text-copy-muted hover:text-copy-secondary"
        )}
      >
        Sign In
      </Link>
      <Link
        href="/sign-up"
        className={cn(
          "text-sm font-medium transition-colors",
          active === "sign-up"
            ? "text-copy-primary"
            : "text-copy-muted hover:text-copy-secondary"
        )}
      >
        Sign Up
      </Link>
    </nav>
  )
}
