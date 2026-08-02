"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { projectCommentSchema, type ProjectCommentFormValues } from "./schema";
import { addProjectCommentAction } from "./actions";

export function CommentForm({ projectId }: { projectId: string }) {
  const { push } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectCommentFormValues>({ resolver: zodResolver(projectCommentSchema) });

  async function onSubmit(values: ProjectCommentFormValues) {
    const result = await addProjectCommentAction(projectId, values);
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
