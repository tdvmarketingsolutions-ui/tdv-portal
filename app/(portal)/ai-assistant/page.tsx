import { getConversationsForCurrentUser } from "@/lib/data/ai";
import { AiAssistantClient } from "./AiAssistantClient";

export default async function AiAssistantPage() {
  const conversations = await getConversationsForCurrentUser();

  return <AiAssistantClient initialConversations={conversations} />;
}
