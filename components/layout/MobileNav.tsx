"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { NavLinks } from "@/components/layout/NavLinks";

export function MobileNav({
  variant,
  title,
  subtitle,
  userEmail,
  fullName,
  accountHref,
  settingsHref,
}: {
  variant: "portal" | "admin";
  title: string;
  subtitle?: string;
  userEmail: string;
  fullName?: string | null;
  accountHref?: string;
  settingsHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer whenever the route changes (link click, back/forward, etc.)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface px-4 dark:border-border-dark dark:bg-surface-dark md:hidden">
        <div>
          <span className="font-display text-base font-semibold">{title}</span>
          {subtitle && <span className="ml-1 text-sm text-ink-muted dark:text-ink-dark-muted">{subtitle}</span>}
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Menu openen"
          aria-expanded={open}
          className="rounded-lg p-2 text-ink transition-colors hover:bg-canvas dark:text-ink-dark dark:hover:bg-canvas-dark"
        >
          <Menu size={20} strokeWidth={1.75} />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-ink/40 backdrop-blur-[2px] dark:bg-black/60"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigatie"
            className="fixed inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-border bg-surface px-3 py-6 shadow-lg dark:border-border-dark dark:bg-surface-dark"
          >
            <div className="mb-8 flex items-center justify-between px-3">
              <div>
                <span className="font-display text-lg font-semibold">{title}</span>
                {subtitle && (
                  <span className="ml-1 text-sm text-ink-muted dark:text-ink-dark-muted">{subtitle}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Menu sluiten"
                className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-canvas hover:text-ink dark:text-ink-dark-muted dark:hover:bg-canvas-dark dark:hover:text-ink-dark"
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>

            <NavLinks variant={variant} onNavigate={() => setOpen(false)} />

            <div className="mt-4 border-t border-border pt-4 dark:border-border-dark">
              <AccountMenu email={userEmail} fullName={fullName} accountHref={accountHref} settingsHref={settingsHref} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
