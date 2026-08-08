import { createClient } from "@/lib/supabase/server";

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

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl font-semibold">Instellingen</h1>
        <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">Jouw account binnen het adminportaal.</p>
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
            <dd>{ROLE_LABEL[profile?.role as string] ?? (profile?.role as string)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
