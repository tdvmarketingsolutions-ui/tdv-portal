import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, companies ( name )")
    .eq("id", user!.id)
    .single();

  const company = (profile as { companies?: { name: string } | null } | null)?.companies;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl font-semibold">Instellingen</h1>
        <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">
          Beheer je account en voorkeuren.
        </p>
      </header>

      <section id="account" className="card scroll-mt-8 p-6">
        <h2 className="font-display text-lg font-medium">Account</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted dark:text-ink-dark-muted">Naam</dt>
            <dd>{(profile?.full_name as string | null) ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted dark:text-ink-dark-muted">E-mailadres</dt>
            <dd>{user!.email}</dd>
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

      <section id="instellingen" className="card scroll-mt-8 p-6">
        <h2 className="font-display text-lg font-medium">Voorkeuren</h2>
        <p className="mt-2 text-sm text-ink-muted dark:text-ink-dark-muted">
          Meldingsvoorkeuren en overige instellingen volgen hier binnenkort.
        </p>
      </section>
    </div>
  );
}
