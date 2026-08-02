"use server";

import { revalidatePath } from "next/cache";
import { addTicketMessage } from "@/lib/data/tickets";
import { ticketMessageSchema, type TicketMessageFormValues } from "./schema";

export async function addTicketMessageAction(
  ticketId: string,
  input: TicketMessageFormValues
): Promise<{ error?: string }> {
  const parsed = ticketMessageSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Vul een bericht in." };
  }

  try {
    await addTicketMessage(ticketId, parsed.data.body);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon bericht niet plaatsen." };
  }

  revalidatePath(`/tickets/${ticketId}`);
  return {};
}
