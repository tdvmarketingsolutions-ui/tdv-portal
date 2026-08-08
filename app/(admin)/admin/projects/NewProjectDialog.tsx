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
import { newProjectSchema, type NewProjectFormValues } from "./schema";
import { createProjectAction } from "./actions";

export function NewProjectDialog({ companies }: { companies: { id: string; name: string }[] }) {
  const router = useRouter();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewProjectFormValues>({ resolver: zodResolver(newProjectSchema) });

  async function onSubmit(values: NewProjectFormValues) {
    const result = await createProjectAction(values);
    if (result.error) {
      push(result.error, "error");
      return;
    }
    push(`"${values.name}" aangemaakt.`);
    reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={16} strokeWidth={1.75} />
        Nieuw project
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Nieuw project">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Select label="Klant" error={errors.companyId?.message} {...register("companyId")}>
            <option value="">Kies een klant…</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input label="Projectnaam" placeholder="Website Redesign" error={errors.name?.message} {...register("name")} />
          <Textarea label="Beschrijving (optioneel)" rows={3} error={errors.description?.message} {...register("description")} />
          <Input label="Deadline (optioneel)" type="date" error={errors.deadline?.message} {...register("deadline")} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Annuleren
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Aanmaken
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
