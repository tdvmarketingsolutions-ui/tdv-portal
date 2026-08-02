import { notFound } from "next/navigation";
import Link from "next/link";
import { getProjectById } from "@/lib/data/projects";
import { Badge } from "@/components/ui/Badge";
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_TONE } from "@/lib/project-status";
import { CommentForm } from "./CommentForm";

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = await getProjectById(params.id);
  if (!project) notFound();

  const comments = [...(project.project_comments ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="space-y-8">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-semibold">{project.name}</h1>
          <Badge tone={PROJECT_STATUS_TONE[project.status]}>{PROJECT_STATUS_LABEL[project.status]}</Badge>
        </div>
        {project.description && (
          <p className="mt-2 max-w-2xl text-sm text-ink-muted dark:text-ink-dark-muted">
            {project.description}
          </p>
        )}
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <section className="card p-6">
            <h2 className="font-display text-lg font-medium">Tijdlijn</h2>
            {project.project_timeline_events?.length ? (
              <ol className="mt-4 space-y-4 border-l border-border pl-4 dark:border-border-dark">
                {project.project_timeline_events.map((event) => (
                  <li key={event.id} className="relative">
                    <span className="absolute -left-[1.32rem] top-1 h-2 w-2 rounded-full bg-accent" />
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-ink-muted dark:text-ink-dark-muted">
                      {new Date(event.occurred_at).toLocaleDateString("nl-BE")}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm text-ink-muted dark:text-ink-dark-muted">Nog geen tijdlijn-updates.</p>
            )}
          </section>

          <section className="card p-6">
            <h2 className="font-display text-lg font-medium">Opmerkingen</h2>
            <div className="mt-4 space-y-3">
              {comments.length ? (
                comments.map((comment) => (
                  <div key={comment.id} className="rounded-xl bg-canvas p-4 dark:bg-canvas-dark">
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="text-sm font-medium">{comment.profiles?.full_name ?? "Onbekend"}</p>
                      <p className="text-xs text-ink-muted dark:text-ink-dark-muted">
                        {new Date(comment.created_at).toLocaleString("nl-BE")}
                      </p>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{comment.body}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-ink-muted dark:text-ink-dark-muted">Nog geen opmerkingen.</p>
              )}
            </div>
            <div className="mt-5 border-t border-border pt-5 dark:border-border-dark">
              <CommentForm projectId={project.id} />
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-6">
            <h2 className="font-display text-base font-medium">Gekoppelde tickets</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {project.tickets?.length
                ? project.tickets.map((t) => (
                    <li key={t.id}>
                      <Link href={`/tickets/${t.id}`} className="text-accent hover:underline dark:text-accent-dark">
                        {t.subject}
                      </Link>
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
