"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { contentCommentSchema, type ContentCommentFormValues } from "./schema";
import { addContentCommentAction } from "./actions";

export function CommentForm({ contentItemId }: { contentItemId: string }) {
  const { push } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContentCommentFormValues>({ resolver: zodResolver(contentCommentSchema) });

  async function onSubmit(values: ContentCommentFormValues) {
    const result = await addContentCommentAction(contentItemId, values);
    if (result.error) {
      push(result.error, "error");
      return;
    }
    reset();
    push("Opmerking geplaatst.");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <Textarea
        label="Opmerking toevoegen"
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
