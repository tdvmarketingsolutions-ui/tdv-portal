import { getAiChatStats } from "@/lib/data/admin/ai";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Bot } from "lucide-react";

export default async function AdminAiPage() {
  const { totalMessages, recent } = await getAiChatStats();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold">AI Assistent</h1>
        <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">
          Activiteit van de AI-assistent, over alle klanten heen.
        </p>
      </header>

      <section className="card p-6">
        <p className="text-sm text-ink-muted dark:text-ink-dark-muted">Totaal aantal berichten</p>
        <p className="mt-1 font-display text-3xl font-semibold">{totalMessages}</p>
      </section>

      <section className="card border-l-4 border-l-status-progress p-6">
        <h2 className="font-display text-base font-medium">Kennisbank-ingest: nog niet gebouwd</h2>
        <p className="mt-2 text-sm text-ink-muted dark:text-ink-dark-muted">
          De AI-assistent haalt op dit moment enkel op wat er handmatig in <code className="rounded bg-canvas px-1 py-0.5 dark:bg-canvas-dark">ai_documents</code> staat.
          Er bestaat nog geen pipeline die projecten, tickets of facturen automatisch omzet naar doorzoekbare content — dat is een apart, groter traject.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-base font-medium">Recente gesprekken</h2>
        {recent.length === 0 ? (
          <EmptyState icon={Bot} title="Nog geen gesprekken" description="Zodra klanten de AI-assistent gebruiken, verschijnt dat hier." />
        ) : (
          <ul className="space-y-2">
            {recent.map((message) => (
              <li key={message.id} className="card p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Badge tone={message.role === "user" ? "blue" : "gray"}>{message.role === "user" ? "Klant" : "AI"}</Badge>
                    <span className="text-sm text-ink-muted dark:text-ink-dark-muted">{message.companies?.name ?? "—"}</span>
                  </div>
                  <span className="text-xs text-ink-muted dark:text-ink-dark-muted">
                    {new Date(message.created_at).toLocaleString("nl-BE")}
                  </span>
                </div>
                <p className="mt-2 truncate text-sm">{message.content}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
