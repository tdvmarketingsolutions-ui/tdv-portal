"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, Plus, MessageSquare, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/ToastProvider";
import type { AiConversation, AiMessage } from "@/lib/data/ai";
import { loadConversationMessagesAction } from "./actions";

// failed: een vraag waarop geen antwoord kwam. Blijft zichtbaar met
// "Opnieuw proberen", maar gaat nooit mee in de geschiedenis naar de API;
// een nieuwe vraag vervangt hem.
type Message = { id?: string; role: "user" | "assistant"; content: string; failed?: boolean };

export function AiAssistantClient({ initialConversations }: { initialConversations: AiConversation[] }) {
  const { push } = useToast();
  const [conversations, setConversations] = useState(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function startNewConversation() {
    setActiveConversationId(null);
    setMessages([]);
    setSidebarOpen(false);
  }

  async function openConversation(id: string) {
    setActiveConversationId(id);
    setSidebarOpen(false);
    setLoadingThread(true);
    try {
      const thread = await loadConversationMessagesAction(id);
      setMessages(thread.map((m: AiMessage) => ({ id: m.id, role: m.role, content: m.content })));
    } catch {
      push("Kon dit gesprek niet laden.", "error");
    } finally {
      setLoadingThread(false);
    }
  }

  function rememberConversation(conversationId: string, question: string) {
    if (!activeConversationId) {
      setActiveConversationId(conversationId);
      const title = question.length > 60 ? `${question.slice(0, 57)}…` : question;
      const now = new Date().toISOString();
      setConversations((current) =>
        current.some((c) => c.id === conversationId)
          ? current
          : [{ id: conversationId, title, created_at: now, updated_at: now }, ...current]
      );
    } else {
      setConversations((current) => {
        const updated = current.find((c) => c.id === activeConversationId);
        if (!updated) return current;
        return [
          { ...updated, updated_at: new Date().toISOString() },
          ...current.filter((c) => c.id !== activeConversationId),
        ];
      });
    }
  }

  async function ask(question: string, history: Message[]) {
    const sent = history.filter((m) => !m.failed);
    const nextMessages: Message[] = [...sent, { role: "user", content: question }];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
          conversationId: activeConversationId ?? undefined,
        }),
      });
      const data: { reply?: string; conversationId?: string; error?: string } = await res.json().catch(() => ({}));
      // Ook bij een fout kan er al een gesprek aangemaakt zijn: dan blijft
      // "opnieuw proberen" in datzelfde gesprek.
      if (data.conversationId) rememberConversation(data.conversationId, question);
      if (!res.ok || !data.reply) throw new Error(data.error ?? "Kon geen antwoord ophalen. Controleer je verbinding en probeer opnieuw.");

      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      push(err instanceof Error ? err.message : "Kon geen antwoord ophalen.", "error");
      setMessages([...sent, { role: "user", content: question, failed: true }]);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;
    setInput("");
    await ask(question, messages);
  }

  function retry(question: string) {
    if (loading) return;
    void ask(question, messages);
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6 md:h-[calc(100vh-5rem)]">
      {/* Conversation list — drawer on mobile, static column on desktop */}
      <aside
        className={cn(
          "w-64 shrink-0 flex-col gap-2 overflow-y-auto",
          sidebarOpen ? "fixed inset-0 z-40 flex bg-canvas p-4 dark:bg-canvas-dark md:static md:z-auto md:bg-transparent md:p-0" : "hidden md:flex"
        )}
      >
        <button
          type="button"
          onClick={startNewConversation}
          className="btn-secondary mb-2 w-full justify-start gap-2"
        >
          <Plus size={16} strokeWidth={1.75} />
          Nieuw gesprek
        </button>
        <div className="flex-1 space-y-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="px-2 text-xs text-ink-muted dark:text-ink-dark-muted">Nog geen eerdere gesprekken.</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => openConversation(c.id)}
                className={cn(
                  "flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                  c.id === activeConversationId
                    ? "bg-accent-soft text-accent-text dark:bg-accent/15"
                    : "text-ink-muted hover:bg-canvas hover:text-ink dark:text-ink-dark-muted dark:hover:bg-canvas-dark dark:hover:text-ink-dark"
                )}
              >
                <MessageSquare size={15} strokeWidth={1.75} className="mt-0.5 shrink-0" />
                <span className="truncate">{c.title}</span>
              </button>
            ))
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-2 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-accent-text" />
            <h1 className="font-display text-h2 font-semibold sm:text-h1">ai-assistent.</h1>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="btn-secondary md:hidden"
          >
            Gesprekken
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pb-4">
          {loadingThread ? (
            <div className="card w-fit px-4 py-3 text-sm text-ink-muted dark:text-ink-dark-muted">Gesprek laden…</div>
          ) : messages.length === 0 ? (
            <div className="card p-5 text-sm text-ink-muted dark:text-ink-dark-muted">
              Stel een vraag over je projecten, aanvragen, content of facturen — de assistent
              antwoordt op basis van jouw gegevens bij TDV, niet die van andere klanten.
            </div>
          ) : (
            messages.map((m, i) =>
              m.failed ? (
                <div key={m.id ?? i} className="ml-auto flex max-w-[85%] flex-col items-end gap-1.5">
                  <div className="whitespace-pre-wrap rounded-2xl border border-dashed border-border-strong px-4 py-3 text-sm dark:border-border-strong-dark">
                    {m.content}
                  </div>
                  <p className="flex items-center gap-2 text-xs text-ink-muted dark:text-ink-dark-muted">
                    Geen antwoord ontvangen.
                    <button
                      type="button"
                      onClick={() => retry(m.content)}
                      disabled={loading}
                      className="focus-ring inline-flex items-center gap-1 rounded-md font-medium text-accent-text hover:underline disabled:opacity-40"
                    >
                      <RotateCcw size={12} strokeWidth={2} />
                      Opnieuw proberen
                    </button>
                  </p>
                </div>
              ) : (
                <div
                  key={m.id ?? i}
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm",
                    m.role === "user" ? "ml-auto bg-accent text-accent-fg" : "card"
                  )}
                >
                  {m.content}
                </div>
              )
            )
          )}
          {loading && (
            <div className="card w-fit px-4 py-3 text-sm text-ink-muted dark:text-ink-dark-muted">Bezig met antwoorden…</div>
          )}
        </div>

        <form onSubmit={sendMessage} className="flex gap-2 border-t border-border pt-4 dark:border-border-dark">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Bv. welke posts staan er volgende week gepland?"
            className="input flex-1"
          />
          <button type="submit" aria-label="Verstuur bericht" className="btn-primary" disabled={loading || !input.trim()}>
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
