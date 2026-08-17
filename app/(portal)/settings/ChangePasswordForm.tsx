"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { changePasswordSchema, type ChangePasswordFormValues } from "./schema";

export function ChangePasswordForm() {
  const { push } = useToast();
  const supabase = createClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({ resolver: zodResolver(changePasswordSchema) });

  async function onSubmit(values: ChangePasswordFormValues) {
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      push("Kon wachtwoord niet wijzigen. Probeer opnieuw.", "error");
      return;
    }
    reset();
    push("Wachtwoord gewijzigd.");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-sm space-y-4" noValidate>
      <PasswordInput
        label="Nieuw wachtwoord"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <PasswordInput
        label="Bevestig wachtwoord"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      <Button type="submit" loading={isSubmitting}>
        Wachtwoord wijzigen
      </Button>
    </form>
  );
}
