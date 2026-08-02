import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

/**
 * RAG flow:
 *  1. Auth + resolve the caller's company_id via the RLS-bound server client
 *     (never trust a company_id from the request body).
 *  2. Embed the latest user message.
 *  3. Vector-search `ai_documents` filtered to that company_id — this filter
 *     is a defense-in-depth belt (ai_documents has no client SELECT policy
 *     at all, see migration), not the only thing standing between tenants.
 *  4. Send the retrieved chunks + question to Claude, and persist both
 *     turns to ai_chat_messages for the conversation history / activity log.
 */
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) {
    return NextResponse.json({ error: "Geen bedrijf gekoppeld aan dit account." }, { status: 403 });
  }

  const { messages }: { messages: ChatMessage[] } = await req.json();
  const latestQuestion = messages[messages.length - 1]?.content ?? "";

  // --- Retrieval -----------------------------------------------------------
  const queryEmbedding = await embedText(latestQuestion);

  const { data: matches, error: matchError } = await supabase.rpc("match_ai_documents", {
    query_embedding: queryEmbedding,
    match_company_id: profile.company_id,
    match_count: 8,
  });

  if (matchError) {
    // Fail soft: answer without retrieval context rather than erroring out.
    console.error("RAG retrieval failed:", matchError.message);
  }

  const context = ((matches ?? []) as { content: string }[])
    .map((m) => `- ${m.content}`)
    .join("\n");

  // --- Generation ------------------------------------------------------------
  const systemPrompt = `Je bent de AI Assistent van het TDV klantenportaal.
Je beantwoordt vragen van één specifieke klant, uitsluitend op basis van de
onderstaande context (hun eigen projecten, tickets, content en facturen).
Als het antwoord niet in de context staat, zeg dat eerlijk — verzin niets.

Context:
${context || "(geen relevante documenten gevonden)"}`;

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  const anthropicData = await anthropicRes.json();
  const reply = anthropicData.content?.find((b: { type: string }) => b.type === "text")?.text
    ?? "Sorry, ik kon geen antwoord genereren.";

  // Persist both turns (fire-and-forget from the response's perspective).
  await supabase.from("ai_chat_messages").insert([
    { company_id: profile.company_id, user_id: user.id, role: "user", content: latestQuestion },
    { company_id: profile.company_id, user_id: user.id, role: "assistant", content: reply },
  ]);

  return NextResponse.json({ reply });
}

/**
 * Embedding provider — pluggable. Anthropic's API does not currently expose
 * an embeddings endpoint, so this calls an external provider (OpenAI shown
 * here; Voyage AI is Anthropic's suggested alternative). Swap the fetch
 * below for whichever the team settles on; the pgvector column is sized
 * for 1536-dim embeddings by default (see migration) — adjust both together.
 */
async function embedText(text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.EMBEDDINGS_API_KEY}`,
    },
    body: JSON.stringify({ model: process.env.AI_EMBEDDINGS_MODEL ?? "text-embedding-3-large", input: text }),
  });
  const data = await res.json();
  return data.data[0].embedding;
}
