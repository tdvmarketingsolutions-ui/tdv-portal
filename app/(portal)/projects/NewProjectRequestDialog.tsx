"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { PROJECT_REQUEST_TYPE_LABEL, BUDGET_INDICATION_LABEL } from "@/lib/project-request-status";
import { newProjectRequestSchema, type NewProjectRequestFormValues } from "./schema";
import { createProjectRequestAction } from "./actions";

export function NewProjectRequestDialog() {
  const router = useRouter();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewProjectRequestFormValues>({ resolver: zodResolver(newProjectRequestSchema) });

  async function onSubmit(values: NewProjectRequestFormValues) {
    const result = await createProjectRequestAction(values);
    if (result.error) {
      push(result.error, "error");
      return;
    }
    push("Projectaanvraag verstuurd — je krijgt meteen een prijsvoorstel te zien.");
    reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={16} strokeWidth={1.75} />
        Project aanvragen
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Project aanvragen">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <p className="text-sm text-ink-muted dark:text-ink-dark-muted">
            Een paar keuzes en je krijgt meteen een prijsvoorstel van TDV te zien.
          </p>
          <Input label="Titel" placeholder="Bv. Nieuwe website" error={errors.title?.message} {...register("title")} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Type project" error={errors.projectType?.message} {...register("projectType")}>
              <option value="">Kies…</option>
              {Object.entries(PROJECT_REQUEST_TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Select label="Budget-indicatie" error={errors.budgetIndication?.message} {...register("budgetIndication")}>
              <option value="">Kies…</option>
              {Object.entries(BUDGET_INDICATION_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <Textarea
            label="Vertel wat meer over je project (optioneel)"
            rows={4}
            error={errors.description?.message}
            {...register("description")}
          />
          <Input
            label="Gewenste deadline (optioneel)"
            type="date"
            error={errors.desiredDeadline?.message}
            {...register("desiredDeadline")}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Annuleren
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Versturen
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
