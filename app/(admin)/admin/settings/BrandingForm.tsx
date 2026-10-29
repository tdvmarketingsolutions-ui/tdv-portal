"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { brandingSchema, type BrandingFormValues } from "./branding-schema";
import { updateBrandingAction } from "./actions";
import { accentTokens, TDV_ACCENT } from "@/lib/brand/accent";

const HEX = /^#[0-9a-fA-F]{6}$/;

// Triplet "r g b" uit accentTokens().vars → bruikbare CSS-kleur.
const rgb = (triplet: string | undefined) => (triplet ? `rgb(${triplet})` : undefined);

export function BrandingForm({
  brandName,
  accentColor,
  supportEmail,
}: {
  brandName: string | null;
  accentColor: string | null;
  supportEmail: string | null;
}) {
  const router = useRouter();
  const { push } = useToast();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      brandName: brandName ?? "",
      accentColor: accentColor ?? "",
      supportEmail: supportEmail ?? "",
    },
  });
  const liveAccentColor = watch("accentColor");
  const validLive = HEX.test(liveAccentColor ?? "") ? liveAccentColor! : null;
  // Dezelfde afleiding als het portaal zelf (lib/brand/accent.ts): de preview
  // toont wat klanten echt zien, niet de ruwe invoer. Leeg = TDV-standaard.
  const tokens = accentTokens(validLive);

  async function onSubmit(values: BrandingFormValues) {
    const result = await updateBrandingAction(values);
    if (result.error) {
      push(result.error, "error");
      return;
    }
    push("Branding bijgewerkt.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Input
        label="Weergavenaam"
        placeholder="TDV Marketing Solutions"
        hint="Getoond in de zijbalk en op meldingen. Leeg = standaardnaam van je bureau."
        error={errors.brandName?.message}
        {...register("brandName")}
      />
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <Input
              label="Accentkleur"
              placeholder={TDV_ACCENT}
              hint="Hex-kleurcode voor knoppen en accenten. Leeg = standaardkleur."
              error={errors.accentColor?.message}
              {...register("accentColor")}
            />
          </div>
          <label className="mt-[26px] shrink-0">
            <span className="sr-only">Kies een accentkleur</span>
            <input
              type="color"
              value={(validLive ?? TDV_ACCENT).toLowerCase()}
              onChange={(e) => setValue("accentColor", e.target.value.toUpperCase(), { shouldValidate: true, shouldDirty: true })}
              className="focus-ring block h-[42px] w-[42px] cursor-pointer rounded-xl border border-border-strong bg-surface p-1 dark:border-border-strong-dark dark:bg-surface-dark sm:h-[38px] sm:w-[38px]"
            />
          </label>
        </div>

        <div className="grid gap-2 sm:grid-cols-2" aria-label="Voorbeeld van de accentkleur">
          {/* Bewust zonder dark:-varianten: dit vak toont altijd de lichte modus. */}
          <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
            <span
              className="inline-flex h-8 items-center rounded-lg px-3 text-sm font-medium"
              style={{ backgroundColor: rgb(tokens.vars["--accent-l"]), color: rgb(tokens.vars["--accent-l-fg"]) }}
            >
              Knop
            </span>
            <span className="text-sm font-medium" style={{ color: rgb(tokens.vars["--accent-l-text"]) }}>
              Link in tekst
            </span>
            <span className="ml-auto text-xs text-ink-muted">licht</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border-dark bg-surface-dark p-3">
            <span
              className="inline-flex h-8 items-center rounded-lg px-3 text-sm font-medium"
              style={{ backgroundColor: rgb(tokens.vars["--accent-d"]), color: rgb(tokens.vars["--accent-d-fg"]) }}
            >
              Knop
            </span>
            <span className="text-sm font-medium" style={{ color: rgb(tokens.vars["--accent-d"]) }}>
              Link in tekst
            </span>
            <span className="ml-auto text-xs text-ink-dark-muted">donker</span>
          </div>
        </div>

        {validLive && tokens.adjusted && (
          <p role="status" className="text-sm text-ink-muted dark:text-ink-dark-muted">
            Deze kleur is te licht voor leesbare tekst op knoppen. Het portaal gebruikt daarom{" "}
            <span className="font-mono text-ink dark:text-ink-dark">{tokens.accent}</span>: dezelfde tint, iets donkerder.
          </p>
        )}
      </div>
      <Input
        label="Contact-e-mailadres"
        type="email"
        placeholder="support@jouwbureau.be"
        hint="Getoond aan klanten waar relevant. Leeg = geen apart contactadres."
        error={errors.supportEmail?.message}
        {...register("supportEmail")}
      />
      <Button type="submit" loading={isSubmitting}>
        Opslaan
      </Button>
    </form>
  );
}
