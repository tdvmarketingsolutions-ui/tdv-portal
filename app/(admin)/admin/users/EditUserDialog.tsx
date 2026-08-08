"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { editUserRoleSchema, type EditUserRoleFormValues } from "./schema";
import { updateUserRoleAction } from "./actions";
import type { UserRole } from "@/types/domain";

const ROLE_LABEL: Record<string, string> = {
  tdv_admin: "TDV Admin",
  tdv_staff: "TDV Staff",
  client_admin: "Klant (admin)",
  client_member: "Klant (lid)",
};

export function EditUserDialog({
  userId,
  userName,
  currentRole,
  currentCompanyId,
  companies,
}: {
  userId: string;
  userName: string;
  currentRole: UserRole;
  currentCompanyId: string | null;
  companies: { id: string; name: string }[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditUserRoleFormValues>({
    resolver: zodResolver(editUserRoleSchema),
    defaultValues: { role: currentRole, companyId: currentCompanyId ?? "" },
  });
  const role = watch("role");
  const needsCompany = role === "client_admin" || role === "client_member";

  async function onSubmit(values: EditUserRoleFormValues) {
    const result = await updateUserRoleAction(userId, values);
    if (result.error) {
      push(result.error, "error");
      return;
    }
    push("Gebruiker bijgewerkt.");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${userName} bewerken`}
        className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-canvas hover:text-ink dark:text-ink-dark-muted dark:hover:bg-canvas-dark dark:hover:text-ink-dark"
      >
        <Pencil size={15} strokeWidth={1.75} />
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title={`${userName} bewerken`}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
              Opslaan
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
