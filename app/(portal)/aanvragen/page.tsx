import Link from "next/link";
import { Inbox } from "lucide-react";
import { getTicketsForCurrentUser } from "@/lib/data/tickets";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TICKET_STATUS_LABEL, TICKET_STATUS_TONE } from "@/lib/ticket-status";

export default async function TicketsPage() {
  const tickets = await getTicketsForCurrentUser();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Aanvragen</h1>
          <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">
            Stel een vraag of meld een probleem — TDV antwoordt hier rechtstreeks.
          </p>
        </div>
        <Link href="/aanvragen/new" className="btn-primary">Nieuwe aanvraag</Link>
      </header>

      {tickets.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nog geen aanvragen"
          description="Heb je een vraag of probleem? Maak je eerste aanvraag aan."
          action={
            <Link href="/aanvragen/new" className="btn-primary">
              Nieuwe aanvraag
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <Link href={`/aanvragen/${ticket.id}`} className="card flex items-center justify-between p-5 hover:shadow-md">
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
