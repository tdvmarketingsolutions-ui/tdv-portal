import Link from "next/link";
import { CalendarDays, ImageIcon } from "lucide-react";
import { getAllContentItemsForAdmin } from "@/lib/data/admin/content";
import { getAllCompaniesForSelect } from "@/lib/data/admin/projects";
import { Table } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { CONTENT_CHANNEL_LABEL } from "@/lib/content-status";
import { NewContentItemDialog } from "./NewContentItemDialog";
import { ContentStatusSelect } from "./ContentStatusSelect";
import { EditContentItemDialog } from "./EditContentItemDialog";

export default async function AdminContentPage() {
  const [items, companies] = await Promise.all([getAllContentItemsForAdmin(), getAllCompaniesForSelect()]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
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
            <Table.HeadCell>Visual</Table.HeadCell>
            <Table.HeadCell>Gepland</Table.HeadCell>
            <Table.HeadCell>Status</Table.HeadCell>
            <Table.HeadCell />
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
                <Table.Cell>{item.channels.map((c) => CONTENT_CHANNEL_LABEL[c]).join(", ")}</Table.Cell>
                <Table.Cell>
                  {item.visual ? (
                    <span className="flex items-center gap-1 text-ink-muted dark:text-ink-dark-muted">
                      <ImageIcon size={14} strokeWidth={1.75} />
                    </span>
                  ) : (
                    "—"
                  )}
                </Table.Cell>
                <Table.Cell>{item.scheduled_for ? new Date(item.scheduled_for).toLocaleDateString("nl-BE") : "—"}</Table.Cell>
                <Table.Cell>
                  <ContentStatusSelect contentItemId={item.id} status={item.status} />
                </Table.Cell>
                <Table.Cell>
                  <EditContentItemDialog
                    contentItemId={item.id}
                    title={item.title}
                    caption={item.caption}
                    channels={item.channels}
                    scheduledFor={item.scheduled_for}
                    visualFileName={item.visual?.file_name ?? null}
                  />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </div>
  );
}
