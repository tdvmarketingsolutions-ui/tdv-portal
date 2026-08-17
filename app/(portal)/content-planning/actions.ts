"use server";

import { revalidatePath } from "next/cache";
import { createContentItemForCurrentUser } from "@/lib/data/content";
import { newContentItemSchema, type NewContentItemFormValues } from "./schema";

export async function createContentItemAction(input: NewContentItemFormValues): Promise<{ error?: string }> {
  const parsed = newContentItemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ongeldige gegevens." };
  }

  try {
    await createContentItemForCurrentUser({
      title: parsed.data.title,
      caption: parsed.data.caption || undefined,
      channel: parsed.data.channel,
      scheduledFor: parsed.data.scheduledFor ? new Date(parsed.data.scheduledFor).toISOString() : undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon content-item niet aanmaken." };
  }

  revalidatePath("/content-planning");
  return {};
}
