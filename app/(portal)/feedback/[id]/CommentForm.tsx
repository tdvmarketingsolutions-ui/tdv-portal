"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { deliverableCommentSchema, type DeliverableCommentFormValues } from "./schema";
import { addDeliverableCommentAction } from "./actions";

export function CommentForm({ deliverableId, versionId }: { deliverableId: string; versionId: string }) {
  const router = useRouter();
  const { push } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DeliverableCommentFormValues>({ resolver: zodResolver(deliverableCommentSchema) });

  async function onSubmit(values: DeliverableCommentFormValues) {
    const result = await addDeliverableCommentAction(deliverableId, versionId, values);
    if (result.error) {
      push(result.error, "error");
      return;
    }
    reset();
    push("Opmerking geplaatst.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <Textarea
        label="Algemene opmerking"
        placeholder="Typ je opmerking…"
        rows={3}
        error={errors.body?.message}
        {...register("body")}
      />
      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting}>
          Plaatsen
        </Button>
      </div>
    </form>
  );
}
