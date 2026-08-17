import { createClient } from "@/lib/supabase/server";
import { EditProfileForm } from "@/app/(portal)/settings/EditProfileForm";
import { ChangePasswordForm } from "@/app/(portal)/settings/ChangePasswordForm";

const ROLE_LABEL: Record<string, string> = {
  tdv_admin: "TDV Admin",
  tdv_staff: "TDV Staff",
};

export default async function AdminSettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user!.id)
    .single();

  const fullName = (profile?.full_name as string | null) ?? null;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl font-semibold">Instellingen</h1>
        <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">Jouw account binnen het adminportaal.</p>
      </header>

      <section id="account" className="card scroll-mt-8 space-y-5 p-6">
        <h2 className="font-display text-lg font-medium">Account</h2>
        <EditProfileForm fullName={fullName} />
        <dl className="space-y-3 border-t border-border pt-4 text-sm dark:border-border-dark">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted dark:text-ink-dark-muted">E-mailadres</dt>
            <dd>{user!.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted dark:text-ink-dark-muted">Rol</dt>
            <dd>{ROLE_LABEL[profile?.role as string] ?? (profile?.role as string)}</dd>
          </div>
        </dl>
      </section>

      <section id="instellingen" className="card scroll-mt-8 space-y-5 p-6">
        <div>
          <h2 className="font-display text-lg font-medium">Wachtwoord</h2>
          <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">Kies een nieuw wachtwoord voor je account.</p>
        </div>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
