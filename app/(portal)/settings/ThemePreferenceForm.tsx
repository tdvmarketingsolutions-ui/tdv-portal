"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Monitor, Sun, Moon } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { cn } from "@/lib/utils";
import { THEME_OPTIONS, type ThemePreference } from "@/lib/theme";
import { updateThemePreferenceAction } from "./actions";

const ICONS = { system: Monitor, light: Sun, dark: Moon } as const;

export function ThemePreferenceForm({ preference }: { preference: ThemePreference }) {
  const router = useRouter();
  const { push } = useToast();
  const [selected, setSelected] = useState(preference);
  const [pending, startTransition] = useTransition();

  function choose(next: ThemePreference) {
    if (next === selected) return;
    const previous = selected;
    setSelected(next);
    startTransition(async () => {
      const result = await updateThemePreferenceAction(next);
      if (result.error) {
        setSelected(previous);
        push(result.error, "error");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div role="radiogroup" aria-label="Weergave" className="inline-flex rounded-xl border border-border-strong bg-surface-sunken p-1 dark:border-border-strong-dark dark:bg-surface-sunken-dark">
      {THEME_OPTIONS.map(({ value, label }) => {
        const Icon = ICONS[value];
        const active = selected === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={pending}
            onClick={() => choose(value)}
            className={cn(
              "focus-ring inline-flex h-8 items-center gap-2 rounded-lg px-3 text-sm transition-colors duration-150 ease-brand disabled:cursor-wait",
              active
                ? "bg-surface font-medium text-ink shadow-card dark:bg-surface-dark dark:text-ink-dark"
                : "text-ink-muted hover:text-ink dark:text-ink-dark-muted dark:hover:text-ink-dark"
            )}
          >
            <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
