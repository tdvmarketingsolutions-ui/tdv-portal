"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { loginSchema, type LoginFormValues } from "./schema";

function describeAuthError(error: { message: string; status?: number }): string {
  if (error.message.toLowerCase().includes("invalid login credentials")) {
    return "Ongeldige combinatie van e-mail en wachtwoord.";
  }
  if (error.message.toLowerCase().includes("email not confirmed")) {
    return "Bevestig eerst je e-mailadres via de link die je hebt ontvangen.";
  }
  if (!error.status) {
    return "Kon geen verbinding maken. Controleer je internetverbinding en probeer opnieuw.";
  }
  return "Er ging iets mis bij het inloggen. Probeer het opnieuw.";
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    const { error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      setError("root", { message: describeAuthError(error) });
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm p-8">
        <h1 className="font-display text-2xl font-semibold">Welkom terug</h1>
        <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">
          Log in op je TDV klantenportaal.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <Input
            label="E-mailadres"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />

          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="block text-sm font-medium">Wachtwoord</span>
              <Link href="/forgot-password" className="text-xs text-accent hover:underline dark:text-accent-dark">
                Wachtwoord vergeten?
              </Link>
            </div>
            <PasswordInput autoComplete="current-password" error={errors.password?.message} {...register("password")} />
          </div>

          {errors.root && (
            <p role="alert" className="text-sm text-status-danger">
              {errors.root.message}
            </p>
          )}

          <Button type="submit" loading={isSubmitting} className="w-full">
            Inloggen
          </Button>
        </form>
      </div>
    </main>
  );
}
