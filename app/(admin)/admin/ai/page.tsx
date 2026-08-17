import { getAiChatStats, getKnowledgeBaseStats } from "@/lib/data/admin/ai";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Bot } from "lucide-react";
import { IngestButton } from "./IngestButton";

export default async function AdminAiPage() {
  const [{ totalMessages, recent }, kbStats] = await Promise.all([getAiChatStats(), getKnowledgeBaseStats()]);

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

      <section className="card space-y-3 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-medium">Kennisbank</h2>
            <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">
              Projecten, tickets, feedback en contentplanning worden hier omgezet naar doorzoekbare fragmenten in{" "}
              <code className="rounded bg-canvas px-1 py-0.5 dark:bg-canvas-dark">ai_documents</code>, zodat de
              AI-assistent er per klant in kan zoeken.
            </p>
          </div>
          <IngestButton />
        </div>
        <div className="flex flex-wrap gap-6 border-t border-border pt-3 text-sm dark:border-border-dark">
          <div>
            <p className="text-ink-muted dark:text-ink-dark-muted">Fragmenten</p>
            <p className="font-medium">{kbStats.totalChunks}</p>
          </div>
          <div>
            <p className="text-ink-muted dark:text-ink-dark-muted">Laatste ingest</p>
            <p className="font-medium">
              {kbStats.lastIngestedAt ? new Date(kbStats.lastIngestedAt).toLocaleString("nl-BE") : "Nog niet gedraaid"}
            </p>
          </div>
        </div>
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
