import Link from "next/link";
import { getTicketsForCurrentUser } from "@/lib/data/tickets";
import type { TicketStatus } from "@/types/domain";

const STATUS_STYLE: Record<TicketStatus, string> = {
  new: "bg-blue-50 text-status-new dark:bg-blue-500/10",
  in_progress: "bg-amber-50 text-status-progress dark:bg-amber-500/10",
  waiting_on_client: "bg-violet-50 text-status-waiting dark:bg-violet-500/10",
  resolved: "bg-green-50 text-status-done dark:bg-green-500/10",
};

const STATUS_LABEL: Record<TicketStatus, string> = {
  new: "Nieuw",
  in_progress: "In behandeling",
  waiting_on_client: "Wachten op klant",
  resolved: "Afgerond",
};

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

      <ul className="space-y-3">
        {tickets.map((ticket) => (
          <li key={ticket.id}>
            <Link href={`/tickets/${ticket.id}`} className="card flex items-center justify-between p-5 hover:shadow-md">
              <span className="font-medium">{ticket.subject}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[ticket.status]}`}>
                {STATUS_LABEL[ticket.status]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
