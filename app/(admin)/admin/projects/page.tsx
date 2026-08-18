import Link from "next/link";
import { FolderKanban, Inbox } from "lucide-react";
import { getAllProjectsForAdmin, getAllCompaniesForSelect } from "@/lib/data/admin/projects";
import { getAllProjectRequestsForAdmin } from "@/lib/data/admin/project-requests";
import { Table } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { NewProjectDialog } from "./NewProjectDialog";
import { ProjectStatusSelect } from "./ProjectStatusSelect";
import { ProjectRequestStatusSelect } from "./ProjectRequestStatusSelect";

export default async function AdminProjectsPage() {
  const [projects, companies, projectRequests] = await Promise.all([
    getAllProjectsForAdmin(),
    getAllCompaniesForSelect(),
    getAllProjectRequestsForAdmin(),
  ]);

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="font-display text-2xl font-semibold">Projectaanvragen</h1>
        <p className="text-sm text-ink-muted dark:text-ink-dark-muted">
          Klanten vragen hier nieuwe projecten aan. Zet de status door zodra de offerte per e-mail verstuurd is en
          maak hieronder het echte project aan wanneer de klant akkoord gaat.
        </p>
        {projectRequests.length === 0 ? (
          <EmptyState icon={Inbox} title="Nog geen projectaanvragen" description="Zodra een klant een project aanvraagt, verschijnt het hier." />
        ) : (
          <Table>
            <Table.Head>
              <Table.HeadCell>Titel</Table.HeadCell>
              <Table.HeadCell>Klant</Table.HeadCell>
              <Table.HeadCell>Richtprijs (AI)</Table.HeadCell>
              <Table.HeadCell>Aangevraagd</Table.HeadCell>
              <Table.HeadCell>Status</Table.HeadCell>
            </Table.Head>
            <Table.Body>
              {projectRequests.map((r) => (
                <Table.Row key={r.id}>
                  <Table.Cell>
                    <p className="font-medium">{r.title}</p>
                    {r.description && (
                      <p className="mt-0.5 max-w-md truncate text-xs text-ink-muted dark:text-ink-dark-muted">{r.description}</p>
                    )}
                  </Table.Cell>
                  <Table.Cell>{r.companies?.name ?? "—"}</Table.Cell>
                  <Table.Cell>
                    {r.indicative_price_range ? (
                      <>
                        <p>{r.indicative_price_range}</p>
                        <p className="mt-0.5 text-xs text-ink-muted dark:text-ink-dark-muted">
                          {r.price_response === "pending"
                            ? "Wacht op klant"
                            : r.price_response === "accepted"
                              ? "Klant akkoord"
                              : "Klant niet akkoord"}
                        </p>
                      </>
                    ) : (
                      "—"
                    )}
                  </Table.Cell>
                  <Table.Cell>{new Date(r.created_at).toLocaleDateString("nl-BE")}</Table.Cell>
                  <Table.Cell>
                    <ProjectRequestStatusSelect requestId={r.id} status={r.status} />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </section>

      <section className="space-y-3">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold">Projecten</h2>
          <NewProjectDialog companies={companies} />
        </header>

        {projects.length === 0 ? (
          <EmptyState icon={FolderKanban} title="Nog geen projecten" description="Maak een project aan voor een klant." />
        ) : (
          <Table>
            <Table.Head>
              <Table.HeadCell>Project</Table.HeadCell>
              <Table.HeadCell>Klant</Table.HeadCell>
              <Table.HeadCell>Deadline</Table.HeadCell>
              <Table.HeadCell>Status</Table.HeadCell>
            </Table.Head>
            <Table.Body>
              {projects.map((p) => (
                <Table.Row key={p.id}>
                  <Table.Cell>
                    <Link href={`/projects/${p.id}`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                  </Table.Cell>
                  <Table.Cell>{p.companies?.name ?? "—"}</Table.Cell>
                  <Table.Cell>{p.deadline ? new Date(p.deadline).toLocaleDateString("nl-BE") : "—"}</Table.Cell>
                  <Table.Cell>
                    <ProjectStatusSelect projectId={p.id} status={p.status} />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </section>
    </div>
  );
}
