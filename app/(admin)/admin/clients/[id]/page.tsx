import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCompanyById } from "@/lib/data/admin/companies";
import { Badge } from "@/components/ui/Badge";
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_TONE } from "@/lib/project-status";

const ROLE_LABEL: Record<string, string> = {
  tdv_admin: "TDV Admin",
  tdv_staff: "TDV Staff",
  client_admin: "Klant (admin)",
  client_member: "Klant (lid)",
};

export default async function AdminClientDetailPage({ params }: { params: { id: string } }) {
  const company = await getCompanyById(params.id);
  if (!company) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/clients"
        className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink dark:text-ink-dark-muted dark:hover:text-ink-dark"
      >
        <ChevronLeft size={16} strokeWidth={1.75} />
        Terug naar klanten
      </Link>

      <header>
        <h1 className="font-display text-2xl font-semibold">{company.name}</h1>
        <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">/{company.slug}</p>
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
      </div>
    </div>
  );
}
