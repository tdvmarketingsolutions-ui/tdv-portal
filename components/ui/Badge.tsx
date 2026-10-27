import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Huisstijl v1.1: statuspills krijgen hun eigen statuskleur, nooit het
// agency-accent (dat verandert per agency). new = nieuw/concept, progress =
// in uitvoering, waiting = wacht op iemand/te beoordelen, done = afgerond,
// danger = fout/vervallen, neutral = gearchiveerd of louter informatief.
export type BadgeTone = "new" | "progress" | "waiting" | "done" | "danger" | "neutral";

export const TONE_CLASS: Record<BadgeTone, string> = {
  new: "bg-new-soft text-new-on dark:bg-new-soft-dark dark:text-new-dark",
  progress: "bg-progress-soft text-progress-on dark:bg-progress-soft-dark dark:text-progress-dark",
  waiting: "bg-waiting-soft text-waiting-on dark:bg-waiting-soft-dark dark:text-waiting-dark",
  done: "bg-done-soft text-done-on dark:bg-done-soft-dark dark:text-done-dark",
  danger: "bg-danger-soft text-danger-on dark:bg-danger-soft-dark dark:text-danger-dark",
  neutral: "bg-ink/[0.06] text-ink-muted dark:bg-ink-dark/[0.06] dark:text-ink-dark-muted",
};

// Het bolletje in de pill, en losse statusbolletjes (kalender-agenda).
export const DOT_CLASS: Record<BadgeTone, string> = {
  new: "bg-new dark:bg-new-dark",
  progress: "bg-progress dark:bg-progress-dark",
  waiting: "bg-waiting dark:bg-waiting-dark",
  done: "bg-done dark:bg-done-dark",
  danger: "bg-danger dark:bg-danger-dark",
  neutral: "bg-ink-muted dark:bg-ink-dark-muted",
};

export function Badge({ tone = "neutral", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-pill px-2 text-xs font-medium",
        TONE_CLASS[tone],
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT_CLASS[tone])} aria-hidden="true" />
      {children}
    </span>
  );
}
