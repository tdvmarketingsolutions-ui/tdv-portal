import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { CheckCircle2, MessageSquare, Sparkles } from "lucide-react";
import { getDashboardData } from "@/lib/data/dashboard";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic"; // always fresh — this is a live status view

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">
          Een overzicht van je lopende projecten, tickets en wat je aandacht vraagt.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Lopende projecten" value={data.projectCount} href="/projects" />
        <SummaryCard label="Open tickets" value={data.openTicketCount} href="/tickets" />
        <SummaryCard label="Vraagt aandacht" value={data.attentionItems.length} href="#aandacht" />
        <SummaryCard label="Ongelezen meldingen" value={data.unreadNotificationCount} href="/notifications" />
      </section>

      <section id="aandacht" className="scroll-mt-8 space-y-3">
        <h2 className="font-display text-lg font-medium">Vraagt je aandacht</h2>
        {data.attentionItems.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="Niets dat om actie vraagt" description="Je bent helemaal bij." />
        ) : (
          <ul className="space-y-2">
            {data.attentionItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="card flex items-center justify-between gap-4 border-l-4 border-l-status-progress p-4 transition-shadow hover:shadow-md"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.label}</p>
                    <p className="mt-0.5 text-xs text-ink-muted dark:text-ink-dark-muted">{item.meta}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-medium">Recente activiteit</h2>
        {data.activityItems.length === 0 ? (
          <EmptyState icon={MessageSquare} title="Nog geen activiteit" description="Reacties en updates verschijnen hier." />
        ) : (
          <ul className="space-y-2">
            {data.activityItems.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="card block p-4 transition-shadow hover:shadow-md">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-medium text-ink-muted dark:text-ink-dark-muted">{item.contextLabel}</p>
                    <p className="shrink-0 text-xs text-ink-muted dark:text-ink-dark-muted">
                      {formatDistanceToNow(new Date(item.createdAt), { locale: nl, addSuffix: true })}
                    </p>
                  </div>
                  <p className="mt-1 truncate text-sm">
                    <span className="font-medium">{item.authorName}</span>
                    {": "}
                    {item.body}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-6">
        <h2 className="font-display text-lg font-medium">Snelle acties</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {data.isStaff ? (
            <>
              <Link href="/admin/clients" className="btn-primary">
                Klanten beheren
              </Link>
              <Link href="/content-planning" className="btn-secondary">
                Content plannen
              </Link>
              <Link href="/admin/ai" className="btn-secondary">
                <Sparkles size={16} strokeWidth={1.75} className="mr-1.5 inline" />
                AI-activiteit
              </Link>
            </>
          ) : (
            <>
              <Link href="/tickets/new" className="btn-primary">
                Nieuw ticket
              </Link>
              <Link href="/content-planning" className="btn-secondary">
                Content goedkeuren
              </Link>
              <Link href="/ai-assistant" className="btn-secondary">
                Vraag het de AI Assistent
              </Link>
            </>
          )}
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
