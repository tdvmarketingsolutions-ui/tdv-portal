"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
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
    push("Projectaanvraag verstuurd — je ontvangt een offerte per e-mail.");
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
            Beschrijf kort wat je nodig hebt. TDV neemt contact op en stuurt een offerte per e-mail.
          </p>
          <Input label="Titel" placeholder="Bv. Nieuwe website" error={errors.title?.message} {...register("title")} />
          <Textarea label="Beschrijving (optioneel)" rows={4} error={errors.description?.message} {...register("description")} />
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
