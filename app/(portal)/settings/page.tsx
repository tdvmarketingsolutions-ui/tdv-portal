import { createClient } from "@/lib/supabase/server";
import { EditProfileForm } from "./EditProfileForm";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { NotificationPreferenceForm } from "./NotificationPreferenceForm";
import { ThemePreferenceForm } from "./ThemePreferenceForm";
import { getThemePreference } from "@/lib/theme-server";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, email_notifications, companies ( name )")
    .eq("id", user!.id)
    .single();

  const company = (profile as { companies?: { name: string } | null } | null)?.companies;
  const fullName = (profile?.full_name as string | null) ?? null;
  const emailNotifications = (profile?.email_notifications as boolean | null) ?? true;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-h2 font-semibold sm:text-h1">instellingen.</h1>
        <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">
          Beheer je account en voorkeuren.
        </p>
      </header>

      <section id="account" className="card scroll-mt-8 space-y-5 p-6">
        <h2 className="font-display text-h3 font-semibold">account.</h2>
        <EditProfileForm fullName={fullName} />
        <dl className="space-y-3 border-t border-border pt-4 text-sm dark:border-border-dark">
          <div className="flex justify-between gap-4">
            <dt className="shrink-0 text-ink-muted dark:text-ink-dark-muted">E-mailadres</dt>
            <dd className="min-w-0 truncate">{user!.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted dark:text-ink-dark-muted">Rol</dt>
            <dd className="capitalize">{(profile?.role as string | undefined)?.replaceAll("_", " ")}</dd>
          </div>
          {company?.name && (
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted dark:text-ink-dark-muted">Bedrijf</dt>
              <dd>{company.name}</dd>
            </div>
          )}
        </dl>
      </section>

      <section id="instellingen" className="card scroll-mt-8 space-y-5 p-6">
        <div>
          <h2 className="font-display text-h3 font-semibold">wachtwoord.</h2>
          <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">Kies een nieuw wachtwoord voor je account.</p>
        </div>
        <ChangePasswordForm />
      </section>

      <section className="card space-y-3 p-6">
        <div>
          <h2 className="font-display text-h3 font-semibold">weergave.</h2>
          <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">
            Systeem volgt de instelling van je toestel. De keuze geldt voor dit toestel.
          </p>
        </div>
        <ThemePreferenceForm preference={getThemePreference()} />
      </section>

      <section className="card space-y-3 p-6">
        <h2 className="font-display text-h3 font-semibold">meldingsvoorkeuren.</h2>
        <NotificationPreferenceForm emailNotifications={emailNotifications} />
      </section>
    </div>
  );
}
