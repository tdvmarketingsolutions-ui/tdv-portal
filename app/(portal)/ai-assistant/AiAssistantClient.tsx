"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, Plus, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/ToastProvider";
import type { AiConversation, AiMessage } from "@/lib/data/ai";
import { loadConversationMessagesAction } from "./actions";

type Message = { id?: string; role: "user" | "assistant"; content: string };

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

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: question }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, conversationId: activeConversationId ?? undefined }),
      });

      if (!res.ok) {
        throw new Error(`Server antwoordde met status ${res.status}`);
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);

      if (!activeConversationId && data.conversationId) {
        setActiveConversationId(data.conversationId);
        const title = question.length > 60 ? `${question.slice(0, 57)}…` : question;
        setConversations((current) => [
          { id: data.conversationId, title, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          ...current,
        ]);
      } else if (activeConversationId) {
        setConversations((current) => {
          const updated = current.find((c) => c.id === activeConversationId);
          if (!updated) return current;
          return [
            { ...updated, updated_at: new Date().toISOString() },
            ...current.filter((c) => c.id !== activeConversationId),
          ];
        });
      }
    } catch (err) {
      push(err instanceof Error ? err.message : "Kon geen antwoord ophalen.", "error");
      setMessages([
        ...nextMessages,
        { role: "assistant", content: "Sorry, er ging iets mis. Probeer het straks opnieuw." },
      ]);
    } finally {
      setLoading(false);
    }
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
                    ? "bg-accent-soft text-accent dark:bg-accent/15 dark:text-accent-dark"
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
            <Sparkles size={20} className="text-accent dark:text-accent-dark" />
            <h1 className="font-display text-xl font-semibold">AI Assistent</h1>
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
              Stel een vraag over je projecten, tickets, content of facturen — de assistent
              antwoordt op basis van jouw gegevens bij TDV, niet die van andere klanten.
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={m.id ?? i}
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm",
                  m.role === "user" ? "ml-auto bg-accent text-white" : "card"
                )}
              >
                {m.content}
              </div>
            ))
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
          <button type="submit" className="btn-primary" disabled={loading || !input.trim()}>
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
