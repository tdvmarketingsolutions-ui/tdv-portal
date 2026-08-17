import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "blue" | "amber" | "violet" | "green" | "red" | "gray";

export const TONE_CLASS: Record<BadgeTone, string> = {
  blue: "bg-blue-50 text-status-new dark:bg-blue-500/10",
  amber: "bg-amber-50 text-status-progress dark:bg-amber-500/10",
  violet: "bg-violet-50 text-status-waiting dark:bg-violet-500/10",
  green: "bg-green-50 text-status-done dark:bg-green-500/10",
  red: "bg-red-50 text-status-danger dark:bg-red-500/10",
  gray: "bg-canvas text-ink-muted dark:bg-canvas-dark dark:text-ink-dark-muted",
};

export function Badge({ tone = "gray", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-medium", TONE_CLASS[tone], className)}>
      {children}
    </span>
  );
}
