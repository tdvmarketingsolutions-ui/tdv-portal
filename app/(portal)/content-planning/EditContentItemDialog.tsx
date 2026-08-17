"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Upload } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { CONTENT_CHANNEL_LABEL } from "@/lib/content-status";
import type { ContentChannel } from "@/types/domain";
import { editContentItemSchema, type EditContentItemFormValues } from "./schema";
import { updateContentItemAction, uploadContentItemVisualAction } from "./actions";

export function EditContentItemDialog({
  contentItemId,
  title,
  caption,
  channel,
  scheduledFor,
  visualFileName,
}: {
  contentItemId: string;
  title: string;
  caption: string | null;
  channel: ContentChannel;
  scheduledFor: string | null;
  visualFileName: string | null;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditContentItemFormValues>({
    resolver: zodResolver(editContentItemSchema),
    defaultValues: {
      title,
      caption: caption ?? "",
      channel,
      scheduledFor: scheduledFor ? scheduledFor.slice(0, 10) : "",
    },
  });

  async function onSubmit(values: EditContentItemFormValues) {
    const result = await updateContentItemAction(contentItemId, values);
    if (result.error) {
      push(result.error, "error");
      return;
    }
    push("Content-item bijgewerkt.");
    router.refresh();
  }

  async function handleVisualChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadContentItemVisualAction(contentItemId, formData);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (result.error) {
      push(result.error, "error");
      return;
    }
    push("Visual bijgewerkt.");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${title} bewerken`}
        className="shrink-0 rounded p-0.5 text-current opacity-70 transition-opacity hover:opacity-100"
      >
        <Pencil size={11} strokeWidth={2} />
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title={`${title} bewerken`}>
        <div className="space-y-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input label="Titel" error={errors.title?.message} {...register("title")} />
            <Select label="Kanaal" {...register("channel")}>
              {Object.entries(CONTENT_CHANNEL_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Textarea label="Tekst (optioneel)" rows={3} error={errors.caption?.message} {...register("caption")} />
            <Input label="Gepland voor (optioneel)" type="date" error={errors.scheduledFor?.message} {...register("scheduledFor")} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Sluiten
              </Button>
              <Button type="submit" loading={isSubmitting}>
                Opslaan
              </Button>
            </div>
          </form>

          <div className="border-t border-border pt-4 dark:border-border-dark">
            <p className="mb-2 text-sm font-medium">Visual</p>
            <p className="mb-2 text-xs text-ink-muted dark:text-ink-dark-muted">
              {visualFileName ?? "Nog geen visual gekoppeld."}
            </p>
            <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleVisualChange} />
            <Button type="button" variant="secondary" size="sm" loading={uploading} onClick={() => fileInputRef.current?.click()}>
              {!uploading && <Upload size={14} strokeWidth={1.75} />}
              {visualFileName ? "Visual vervangen" : "Visual uploaden"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
