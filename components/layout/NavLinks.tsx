"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PORTAL_NAV_ITEMS, ADMIN_NAV_ITEMS } from "@/lib/navigation";

// `items` is intentionally not accepted as a prop: the array holds Lucide
// icon *components* (functions), and function values can't be passed from a
// Server Component into a Client Component (RSC serialization boundary).
// Selecting the array internally from a plain `variant` string keeps every
// caller safe regardless of whether it's rendered from server or client code.
export function NavLinks({ variant, onNavigate }: { variant: "portal" | "admin"; onNavigate?: () => void }) {
  const items = variant === "portal" ? PORTAL_NAV_ITEMS : ADMIN_NAV_ITEMS;
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname?.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
              active
                ? "bg-accent-soft font-medium text-accent dark:bg-accent/15 dark:text-accent-dark"
                : "text-ink-muted hover:bg-canvas hover:text-ink dark:text-ink-dark-muted dark:hover:bg-canvas-dark dark:hover:text-ink-dark"
            )}
          >
            <Icon size={18} strokeWidth={1.75} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
