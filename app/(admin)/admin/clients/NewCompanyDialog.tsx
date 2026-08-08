"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { companySchema, type CompanyFormValues } from "./schema";
import { createCompanyAction } from "./actions";

export function NewCompanyDialog() {
  const router = useRouter();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormValues>({ resolver: zodResolver(companySchema) });

  async function onSubmit(values: CompanyFormValues) {
    const result = await createCompanyAction(values);
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
        Nieuwe klant
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Nieuwe klant">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input label="Bedrijfsnaam" placeholder="Acme BV" error={errors.name?.message} {...register("name")} />
          <Input
            label="Slug"
            placeholder="acme-bv"
            hint="Gebruikt in URLs, wordt automatisch genormaliseerd."
            error={errors.slug?.message}
            {...register("slug")}
          />
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
