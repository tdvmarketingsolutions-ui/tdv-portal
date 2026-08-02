import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  loading?: boolean;
}

const VARIANT_CLASS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  danger:
    "inline-flex items-center justify-center rounded-xl bg-status-danger px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-status-danger/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-status-danger",
  ghost:
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-canvas hover:text-ink dark:text-ink-dark-muted dark:hover:bg-canvas-dark dark:hover:text-ink-dark",
};

const SIZE_CLASS: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, disabled, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(VARIANT_CLASS[variant], SIZE_CLASS[size], "gap-2 disabled:cursor-not-allowed disabled:opacity-60", className)}
        {...props}
      >
        {loading && <Loader2 size={16} strokeWidth={2} className="animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
