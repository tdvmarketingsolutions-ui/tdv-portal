import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { getProjectsForCurrentUser } from "@/lib/data/projects";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_TONE } from "@/lib/project-status";

export default async function ProjectsPage() {
  const projects = await getProjectsForCurrentUser();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold">Projecten</h1>
        <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">
          Alle projecten die TDV voor jouw bedrijf uitvoert.
        </p>
      </header>

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
    </div>
  );
}
