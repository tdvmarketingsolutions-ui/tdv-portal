"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { registerSchema, type RegisterFormValues } from "./schema";
import { registerAction } from "./actions";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterFormValues) {
    const result = await registerAction(values);
    if (result.error) {
      setError("root", { message: result.error });
      return;
    }

    // Account + bedrijf staan klaar — meteen inloggen met dezelfde gegevens
    // zodat de gebruiker niet nog eens naar het loginscherm moet.
    const { error } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password });
    if (error) {
      router.push("/login");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="card w-full max-w-sm p-8">
        <Link
          href="/login"
          className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink dark:text-ink-dark-muted dark:hover:text-ink-dark"
        >
          <ChevronLeft size={16} strokeWidth={1.75} />
          Terug naar inloggen
        </Link>
        <h1 className="mt-4 font-display text-2xl font-semibold">Account aanmaken</h1>
        <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">
          Maak een account aan voor jouw bedrijf. TDV neemt je aanvraag daarna door.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <Input label="Jouw naam" autoComplete="name" error={errors.fullName?.message} {...register("fullName")} />
          <Input
            label="Bedrijfsnaam"
            autoComplete="organization"
            error={errors.companyName?.message}
            {...register("companyName")}
          />
          <Input label="E-mailadres" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
          <PasswordInput
            label="Wachtwoord"
            autoComplete="new-password"
            hint="Minstens 8 tekens."
            error={errors.password?.message}
            {...register("password")}
          />
          <PasswordInput
            label="Bevestig wachtwoord"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          {errors.root && (
            <p role="alert" className="text-sm text-status-danger">
              {errors.root.message}
            </p>
          )}

          <Button type="submit" loading={isSubmitting} className="w-full">
            Account aanmaken
          </Button>
        </form>
      </div>
    </main>
  );
}
