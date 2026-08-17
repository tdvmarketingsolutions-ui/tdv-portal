"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { editProfileSchema, type EditProfileFormValues } from "./schema";
import { updateProfileAction } from "./actions";

export function EditProfileForm({ fullName }: { fullName: string | null }) {
  const router = useRouter();
  const { push } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: { fullName: fullName ?? "" },
  });

  async function onSubmit(values: EditProfileFormValues) {
    const result = await updateProfileAction(values);
    if (result.error) {
      push(result.error, "error");
      return;
    }
    push("Profiel bijgewerkt.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-3" noValidate>
      <div className="flex-1">
        <Input label="Naam" error={errors.fullName?.message} {...register("fullName")} />
      </div>
      <Button type="submit" loading={isSubmitting}>
        Opslaan
      </Button>
    </form>
  );
}
