"use client";

import { useState } from "react";
import { Sparkles, Send } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: input }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: nextMessages }),
    });

    const data = await res.json();
    setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    setLoading(false);
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-2xl flex-col">
      <header className="flex items-center gap-2 pb-4">
        <Sparkles size={20} className="text-accent" />
        <h1 className="font-display text-xl font-semibold">AI Assistent</h1>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <div className="card p-5 text-sm text-ink-muted dark:text-ink-dark-muted">
            Stel een vraag over je projecten, tickets, content of facturen — de assistent
            antwoordt op basis van jouw gegevens bij TDV, niet die van andere klanten.
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
              m.role === "user"
                ? "ml-auto bg-accent text-white"
                : "card"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && <div className="card w-fit px-4 py-3 text-sm text-ink-muted">Bezig met antwoorden…</div>}
      </div>

      <form onSubmit={sendMessage} className="flex gap-2 border-t border-border pt-4 dark:border-border-dark">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Bv. welke posts staan er volgende week gepland?"
          className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent dark:border-border-dark dark:bg-surface-dark"
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
