import { cn } from "@/lib/utils";

// Rustige pulse; globals.css zet animaties uit bij prefers-reduced-motion.
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-ink/5 dark:bg-ink-dark/5", className)}
      aria-hidden="true"
    />
  );
}
