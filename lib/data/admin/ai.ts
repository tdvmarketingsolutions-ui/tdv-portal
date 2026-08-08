import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface AiChatMessageSummary {
  id: string;
  role: string;
  content: string;
  created_at: string;
  companies: { name: string } | null;
}

export async function getAiChatStats(): Promise<{ totalMessages: number; recent: AiChatMessageSummary[] }> {
  const supabase = createClient();

  const [{ count }, { data: recent, error }] = await Promise.all([
    supabase.from("ai_chat_messages").select("id", { count: "exact", head: true }),
    supabase
      .from("ai_chat_messages")
      .select("id, role, content, created_at, companies ( name )")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (error) throw new Error(`Kon AI-activiteit niet laden: ${error.message}`);

  return {
    totalMessages: count ?? 0,
    recent: (recent ?? []) as unknown as AiChatMessageSummary[],
  };
}
