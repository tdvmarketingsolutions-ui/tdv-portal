import Link from "next/link";
import { Ticket as TicketIcon } from "lucide-react";
import { getAllTicketsForAdmin } from "@/lib/data/admin/tickets";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TICKET_PRIORITY_LABEL, TICKET_PRIORITY_TONE } from "@/lib/ticket-status";
import { TicketStatusSelect } from "./TicketStatusSelect";

export default async function AdminTicketsPage() {
  const tickets = await getAllTicketsForAdmin();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold">Tickets</h1>
        <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">Alle tickets, over alle klanten heen.</p>
      </header>

      {tickets.length === 0 ? (
        <EmptyState icon={TicketIcon} title="Geen tickets" description="Er zijn nog geen tickets binnengekomen." />
      ) : (
        <Table>
          <Table.Head>
            <Table.HeadCell>Onderwerp</Table.HeadCell>
            <Table.HeadCell>Klant</Table.HeadCell>
            <Table.HeadCell>Prioriteit</Table.HeadCell>
            <Table.HeadCell>Status</Table.HeadCell>
          </Table.Head>
          <Table.Body>
            {tickets.map((t) => (
              <Table.Row key={t.id}>
                <Table.Cell>
                  <Link href={`/tickets/${t.id}`} className="font-medium hover:underline">
                    {t.subject}
                  </Link>
                </Table.Cell>
                <Table.Cell>{t.companies?.name ?? "—"}</Table.Cell>
                <Table.Cell>
                  <Badge tone={TICKET_PRIORITY_TONE[t.priority]}>{TICKET_PRIORITY_LABEL[t.priority]}</Badge>
                </Table.Cell>
                <Table.Cell>
                  <TicketStatusSelect ticketId={t.id} status={t.status} />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </div>
  );
}
