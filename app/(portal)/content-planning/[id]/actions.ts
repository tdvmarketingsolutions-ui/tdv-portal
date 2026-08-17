"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addContentItemComment, updateContentItemStatus } from "@/lib/data/content";
import type { ContentStatus } from "@/types/domain";
import { contentCommentSchema, type ContentCommentFormValues } from "./schema";

// A client user can only ever approve or ask for a revision — moving content
// to pending_approval/scheduled/published is a staff action (see
// admin/content). RLS allows either role to update this row, so this value
// check is the only thing stopping a client from calling this action
// directly with an arbitrary status.
const CLIENT_ALLOWED_STATUSES = ["approved", "draft"] as const satisfies readonly ContentStatus[];
const clientStatusSchema = z.enum(CLIENT_ALLOWED_STATUSES);

export async function addContentCommentAction(
  contentItemId: string,
  input: ContentCommentFormValues
): Promise<{ error?: string }> {
  const parsed = contentCommentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Vul een opmerking in." };
  }

  try {
    await addContentItemComment(contentItemId, parsed.data.body);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon opmerking niet plaatsen." };
  }

  revalidatePath(`/content-planning/${contentItemId}`);
  return {};
}

export async function updateContentStatusAction(
  contentItemId: string,
  status: ContentStatus
): Promise<{ error?: string }> {
  const parsed = clientStatusSchema.safeParse(status);
  if (!parsed.success) {
    return { error: "Ongeldige status." };
  }

  try {
    await updateContentItemStatus(contentItemId, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon status niet bijwerken." };
  }

  revalidatePath(`/content-planning/${contentItemId}`);
  revalidatePath("/content-planning");
  return {};
}
