import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getTicketById } from "@/lib/data/tickets";
import { Badge } from "@/components/ui/Badge";
import { TICKET_STATUS_LABEL, TICKET_STATUS_TONE, TICKET_PRIORITY_LABEL, TICKET_PRIORITY_TONE } from "@/lib/ticket-status";
import { ReplyForm } from "./ReplyForm";

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  const ticket = await getTicketById(params.id);
  if (!ticket) notFound();

  const messages = [...(ticket.ticket_messages ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/tickets" className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink dark:text-ink-dark-muted dark:hover:text-ink-dark">
        <ChevronLeft size={16} strokeWidth={1.75} />
        Terug naar tickets
      </Link>

      <header className="space-y-2">
        <h1 className="font-display text-2xl font-semibold">{ticket.subject}</h1>
        <div className="flex gap-2">
          <Badge tone={TICKET_STATUS_TONE[ticket.status]}>{TICKET_STATUS_LABEL[ticket.status]}</Badge>
          <Badge tone={TICKET_PRIORITY_TONE[ticket.priority]}>{TICKET_PRIORITY_LABEL[ticket.priority]}</Badge>
        </div>
      </header>

      <section className="space-y-3">
        {messages.map((message) => (
          <div key={message.id} className="card p-4">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-sm font-medium">{message.profiles?.full_name ?? "Onbekend"}</p>
              <p className="text-xs text-ink-muted dark:text-ink-dark-muted">
                {new Date(message.created_at).toLocaleString("nl-BE")}
              </p>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm">{message.body}</p>
          </div>
        ))}
      </section>

      <section className="card p-6">
        <h2 className="mb-3 font-display text-base font-medium">Reageren</h2>
        <ReplyForm ticketId={ticket.id} />
      </section>
    </div>
  );
}
