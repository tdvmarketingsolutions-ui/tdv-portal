import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { getAllProjectsForAdmin, getAllCompaniesForSelect } from "@/lib/data/admin/projects";
import { Table } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { NewProjectDialog } from "./NewProjectDialog";
import { ProjectStatusSelect } from "./ProjectStatusSelect";

export default async function AdminProjectsPage() {
  const [projects, companies] = await Promise.all([getAllProjectsForAdmin(), getAllCompaniesForSelect()]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Projecten</h1>
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
    </div>
  );
}
