"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { inviteUserSchema, type InviteUserFormValues } from "./schema";
import { inviteUserAction } from "./actions";

const ROLE_LABEL: Record<string, string> = {
  tdv_admin: "TDV Admin",
  tdv_staff: "TDV Staff",
  client_admin: "Klant (admin)",
  client_member: "Klant (lid)",
};

export function InviteUserDialog({
  companies,
  serviceRoleConfigured,
}: {
  companies: { id: string; name: string }[];
  serviceRoleConfigured: boolean;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteUserFormValues>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { role: "client_member" },
  });
  const role = watch("role");
  const needsCompany = role === "client_admin" || role === "client_member";

  async function onSubmit(values: InviteUserFormValues) {
    const result = await inviteUserAction(values);
    if (result.error) {
      push(result.error, "error");
      return;
    }
    push(`Uitnodiging verstuurd naar ${values.email}.`);
    reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus size={16} strokeWidth={1.75} />
        Gebruiker uitnodigen
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Gebruiker uitnodigen">
        {!serviceRoleConfigured ? (
          <div className="space-y-4">
            <p className="text-sm text-ink-muted dark:text-ink-dark-muted">
              Deze functie is nog niet geconfigureerd. Er ontbreekt een <code className="rounded bg-canvas px-1 py-0.5 dark:bg-canvas-dark">SUPABASE_SERVICE_ROLE_KEY</code> in
              de omgevingsvariabelen — voeg die toe (Supabase dashboard → Project Settings → API) om gebruikers te kunnen uitnodigen.
            </p>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Sluiten
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input label="E-mailadres" type="email" placeholder="naam@bedrijf.be" error={errors.email?.message} {...register("email")} />
            <Select label="Rol" {...register("role")}>
              {Object.entries(ROLE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            {needsCompany && (
              <Select label="Klant" error={errors.companyId?.message} {...register("companyId")}>
                <option value="">Kies een klant…</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Annuleren
              </Button>
              <Button type="submit" loading={isSubmitting}>
                Uitnodigen
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </>
  );
}
