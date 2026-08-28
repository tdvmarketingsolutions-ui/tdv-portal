import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCompanyById } from "@/lib/data/admin/companies";
import { getSocialAccountsForCompany } from "@/lib/data/admin/social-accounts";
import { Badge } from "@/components/ui/Badge";
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_TONE } from "@/lib/project-status";
import { SOCIAL_PLATFORM_LABEL, SOCIAL_ACCOUNT_STATUS_LABEL, SOCIAL_ACCOUNT_STATUS_TONE } from "@/lib/content-status";
import { CompanyLogoUpload } from "./CompanyLogoUpload";

const ROLE_LABEL: Record<string, string> = {
  tdv_admin: "TDV Admin",
  tdv_staff: "TDV Staff",
  client_admin: "Klant (admin)",
  client_member: "Klant (lid)",
};

export default async function AdminClientDetailPage({ params }: { params: { id: string } }) {
  const company = await getCompanyById(params.id);
  if (!company) notFound();
  const socialAccounts = await getSocialAccountsForCompany(params.id);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/clients"
        className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink dark:text-ink-dark-muted dark:hover:text-ink-dark"
      >
        <ChevronLeft size={16} strokeWidth={1.75} />
        Terug naar klanten
      </Link>

      <header className="flex flex-wrap items-center gap-4">
        <CompanyLogoUpload companyId={company.id} companyName={company.name} logoUrl={company.logo_url} />
        <div>
          <h1 className="font-display text-2xl font-semibold">{company.name}</h1>
          <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">/{company.slug}</p>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-6">
          <h2 className="font-display text-base font-medium">Projecten</h2>
          {company.projects.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted dark:text-ink-dark-muted">Nog geen projecten.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {company.projects.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span>{p.name}</span>
                  <Badge tone={PROJECT_STATUS_TONE[p.status as keyof typeof PROJECT_STATUS_TONE]}>
                    {PROJECT_STATUS_LABEL[p.status as keyof typeof PROJECT_STATUS_LABEL] ?? p.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6">
          <h2 className="font-display text-base font-medium">Gebruikers</h2>
          {company.profiles.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted dark:text-ink-dark-muted">Nog geen gebruikers.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {company.profiles.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span>{p.full_name ?? "Naamloos"}</span>
                  <Badge tone="gray">{ROLE_LABEL[p.role] ?? p.role}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6 md:col-span-2">
          <h2 className="font-display text-base font-medium">Social kanalen</h2>
          <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">
            Rechtstreeks posten vanuit het portaal vereist goedkeuring van Meta (Instagram/Facebook) en LinkedIn —
            die aanvragen lopen nog. Zodra een kanaal verbonden is, verschijnt dat hier.
          </p>
          <ul className="mt-4 divide-y divide-border dark:divide-border-dark">
            {socialAccounts.map((account) => (
              <li key={account.platform} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium">{SOCIAL_PLATFORM_LABEL[account.platform]}</p>
                  {account.account_label && (
                    <p className="text-xs text-ink-muted dark:text-ink-dark-muted">{account.account_label}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={SOCIAL_ACCOUNT_STATUS_TONE[account.status]}>
                    {SOCIAL_ACCOUNT_STATUS_LABEL[account.status]}
                  </Badge>
                  <button
                    type="button"
                    disabled
                    title="Binnenkort beschikbaar, zodra Meta/LinkedIn de koppeling goedkeuren"
                    className="btn-secondary cursor-not-allowed px-3 py-1.5 text-xs opacity-60"
                  >
                    Verbinden
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
