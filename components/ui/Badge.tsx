import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "blue" | "amber" | "violet" | "green" | "red" | "gray";

// Each tone's dark:text-status-x-dark variant exists because the plain
// light-mode color measured under WCAG AA's 4.5:1 against the dark
// X-500/10 badge background — see tailwind.config.ts.
export const TONE_CLASS: Record<BadgeTone, string> = {
  blue: "bg-blue-50 text-status-new dark:bg-blue-500/10 dark:text-status-new-dark",
  amber: "bg-amber-50 text-status-progress dark:bg-amber-500/10 dark:text-status-progress-dark",
  violet: "bg-violet-50 text-status-waiting dark:bg-violet-500/10 dark:text-status-waiting-dark",
  green: "bg-green-50 text-status-done dark:bg-green-500/10 dark:text-status-done-dark",
  red: "bg-red-50 text-status-danger dark:bg-red-500/10 dark:text-status-danger-dark",
  gray: "bg-canvas text-ink-muted dark:bg-canvas-dark dark:text-ink-dark-muted",
};

export function Badge({ tone = "gray", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-medium", TONE_CLASS[tone], className)}>
      {children}
    </span>
  );
}
