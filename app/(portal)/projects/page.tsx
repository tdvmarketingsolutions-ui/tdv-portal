import Link from "next/link";
import { getProjectsForCurrentUser } from "@/lib/data/projects";
import type { ProjectStatus } from "@/types/domain";

const STATUS_LABEL: Record<ProjectStatus, string> = {
  planning: "Planning",
  in_progress: "In uitvoering",
  in_review: "In review",
  on_hold: "On hold",
  completed: "Afgerond",
};

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
        <div className="card p-8 text-center text-sm text-ink-muted dark:text-ink-dark-muted">
          Er lopen momenteel geen projecten. Zodra TDV een project opstart, verschijnt het hier.
        </div>
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
                <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent dark:bg-accent/20 dark:text-accent-dark">
                  {STATUS_LABEL[project.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
