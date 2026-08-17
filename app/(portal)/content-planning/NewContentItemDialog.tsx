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
    defaultValues: { channel: "instagram" },
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
          <Select label="Kanaal" {...register("channel")}>
            {Object.entries(CONTENT_CHANNEL_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
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
