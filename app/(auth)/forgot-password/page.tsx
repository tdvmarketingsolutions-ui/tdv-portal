"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, MailCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "./schema";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordFormValues) {
    // Always show the same success state, whether or not the email exists —
    // this is the standard way to avoid leaking which emails have accounts.
    await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSent(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm p-8">
        {sent ? (
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft dark:bg-accent/10">
              <MailCheck size={22} strokeWidth={1.75} className="text-accent dark:text-accent-dark" />
            </div>
            <h1 className="mt-4 font-display text-xl font-semibold">Check je e-mail</h1>
            <p className="mt-2 text-sm text-ink-muted dark:text-ink-dark-muted">
              Als dit e-mailadres bij ons bekend is, ontvang je een link om je wachtwoord opnieuw in te stellen.
            </p>
            <Link href="/login" className="mt-6 inline-block text-sm text-accent hover:underline dark:text-accent-dark">
              Terug naar inloggen
            </Link>
          </div>
        ) : (
          <>
            <Link
              href="/login"
              className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink dark:text-ink-dark-muted dark:hover:text-ink-dark"
            >
              <ChevronLeft size={16} strokeWidth={1.75} />
              Terug naar inloggen
            </Link>
            <h1 className="mt-4 font-display text-2xl font-semibold">Wachtwoord vergeten</h1>
            <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">
              Vul je e-mailadres in en we sturen je een link om een nieuw wachtwoord in te stellen.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
              <Input label="E-mailadres" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
              <Button type="submit" loading={isSubmitting} className="w-full">
                Verstuur reset-link
              </Button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
