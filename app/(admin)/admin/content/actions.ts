"use server";

import { revalidatePath } from "next/cache";
import { createContentItem } from "@/lib/data/content";
import {
  updateContentItemAdmin,
  uploadContentItemVisual,
  deleteContentItemAdmin,
  duplicateContentItemAdmin,
} from "@/lib/data/admin/content";
import type { ContentStatus } from "@/types/domain";
import { newContentItemSchema, editContentItemSchema, type NewContentItemFormValues, type EditContentItemFormValues } from "./schema";

export async function createContentItemAction(input: NewContentItemFormValues): Promise<{ error?: string }> {
  const parsed = newContentItemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ongeldige gegevens." };
  }

  try {
    await createContentItem({
      companyId: parsed.data.companyId,
      title: parsed.data.title,
      caption: parsed.data.caption || undefined,
      channels: parsed.data.channels,
      scheduledFor: parsed.data.scheduledFor
        ? new Date(parsed.data.scheduledFor).toISOString()
        : undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon content-item niet aanmaken." };
  }

  revalidatePath("/admin/content");
  return {};
}

export async function updateContentItemAction(
  id: string,
  input: EditContentItemFormValues
): Promise<{ error?: string }> {
  const parsed = editContentItemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ongeldige gegevens." };
  }

  try {
    await updateContentItemAdmin(id, {
      title: parsed.data.title,
      caption: parsed.data.caption || null,
      channels: parsed.data.channels,
      scheduledFor: parsed.data.scheduledFor ? new Date(parsed.data.scheduledFor).toISOString() : null,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon content-item niet bijwerken." };
  }

  revalidatePath("/admin/content");
  revalidatePath(`/content-planning/${id}`);
  revalidatePath("/content-planning");
  return {};
}

export async function updateContentItemStatusAction(
  id: string,
  status: ContentStatus
): Promise<{ error?: string }> {
  try {
    await updateContentItemAdmin(id, { status });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon status niet bijwerken." };
  }

  revalidatePath("/admin/content");
  revalidatePath(`/content-planning/${id}`);
  revalidatePath("/content-planning");
  return {};
}

export async function deleteContentItemAction(id: string): Promise<{ error?: string }> {
  try {
    await deleteContentItemAdmin(id);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon content-item niet verwijderen." };
  }

  revalidatePath("/admin/content");
  revalidatePath("/content-planning");
  return {};
}

export async function duplicateContentItemAction(id: string): Promise<{ error?: string }> {
  try {
    await duplicateContentItemAdmin(id);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon content-item niet dupliceren." };
  }

  revalidatePath("/admin/content");
  revalidatePath("/content-planning");
  return {};
}

export async function uploadContentItemVisualAction(
  contentItemId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Kies een bestand om te uploaden." };
  }
  if (file.size > 25 * 1024 * 1024) {
    return { error: "Bestand is te groot (max 25 MB)." };
  }

  try {
    await uploadContentItemVisual(contentItemId, file);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon visual niet uploaden." };
  }

  revalidatePath("/admin/content");
  revalidatePath(`/content-planning/${contentItemId}`);
  return {};
}
