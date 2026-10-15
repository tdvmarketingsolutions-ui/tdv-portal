"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, FolderKanban, Inbox, CalendarDays, FileStack, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { globalSearchAction } from "./search-actions";
import type { SearchResult, SearchResultType } from "@/lib/data/search";

const TYPE_ICON: Record<SearchResultType, LucideIcon> = {
  project: FolderKanban,
  ticket: Inbox,
  content_item: CalendarDays,
  file: FileStack,
};

const DEBOUNCE_MS = 250;

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setActiveIndex(0);
  }, []);

  // Global ⌘K / Ctrl+K to open from anywhere in the portal, same pattern as
  // Dialog's own Escape-to-close — a plain keydown listener rather than a
  // library, since this is the only shortcut in the app so far.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        // Closing via ⌘K has to reset state exactly like every other close
        // path (Escape, overlay click, picking a result) — otherwise the
        // previous query/results are still sitting there the next time this
        // reopens, which looks like search is stuck showing old results.
        if (open) {
          close();
        } else {
          setOpen(true);
        }
      } else if (e.key === "Escape" && open) {
        close();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, close]);

  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      // Opens synchronously with the dialog, so the input is ready to type
      // into immediately rather than waiting a tick.
      inputRef.current?.focus();
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const requestId = ++requestIdRef.current;
    const timeout = setTimeout(async () => {
      const found = await globalSearchAction(trimmed);
      // Drop stale responses — a slow earlier request resolving after a
      // faster later one would otherwise flash outdated results.
      if (requestIdRef.current === requestId) {
        setResults(found);
        setLoading(false);
        setActiveIndex(0);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [query]);

  function goTo(result: SearchResult) {
    close();
    router.push(result.href);
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const result = results[activeIndex];
      if (result) goTo(result);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-xl border border-border bg-canvas px-3 py-2 text-left text-sm text-ink-muted transition-colors hover:border-ink-muted/40 dark:border-border-dark dark:bg-canvas-dark dark:text-ink-dark-muted"
      >
        <Search size={16} strokeWidth={1.75} />
        <span className="flex-1">Zoeken…</span>
        <kbd className="hidden rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-ink-muted dark:border-border-dark dark:bg-surface-dark dark:text-ink-dark-muted sm:inline">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-[15vh]">
          <div className="fixed inset-0 bg-ink/40 backdrop-blur-[2px] dark:bg-black/60" onClick={close} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Zoeken"
            className="card toast-enter relative w-full max-w-lg overflow-hidden p-0"
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-3 dark:border-border-dark">
              <Search size={18} strokeWidth={1.75} className="shrink-0 text-ink-muted dark:text-ink-dark-muted" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Zoek in projecten, aanvragen, content, bestanden…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-muted dark:placeholder:text-ink-dark-muted"
              />
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {loading && <p className="px-3 py-6 text-center text-sm text-ink-muted dark:text-ink-dark-muted">Zoeken…</p>}

              {!loading && query.trim().length >= 2 && results.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-ink-muted dark:text-ink-dark-muted">Geen resultaten.</p>
              )}

              {!loading && query.trim().length < 2 && (
                <p className="px-3 py-6 text-center text-sm text-ink-muted dark:text-ink-dark-muted">
                  Typ minstens 2 tekens om te zoeken.
                </p>
              )}

              {!loading &&
                results.map((result, index) => {
                  const Icon = TYPE_ICON[result.type];
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      type="button"
                      onClick={() => goTo(result)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                        index === activeIndex
                          ? "bg-accent-soft text-accent dark:bg-accent/15 dark:text-accent-dark"
                          : "text-ink hover:bg-canvas dark:text-ink-dark dark:hover:bg-canvas-dark"
                      )}
                    >
                      <Icon size={16} strokeWidth={1.75} className="shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{result.title}</span>
                      <span className="shrink-0 text-xs text-ink-muted dark:text-ink-dark-muted">{result.subtitle}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
