import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

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
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft dark:bg-accent/10">
        <Icon size={22} strokeWidth={1.75} className="text-accent dark:text-accent-dark" />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
