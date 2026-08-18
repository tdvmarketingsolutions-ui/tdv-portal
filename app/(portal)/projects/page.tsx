import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { getProjectsForCurrentUser } from "@/lib/data/projects";
import { getProjectRequestsForCurrentUser } from "@/lib/data/project-requests";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_TONE } from "@/lib/project-status";
import { PROJECT_REQUEST_STATUS_LABEL, PROJECT_REQUEST_STATUS_TONE } from "@/lib/project-request-status";
import { NewProjectRequestDialog } from "./NewProjectRequestDialog";
import { ProjectRequestPriceCard } from "./ProjectRequestPriceCard";

export default async function ProjectsPage() {
  const [projects, projectRequests] = await Promise.all([
    getProjectsForCurrentUser(),
    getProjectRequestsForCurrentUser(),
  ]);

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Projecten</h1>
          <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">
            Alle projecten die TDV voor jouw bedrijf uitvoert.
          </p>
        </div>
        <NewProjectRequestDialog />
      </header>

      {projectRequests.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-base font-medium">Jouw aanvragen</h2>
          <ul className="space-y-3">
            {projectRequests.map((r) =>
              r.price_response === "pending" && r.indicative_price_range ? (
                <ProjectRequestPriceCard key={r.id} request={r} />
              ) : (
                <li key={r.id} className="card flex items-center justify-between p-5">
                  <div>
                    <p className="font-medium">{r.title}</p>
                    {r.description && (
                      <p className="mt-0.5 text-sm text-ink-muted dark:text-ink-dark-muted">{r.description}</p>
                    )}
                  </div>
                  <Badge tone={PROJECT_REQUEST_STATUS_TONE[r.status]}>{PROJECT_REQUEST_STATUS_LABEL[r.status]}</Badge>
                </li>
              )
            )}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        {projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="Nog geen projecten"
            description="Zodra TDV een project opstart, verschijnt het hier."
          />
        ) : (
          <ul className="space-y-3">
            {projects.map((project) => (
              <li key={project.id}>
                <Link href={`/projects/${project.id}`} className="card flex items-center justify-between p-5 hover:shadow-md">
                  <div>
                    <p className="font-medium">{project.name}</p>
                    {project.deadline && (
                      <p className="mt-0.5 text-sm text-ink-muted dark:text-ink-dark-muted">
                        Deadline: {new Date(project.deadline).toLocaleDateString("nl-BE")}
                      </p>
                    )}
                  </div>
                  <Badge tone={PROJECT_STATUS_TONE[project.status]}>{PROJECT_STATUS_LABEL[project.status]}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
