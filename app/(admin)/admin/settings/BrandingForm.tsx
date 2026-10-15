"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { brandingSchema, type BrandingFormValues } from "./branding-schema";
import { updateBrandingAction } from "./actions";

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
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Input
            label="Accentkleur"
            placeholder="#AF4B2F"
            hint="Hex-kleurcode voor knoppen en accenten. Leeg = standaardkleur."
            error={errors.accentColor?.message}
            {...register("accentColor")}
          />
        </div>
        <div
          className="mb-1 h-10 w-10 shrink-0 rounded-lg border border-border dark:border-border-dark"
          style={{ backgroundColor: /^#[0-9a-fA-F]{6}$/.test(liveAccentColor ?? "") ? liveAccentColor : undefined }}
          aria-hidden="true"
        />
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
