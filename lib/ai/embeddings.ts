import "server-only";

/**
 * Embedding provider — pluggable. Anthropic's API does not currently expose
 * an embeddings endpoint, so this calls an external provider (OpenAI shown
 * here; Voyage AI is Anthropic's suggested alternative). Swap the fetch
 * below for whichever the team settles on; the pgvector column is sized
 * for 1536-dim embeddings by default (see supabase/migrations/0002_ai_search.sql)
 * — adjust both together.
 *
 * Shared by the RAG chat route (single-query embedding) and the admin
 * knowledge-base ingest pipeline (bulk embedding), so there is exactly one
 * place that knows how to talk to the embeddings provider.
 *
 * Throws if the provider isn't configured or the request fails — callers
 * that treat retrieval as best-effort (like the chat route) must catch this
 * themselves; callers that require embeddings (like ingest) should let it
 * propagate.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  if (!process.env.EMBEDDINGS_API_KEY) {
    throw new Error("EMBEDDINGS_API_KEY is not configured.");
  }

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.EMBEDDINGS_API_KEY}`,
    },
    body: JSON.stringify({ model: process.env.AI_EMBEDDINGS_MODEL ?? "text-embedding-3-large", input: texts }),
  });

  if (!res.ok) {
    throw new Error(`Embeddings provider returned ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  // The provider returns entries in the same order as the input, but each
  // carries its own `index` too — sort by it rather than trusting order.
  return (data.data as { embedding: number[]; index: number }[])
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.embedding);
}

export async function embedText(text: string): Promise<number[]> {
  const embeddings = await embedTexts([text]);
  const embedding = embeddings[0];
  if (!embedding) {
    throw new Error("Embeddings provider returned no embedding for the given text.");
  }
  return embedding;
}
