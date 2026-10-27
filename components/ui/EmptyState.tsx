import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { brandTitle } from "@/lib/utils";

// Huisstijl v1.1: rustig lijnicoon van 32px, titel in Epilogue 600 (kleine
// letters, punt), één zin uitleg, hooguit één knop. Geen accentkleur: een
// lege staat is geen actie.
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 p-10 text-center">
      <Icon size={32} strokeWidth={1.75} className="text-ink-subtle dark:text-ink-subtle-dark" aria-hidden="true" />
      <div className="max-w-[40ch]">
        <p className="font-display text-h3 font-semibold">{brandTitle(title)}</p>
        {description && (
          <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
