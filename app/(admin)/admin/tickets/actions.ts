"use server";

import { revalidatePath } from "next/cache";
import { updateTicketStatusAdmin } from "@/lib/data/admin/tickets";
import type { TicketStatus } from "@/types/domain";

export async function updateTicketStatusAction(
  ticketId: string,
  status: TicketStatus
): Promise<{ error?: string }> {
  try {
    await updateTicketStatusAdmin(ticketId, status);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon status niet bijwerken." };
  }

  revalidatePath("/admin/tickets");
  return {};
}
