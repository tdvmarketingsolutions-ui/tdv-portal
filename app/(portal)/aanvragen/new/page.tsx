import { getProjectsForCurrentUser } from "@/lib/data/projects";
import { TicketForm } from "./TicketForm";
import { getAgencyDisplayName } from "@/lib/data/agency-branding";

export default async function NewTicketPage({ searchParams }: { searchParams: { project?: string } }) {
  const projects = await getProjectsForCurrentUser();
  const agencyName = await getAgencyDisplayName();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h1 className="font-display text-h2 font-semibold sm:text-h1">nieuwe aanvraag.</h1>
        <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">
          Stel een vraag of meld een probleem — {agencyName} antwoordt hier rechtstreeks.
        </p>
      </header>

      <TicketForm projects={projects} defaultProjectId={searchParams.project} />
    </div>
  );
}
