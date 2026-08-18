import { getProjectsForCurrentUser } from "@/lib/data/projects";
import { TicketForm } from "./TicketForm";

export default async function NewTicketPage() {
  const projects = await getProjectsForCurrentUser();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold">Nieuwe aanvraag</h1>
        <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">
          Stel een vraag of meld een probleem — TDV antwoordt hier rechtstreeks.
        </p>
      </header>

      <TicketForm projects={projects} />
    </div>
  );
}
