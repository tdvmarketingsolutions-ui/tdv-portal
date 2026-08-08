"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { resetPasswordSchema, type ResetPasswordFormValues } from "./schema";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });

  useEffect(() => {
    // Clicking the reset-password email link lands here with a recovery
    // session in the URL; @supabase/ssr's browser client picks it up
    // automatically, but we still need to wait for that to happen before
    // letting the user submit — otherwise updateUser() has nothing to act on.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    const timeout = setTimeout(() => {
      setReady((current) => {
        if (!current) setInvalidLink(true);
        return current;
      });
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [supabase]);

  async function onSubmit(values: ResetPasswordFormValues) {
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setError("root", { message: "Kon wachtwoord niet bijwerken. Vraag een nieuwe link aan en probeer opnieuw." });
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  if (invalidLink) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="card w-full max-w-sm p-8 text-center">
          <h1 className="font-display text-xl font-semibold">Link verlopen of ongeldig</h1>
          <p className="mt-2 text-sm text-ink-muted dark:text-ink-dark-muted">
            Vraag een nieuwe reset-link aan om je wachtwoord in te stellen.
          </p>
          <Link href="/forgot-password" className="mt-6 inline-block text-sm text-accent hover:underline dark:text-accent-dark">
            Nieuwe link aanvragen
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm p-8">
        <h1 className="font-display text-2xl font-semibold">Nieuw wachtwoord</h1>
        <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">Kies een nieuw wachtwoord voor je account.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <PasswordInput label="Nieuw wachtwoord" autoComplete="new-password" error={errors.password?.message} {...register("password")} />
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
          <Button type="submit" loading={isSubmitting} disabled={!ready} className="w-full">
            Wachtwoord instellen
          </Button>
        </form>
      </div>
    </main>
  );
}
