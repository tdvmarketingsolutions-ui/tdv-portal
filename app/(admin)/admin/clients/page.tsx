import Link from "next/link";
import { Building2 } from "lucide-react";
import { getCompaniesWithCounts } from "@/lib/data/admin/companies";
import { Table } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { NewCompanyDialog } from "./NewCompanyDialog";

export default async function AdminClientsPage() {
  const companies = await getCompaniesWithCounts();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">Klanten</h1>
        <NewCompanyDialog />
      </header>

      {companies.length === 0 ? (
        <EmptyState icon={Building2} title="Nog geen klanten" description="Maak je eerste klant aan om te starten." />
      ) : (
        <Table>
          <Table.Head>
            <Table.HeadCell>Bedrijf</Table.HeadCell>
            <Table.HeadCell>Projecten</Table.HeadCell>
            <Table.HeadCell>Gebruikers</Table.HeadCell>
          </Table.Head>
          <Table.Body>
            {companies.map((c) => (
              <Table.Row key={c.id}>
                <Table.Cell>
                  <Link href={`/admin/clients/${c.id}`} className="flex items-center gap-2.5 font-medium hover:underline">
                    {c.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.logo_url} alt="" className="h-7 w-7 shrink-0 rounded-md object-cover" />
                    ) : (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-canvas text-xs font-semibold text-ink-muted dark:bg-canvas-dark dark:text-ink-dark-muted">
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    {c.name}
                  </Link>
                </Table.Cell>
                <Table.Cell>{c.projects?.[0]?.count ?? 0}</Table.Cell>
                <Table.Cell>{c.profiles?.[0]?.count ?? 0}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </div>
  );
}
