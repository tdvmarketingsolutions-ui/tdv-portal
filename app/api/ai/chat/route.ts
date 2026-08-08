import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

/**
 * RAG flow:
 *  1. Auth + resolve the caller's company_id via the RLS-bound server client
 *     (never trust a company_id from the request body).
 *  2. Ensure a conversation exists (reuse the given conversationId, or start
 *     a new one titled after the first message).
 *  3. Embed the latest user message — best-effort: if the embeddings
 *     provider isn't configured or fails, skip retrieval rather than
 *     crashing the whole request (this was the actual bug behind "the
 *     assistant doesn't reply": an unconfigured EMBEDDINGS_API_KEY threw
 *     inside embedText() with nothing catching it, so the route 500'd and
 *     the chat UI — which had no error handling either — just sat there).
 *  4. Vector-search `ai_documents` filtered to that company_id — this filter
 *     is a defense-in-depth belt (ai_documents has no client SELECT policy
 *     at all, see migration), not the only thing standing between tenants.
 *  5. Call Claude with retrieved chunks as context, persist both turns.
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

  const { messages, conversationId: incomingConversationId }: { messages: ChatMessage[]; conversationId?: string } =
    await req.json();
  const latestQuestion = messages[messages.length - 1]?.content ?? "";
  if (!latestQuestion.trim()) {
    return NextResponse.json({ error: "Bericht is leeg." }, { status: 400 });
  }

  // --- Conversation ----------------------------------------------------------
  let conversationId = incomingConversationId;
  if (!conversationId) {
    const title = latestQuestion.length > 60 ? `${latestQuestion.slice(0, 57)}…` : latestQuestion;
    const { data: conversation, error: conversationError } = await supabase
      .from("ai_conversations")
      .insert({ company_id: profile.company_id, user_id: user.id, title })
      .select("id")
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json(
        { error: `Kon gesprek niet starten: ${conversationError?.message}` },
        { status: 500 }
      );
    }
    conversationId = (conversation as { id: string }).id;
  } else {
    // Bump updated_at so the conversation list sorts recently-active threads first.
    await supabase.from("ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
  }

  // --- Retrieval (best-effort) -------------------------------------------------
  let context = "";
  try {
    const queryEmbedding = await embedText(latestQuestion);
    const { data: matches, error: matchError } = await supabase.rpc("match_ai_documents", {
      query_embedding: queryEmbedding,
      match_company_id: profile.company_id,
      match_count: 8,
    });

    if (matchError) {
      console.error("RAG retrieval failed:", matchError.message);
    } else {
      context = ((matches ?? []) as { content: string }[]).map((m) => `- ${m.content}`).join("\n");
    }
  } catch (err) {
    // No embeddings provider configured, or the provider call failed — answer
    // without retrieved context rather than failing the whole request.
    console.error("Embedding/retrieval step failed, continuing without context:", err);
  }

  // --- Generation ------------------------------------------------------------
  const systemPrompt = `Je bent de AI Assistent van het TDV klantenportaal. Je antwoordt in de stijl en met de
kennis van een medior marketing manager: professioneel, ter zake, met concrete en praktische
adviezen — geen algemeenheden, geen overdreven verkooppraat. Je legt vaktermen kort uit als dat
nuttig is, maar praat als een collega, niet als een handleiding.

Je beantwoordt vragen van één specifieke klant, uitsluitend op basis van de onderstaande context
(hun eigen projecten, tickets, content en facturen bij TDV). Als het antwoord niet in de context
staat, zeg dat eerlijk — verzin niets.

Context:
${context || "(geen relevante documenten gevonden)"}`;

  let reply: string;
  if (!process.env.ANTHROPIC_API_KEY) {
    reply = "De AI-assistent is nog niet volledig geconfigureerd (ontbrekende API-key) — neem contact op met TDV.";
  } else {
    try {
      const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: systemPrompt,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!anthropicRes.ok) {
        const errBody = await anthropicRes.text();
        console.error("Anthropic API error:", anthropicRes.status, errBody);
        reply = "Sorry, ik kon geen antwoord genereren. Probeer het straks opnieuw.";
      } else {
        const anthropicData = await anthropicRes.json();
        reply =
          anthropicData.content?.find((b: { type: string }) => b.type === "text")?.text ??
          "Sorry, ik kon geen antwoord genereren.";
      }
    } catch (err) {
      console.error("Anthropic API call failed:", err);
      reply = "Sorry, er ging iets mis bij het genereren van een antwoord. Probeer het straks opnieuw.";
    }
  }

  const { error: insertError } = await supabase.from("ai_chat_messages").insert([
    { company_id: profile.company_id, user_id: user.id, conversation_id: conversationId, role: "user", content: latestQuestion },
    { company_id: profile.company_id, user_id: user.id, conversation_id: conversationId, role: "assistant", content: reply },
  ]);
  if (insertError) {
    console.error("Kon chatberichten niet opslaan:", insertError.message);
  }

  return NextResponse.json({ reply, conversationId });
}

/**
 * Embedding provider — pluggable. Anthropic's API does not currently expose
 * an embeddings endpoint, so this calls an external provider (OpenAI shown
 * here; Voyage AI is Anthropic's suggested alternative). Swap the fetch
 * below for whichever the team settles on; the pgvector column is sized
 * for 1536-dim embeddings by default (see migration) — adjust both together.
 * Throws if the provider isn't configured or fails — callers must treat
 * retrieval as best-effort and catch this.
 */
async function embedText(text: string): Promise<number[]> {
  if (!process.env.EMBEDDINGS_API_KEY) {
    throw new Error("EMBEDDINGS_API_KEY is not configured.");
  }

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.EMBEDDINGS_API_KEY}`,
    },
    body: JSON.stringify({ model: process.env.AI_EMBEDDINGS_MODEL ?? "text-embedding-3-large", input: text }),
  });

  if (!res.ok) {
    throw new Error(`Embeddings provider returned ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return data.data[0].embedding;
}
