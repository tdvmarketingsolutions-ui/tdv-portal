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
              // Huisstijl v1.1: het accent zit alleen in het icoon van het
              // actieve item — geen gekleurde balk of vlak.
              "focus-ring flex h-10 items-center gap-3 rounded-xl px-3 text-sm transition-colors duration-150 ease-brand",
              active
                ? "bg-surface font-medium text-ink shadow-card dark:bg-surface-dark dark:text-ink-dark"
                : "text-ink-muted hover:bg-ink/5 hover:text-ink dark:text-ink-dark-muted dark:hover:bg-ink-dark/5 dark:hover:text-ink-dark"
            )}
          >
            <Icon size={18} strokeWidth={1.75} className={active ? "text-accent-text" : undefined} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
