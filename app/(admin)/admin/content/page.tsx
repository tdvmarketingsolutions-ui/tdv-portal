import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { getAllContentItemsForAdmin } from "@/lib/data/admin/content";
import { getAllCompaniesForSelect } from "@/lib/data/admin/projects";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CONTENT_STATUS_LABEL, CONTENT_STATUS_TONE, CONTENT_CHANNEL_LABEL } from "@/lib/content-status";
import { NewContentItemDialog } from "./NewContentItemDialog";

export default async function AdminContentPage() {
  const [items, companies] = await Promise.all([getAllContentItemsForAdmin(), getAllCompaniesForSelect()]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Content</h1>
        <NewContentItemDialog companies={companies} />
      </header>

      {items.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Nog geen content" description="Plan content in voor een klant." />
      ) : (
        <Table>
          <Table.Head>
            <Table.HeadCell>Titel</Table.HeadCell>
            <Table.HeadCell>Klant</Table.HeadCell>
            <Table.HeadCell>Kanaal</Table.HeadCell>
            <Table.HeadCell>Gepland</Table.HeadCell>
            <Table.HeadCell>Status</Table.HeadCell>
          </Table.Head>
          <Table.Body>
            {items.map((item) => (
              <Table.Row key={item.id}>
                <Table.Cell>
                  <Link href={`/content-planning/${item.id}`} className="font-medium hover:underline">
                    {item.title}
                  </Link>
                </Table.Cell>
                <Table.Cell>{item.companies?.name ?? "—"}</Table.Cell>
                <Table.Cell>{CONTENT_CHANNEL_LABEL[item.channel]}</Table.Cell>
                <Table.Cell>{item.scheduled_for ? new Date(item.scheduled_for).toLocaleDateString("nl-BE") : "—"}</Table.Cell>
                <Table.Cell>
                  <Badge tone={CONTENT_STATUS_TONE[item.status]}>{CONTENT_STATUS_LABEL[item.status]}</Badge>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </div>
  );
}
