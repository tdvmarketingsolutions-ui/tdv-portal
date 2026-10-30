import { getConversationsForCurrentUser } from "@/lib/data/ai";
import { AiAssistantClient } from "./AiAssistantClient";
import { getAgencyDisplayName } from "@/lib/data/agency-branding";

export default async function AiAssistantPage() {
  const conversations = await getConversationsForCurrentUser();
  const agencyName = await getAgencyDisplayName();

  return <AiAssistantClient initialConversations={conversations} agencyName={agencyName} />;
}
