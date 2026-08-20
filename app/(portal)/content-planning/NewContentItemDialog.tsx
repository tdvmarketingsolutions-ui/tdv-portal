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
import { CONTENT_CHANNEL_LABEL } from "@/lib/content-status";
import { newContentItemSchema, type NewContentItemFormValues } from "./schema";
import { createContentItemAction } from "./actions";

export function NewContentItemDialog() {
  const router = useRouter();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewContentItemFormValues>({
    resolver: zodResolver(newContentItemSchema),
    defaultValues: { channels: ["instagram"] },
  });

  async function onSubmit(values: NewContentItemFormValues) {
    const result = await createContentItemAction(values);
    if (result.error) {
      push(result.error, "error");
      return;
    }
    push(`"${values.title}" aangemaakt.`);
    reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={16} strokeWidth={1.75} />
        Content voorstellen
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Content voorstellen">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input label="Titel" placeholder="Lancering nieuwe collectie" error={errors.title?.message} {...register("title")} />
          <fieldset>
            <legend className="mb-1 block text-sm font-medium">Kanalen</legend>
            <div className="flex flex-wrap gap-3">
              {Object.entries(CONTENT_CHANNEL_LABEL).map(([value, label]) => (
                <label key={value} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    value={value}
                    {...register("channels")}
                    className="h-4 w-4 rounded border-border text-accent focus:ring-accent dark:border-border-dark"
                  />
                  {label}
                </label>
              ))}
            </div>
            {errors.channels && <p className="mt-1 text-xs text-status-danger">{errors.channels.message}</p>}
          </fieldset>
          <Textarea label="Tekst (optioneel)" rows={3} error={errors.caption?.message} {...register("caption")} />
          <Input label="Gewenste datum (optioneel)" type="date" error={errors.scheduledFor?.message} {...register("scheduledFor")} />
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
