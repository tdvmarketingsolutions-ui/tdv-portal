"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Settings, LogOut, ChevronsUpDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AccountMenuProps = {
  email: string;
  fullName?: string | null;
  accountHref?: string;
  settingsHref?: string;
};

export function AccountMenu({
  email,
  fullName,
  accountHref = "/settings#account",
  settingsHref = "/settings#instellingen",
}: AccountMenuProps) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayName = fullName?.trim() || email;
  const initials = getInitials(fullName, email);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div ref={containerRef} className="relative">
      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-0 mb-2 w-full min-w-56 rounded-xl border border-border bg-surface p-1 shadow-lg dark:border-border-dark dark:bg-surface-dark"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-ink-muted dark:text-ink-dark-muted" title={email}>
              {email}
            </p>
          </div>

          <div className="my-1 h-px bg-border dark:bg-border-dark" />

          <Link
            href={accountHref}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink transition-colors hover:bg-canvas dark:text-ink-dark dark:hover:bg-canvas-dark"
          >
            <User size={16} strokeWidth={1.75} />
            Account
          </Link>
          <Link
            href={settingsHref}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink transition-colors hover:bg-canvas dark:text-ink-dark dark:hover:bg-canvas-dark"
          >
            <Settings size={16} strokeWidth={1.75} />
            Instellingen
          </Link>

          <div className="my-1 h-px bg-border dark:bg-border-dark" />

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-status-danger transition-colors hover:bg-canvas disabled:opacity-60 dark:hover:bg-canvas-dark"
          >
            <LogOut size={16} strokeWidth={1.75} />
            {loggingOut ? "Bezig met uitloggen…" : "Uitloggen"}
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-canvas dark:hover:bg-canvas-dark"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-medium text-white">
          {initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{displayName}</span>
          <span className="block truncate text-xs text-ink-muted dark:text-ink-dark-muted">{email}</span>
        </span>
        <ChevronsUpDown size={16} strokeWidth={1.75} className="shrink-0 text-ink-muted dark:text-ink-dark-muted" />
      </button>
    </div>
  );
}

function getInitials(fullName: string | null | undefined, email: string): string {
  if (fullName?.trim()) {
    const parts = fullName.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
    return (first + last).toUpperCase();
  }
  return (email[0] ?? "?").toUpperCase();
}
