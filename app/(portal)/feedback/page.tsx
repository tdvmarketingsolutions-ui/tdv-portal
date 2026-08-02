import Link from "next/link";
import { MessageSquareText } from "lucide-react";
import { getDeliverablesForCurrentUser } from "@/lib/data/deliverables";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FEEDBACK_STATUS_LABEL, FEEDBACK_STATUS_TONE } from "@/lib/feedback-status";

export default async function FeedbackPage() {
  const deliverables = await getDeliverablesForCurrentUser();

  const groups = new Map<string, typeof deliverables>();
  for (const d of deliverables) {
    const projectName = d.projects?.name ?? "Overig";
    groups.set(projectName, [...(groups.get(projectName) ?? []), d]);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold">Feedback</h1>
        <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">
          Bekijk opgeleverd werk, laat opmerkingen achter en keur versies goed.
        </p>
      </header>

      {deliverables.length === 0 ? (
        <EmptyState
          icon={MessageSquareText}
          title="Nog niets om te beoordelen"
          description="Zodra TDV werk oplevert, verschijnt het hier voor jouw feedback."
        />
      ) : (
        Array.from(groups.entries()).map(([projectName, items]) => (
          <section key={projectName} className="space-y-3">
            <h2 className="font-display text-base font-medium text-ink-muted dark:text-ink-dark-muted">{projectName}</h2>
            <ul className="space-y-3">
              {items.map((d) => {
                const latest = [...d.deliverable_versions].sort((a, b) => b.version_number - a.version_number)[0];
                return (
                  <li key={d.id}>
                    <Link href={`/feedback/${d.id}`} className="card flex items-center justify-between p-5 hover:shadow-md">
                      <div>
                        <p className="font-medium">{d.title}</p>
                        <p className="mt-0.5 text-sm text-ink-muted dark:text-ink-dark-muted">
                          {d.deliverable_versions.length} {d.deliverable_versions.length === 1 ? "versie" : "versies"}
                        </p>
                      </div>
                      {latest && <Badge tone={FEEDBACK_STATUS_TONE[latest.status]}>{FEEDBACK_STATUS_LABEL[latest.status]}</Badge>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
