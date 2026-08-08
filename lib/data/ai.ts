import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface AiConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export async function getConversationsForCurrentUser(): Promise<AiConversation[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("ai_conversations")
    .select("id, title, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`Kon gesprekken niet laden: ${error.message}`);
  return (data ?? []) as unknown as AiConversation[];
}

export async function getConversationMessages(conversationId: string): Promise<AiMessage[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ai_chat_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Kon berichten niet laden: ${error.message}`);
  return (data ?? []) as unknown as AiMessage[];
}
