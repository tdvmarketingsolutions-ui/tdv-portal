import { notFound } from "next/navigation";
import { getProjectById } from "@/lib/data/projects";

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = await getProjectById(params.id);
  if (!project) notFound();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl font-semibold">{project.name}</h1>
        {project.description && (
          <p className="mt-2 max-w-2xl text-sm text-ink-muted dark:text-ink-dark-muted">
            {project.description}
          </p>
        )}
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <section className="card p-6 md:col-span-2">
          <h2 className="font-display text-lg font-medium">Tijdlijn</h2>
          <ol className="mt-4 space-y-4 border-l border-border pl-4 dark:border-border-dark">
            {project.project_timeline_events?.map((event) => (
              <li key={event.id} className="relative">
                <span className="absolute -left-[1.32rem] top-1 h-2 w-2 rounded-full bg-accent" />
                <p className="text-sm font-medium">{event.title}</p>
                <p className="text-xs text-ink-muted dark:text-ink-dark-muted">
                  {new Date(event.occurred_at).toLocaleDateString("nl-BE")}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <aside className="space-y-6">
          <section className="card p-6">
            <h2 className="font-display text-base font-medium">Gekoppelde tickets</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {project.tickets?.length
                ? project.tickets.map((t) => (
                    <li key={t.id}>
                      <a href={`/tickets/${t.id}`} className="text-accent hover:underline">
                        {t.subject}
                      </a>
                    </li>
                  ))
                : <li className="text-ink-muted dark:text-ink-dark-muted">Geen tickets gekoppeld.</li>}
            </ul>
          </section>

          <section className="card p-6">
            <h2 className="font-display text-base font-medium">Bestanden</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {project.files?.length
                ? project.files.map((f) => (
                    <li key={f.id} className="truncate">{f.file_name}</li>
                  ))
                : <li className="text-ink-muted dark:text-ink-dark-muted">Nog geen bestanden.</li>}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
