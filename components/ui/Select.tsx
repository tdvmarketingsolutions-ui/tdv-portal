import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, id, className, children, ...props }, ref) => {
    const selectId = id ?? props.name;
    const errorId = error ? `${selectId}-error` : undefined;
    const hintId = hint ? `${selectId}-hint` : undefined;

    return (
      <div>
        {label && (
          <label htmlFor={selectId} className="mb-1 block text-sm font-medium">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn("input appearance-none pr-9", error && "input-error", className)}
            aria-invalid={!!error}
            aria-describedby={[errorId, hintId].filter(Boolean).join(" ") || undefined}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            size={16}
            strokeWidth={1.75}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted dark:text-ink-dark-muted"
          />
        </div>
        {hint && !error && (
          <p id={hintId} className="mt-1 text-xs text-ink-muted dark:text-ink-dark-muted">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-xs text-status-danger">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";
