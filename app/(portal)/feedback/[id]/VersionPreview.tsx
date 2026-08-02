"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "@/components/ui/Dialog";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { deliverableCommentSchema, type DeliverableCommentFormValues } from "./schema";
import { addDeliverableCommentAction } from "./actions";

type Pin = { id: string; anchorX: number; anchorY: number; body: string };

export function VersionPreview({
  imageUrl,
  fileName,
  deliverableId,
  versionId,
  pins,
}: {
  imageUrl: string;
  fileName: string;
  deliverableId: string;
  versionId: string;
  pins: Pin[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const imgRef = useRef<HTMLDivElement>(null);
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DeliverableCommentFormValues>({ resolver: zodResolver(deliverableCommentSchema) });

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPendingPin({ x, y });
  }

  async function onSubmit(values: DeliverableCommentFormValues) {
    if (!pendingPin) return;
    const result = await addDeliverableCommentAction(deliverableId, versionId, {
      ...values,
      anchorX: pendingPin.x,
      anchorY: pendingPin.y,
    });
    if (result.error) {
      push(result.error, "error");
      return;
    }
    reset();
    setPendingPin(null);
    push("Opmerking geplaatst.");
    router.refresh();
  }

  return (
    <div>
      <div
        ref={imgRef}
        onClick={handleClick}
        className="relative cursor-crosshair overflow-hidden rounded-xl border border-border dark:border-border-dark"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={fileName} className="block w-full select-none" draggable={false} />
        {pins.map((pin, i) => (
          <div
            key={pin.id}
            title={pin.body}
            style={{ left: `${pin.anchorX}%`, top: `${pin.anchorY}%` }}
            className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-accent text-[11px] font-semibold text-white shadow-md"
          >
            {i + 1}
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-muted dark:text-ink-dark-muted">
        Klik ergens op de afbeelding om een opmerking op die plek te plaatsen.
      </p>

      <Dialog
        open={!!pendingPin}
        onClose={() => setPendingPin(null)}
        title="Opmerking op deze plek"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
          <Textarea
            label="Opmerking"
            placeholder="Wat valt je op deze plek op?"
            rows={3}
            error={errors.body?.message}
            {...register("body")}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setPendingPin(null)}>
              Annuleren
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Plaatsen
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
