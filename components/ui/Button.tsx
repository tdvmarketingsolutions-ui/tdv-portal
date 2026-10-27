import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  loading?: boolean;
}

// Huisstijl v1.1, sectie 0.5/2: hooguit één primaire knop per scherm; danger
// is een secundaire knop in de foutkleur (het definitieve bevestigen gebeurt
// met danger-solid in een dialog). Het accent wordt nooit voor fouten gebruikt.
const VARIANT_CLASS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  danger: "btn-danger-solid",
  ghost: "btn-ghost",
};

const SIZE_CLASS: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-xs",
  md: "",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, disabled, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(VARIANT_CLASS[variant], SIZE_CLASS[size], className)}
        {...props}
      >
        {loading && <Loader2 size={16} strokeWidth={2} className="animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
