import Link from "next/link";
import { Ticket as TicketIcon } from "lucide-react";
import { getTicketsForCurrentUser } from "@/lib/data/tickets";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TICKET_STATUS_LABEL, TICKET_STATUS_TONE } from "@/lib/ticket-status";

export default async function TicketsPage() {
  const tickets = await getTicketsForCurrentUser();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Tickets</h1>
          <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">
            Stel een vraag of meld een probleem — TDV antwoordt hier rechtstreeks.
          </p>
        </div>
        <Link href="/tickets/new" className="btn-primary">Nieuw ticket</Link>
      </header>

      {tickets.length === 0 ? (
        <EmptyState
          icon={TicketIcon}
          title="Nog geen tickets"
          description="Heb je een vraag of probleem? Maak je eerste ticket aan."
          action={
            <Link href="/tickets/new" className="btn-primary">
              Nieuw ticket
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <Link href={`/tickets/${ticket.id}`} className="card flex items-center justify-between p-5 hover:shadow-md">
                <span className="font-medium">{ticket.subject}</span>
                <Badge tone={TICKET_STATUS_TONE[ticket.status]}>{TICKET_STATUS_LABEL[ticket.status]}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
