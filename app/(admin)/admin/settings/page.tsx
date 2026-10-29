import { createClient } from "@/lib/supabase/server";
import { EditProfileForm } from "@/app/(portal)/settings/EditProfileForm";
import { ChangePasswordForm } from "@/app/(portal)/settings/ChangePasswordForm";
import { NotificationPreferenceForm } from "@/app/(portal)/settings/NotificationPreferenceForm";
import { getAgencyForSettings } from "@/lib/data/admin/agency-branding";
import { BrandingForm } from "./BrandingForm";
import { AgencyLogoUpload } from "./AgencyLogoUpload";

const ROLE_LABEL: Record<string, string> = {
  agency_admin: "Bureau (beheerder)",
  agency_staff: "Bureau (medewerker)",
};

export default async function AdminSettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, email_notifications")
    .eq("id", user!.id)
    .single();

  const fullName = (profile?.full_name as string | null) ?? null;
  const emailNotifications = (profile?.email_notifications as boolean | null) ?? true;
  const agency = await getAgencyForSettings();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-h2 font-semibold sm:text-h1">instellingen.</h1>
        <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">Jouw account binnen het adminportaal.</p>
      </header>

      <section id="branding" className="card scroll-mt-8 space-y-5 p-6">
        <div>
          <h2 className="font-display text-h3 font-semibold">branding.</h2>
          <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">
            Hoe jouw bureau zich toont in het portaal — logo, favicon, naam en accentkleur.
          </p>
        </div>
        <AgencyLogoUpload agencyName={agency.brand_name ?? agency.name} logoUrl={agency.logo_url} />
        <AgencyLogoUpload agencyName={agency.brand_name ?? agency.name} logoUrl={agency.favicon_url} kind="favicon" />
        <div className="border-t border-border pt-4 dark:border-border-dark">
          <BrandingForm brandName={agency.brand_name} accentColor={agency.accent_color} supportEmail={agency.support_email} />
        </div>
      </section>

      <section id="account" className="card scroll-mt-8 space-y-5 p-6">
        <h2 className="font-display text-h3 font-semibold">account.</h2>
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
          <h2 className="font-display text-h3 font-semibold">wachtwoord.</h2>
          <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">Kies een nieuw wachtwoord voor je account.</p>
        </div>
        <ChangePasswordForm />
      </section>

      <section className="card space-y-3 p-6">
        <h2 className="font-display text-h3 font-semibold">meldingsvoorkeuren.</h2>
        <NotificationPreferenceForm emailNotifications={emailNotifications} />
      </section>
    </div>
  );
}
