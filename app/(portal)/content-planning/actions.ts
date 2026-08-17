"use server";

import { revalidatePath } from "next/cache";
import { createContentItemForCurrentUser } from "@/lib/data/content";
import { updateContentItemAdmin, uploadContentItemVisual } from "@/lib/data/admin/content";
import { newContentItemSchema, editContentItemSchema, type NewContentItemFormValues, type EditContentItemFormValues } from "./schema";

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

// The three actions below are staff-only — updateContentItemAdmin and
// uploadContentItemVisual both self-verify via assertTdvStaff() (see
// lib/auth/assert-staff.ts), since this route isn't gated the way
// /admin/* is. The calendar UI only renders the controls that call these
// when the page has already determined the caller is staff, but the check
// has to live in the data layer too, not just "the button isn't there."

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
      channel: parsed.data.channel,
      scheduledFor: parsed.data.scheduledFor ? new Date(parsed.data.scheduledFor).toISOString() : null,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon content-item niet bijwerken." };
  }

  revalidatePath("/content-planning");
  revalidatePath(`/content-planning/${id}`);
  revalidatePath("/admin/content");
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

  revalidatePath("/content-planning");
  revalidatePath(`/content-planning/${contentItemId}`);
  revalidatePath("/admin/content");
  return {};
}

/**
 * Drag-and-drop reschedule. dateKey is a "yyyy-MM-dd" string (the day the
 * item was dropped on), or null to move it back to the unscheduled tray.
 * Mirrors the existing date-only convention across the app (there's no
 * time-of-day picker anywhere) — a drop always lands at UTC midnight of
 * that day, same as typing a date into the create/edit forms.
 */
export async function rescheduleContentItemAction(id: string, dateKey: string | null): Promise<{ error?: string }> {
  try {
    await updateContentItemAdmin(id, {
      scheduledFor: dateKey ? new Date(`${dateKey}T00:00:00.000Z`).toISOString() : null,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon datum niet wijzigen." };
  }

  revalidatePath("/content-planning");
  revalidatePath("/admin/content");
  return {};
}
