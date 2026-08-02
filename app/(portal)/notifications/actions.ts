"use server";

import { revalidatePath } from "next/cache";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/data/notifications";

export async function markNotificationReadAction(id: string): Promise<{ error?: string }> {
  try {
    await markNotificationRead(id);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon melding niet bijwerken." };
  }
  revalidatePath("/notifications");
  return {};
}

export async function markAllReadAction(): Promise<{ error?: string }> {
  try {
    await markAllNotificationsRead();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon meldingen niet bijwerken." };
  }
  revalidatePath("/notifications");
  return {};
}
