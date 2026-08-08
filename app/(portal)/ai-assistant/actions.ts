"use server";

import { getConversationMessages, type AiMessage } from "@/lib/data/ai";

export async function loadConversationMessagesAction(conversationId: string): Promise<AiMessage[]> {
  return getConversationMessages(conversationId);
}
