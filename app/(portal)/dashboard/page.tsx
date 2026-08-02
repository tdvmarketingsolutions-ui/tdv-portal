import Link from "next/link";
import { getProjectsForCurrentUser } from "@/lib/data/projects";
import { getTicketsForCurrentUser } from "@/lib/data/tickets";

export const dynamic = "force-dynamic"; // always fresh — this is a live status view

export default async function DashboardPage() {
  const [projects, tickets] = await Promise.all([
    getProjectsForCurrentUser(),
    getTicketsForCurrentUser(),
  ]);

  const openTickets = tickets.filter((t) => t.status !== "resolved");
  const upcomingDeadlines = projects
    .filter((p) => p.deadline)
    .slice(0, 3);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">
          Een overzicht van je lopende projecten, tickets en eerstvolgende deadlines.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Lopende projecten" value={projects.length} href="/projects" />
        <SummaryCard label="Open tickets" value={openTickets.length} href="/tickets" />
        <SummaryCard label="Eerstvolgende deadline" value={upcomingDeadlines[0]?.deadline ?? "—"} href="/projects" />
      </section>

      <section className="card p-6">
        <h2 className="font-display text-lg font-medium">Snelle acties</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/tickets/new" className="btn-primary">Nieuw ticket</Link>
          <Link href="/content-planning" className="btn-secondary">Content goedkeuren</Link>
          <Link href="/ai-assistant" className="btn-secondary">Vraag het de AI Assistent</Link>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value, href }: { label: string; value: string | number; href: string }) {
  return (
    <Link href={href} className="card block p-5 transition-shadow hover:shadow-md">
      <p className="text-sm text-ink-muted dark:text-ink-dark-muted">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
    </Link>
  );
}
