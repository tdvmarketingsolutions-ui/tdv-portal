"use server";

import { revalidatePath } from "next/cache";
import { addContentItemComment, updateContentItemStatus } from "@/lib/data/content";
import type { ContentStatus } from "@/types/domain";
import { contentCommentSchema, type ContentCommentFormValues } from "./schema";

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
  try {
    await updateContentItemStatus(contentItemId, status);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon status niet bijwerken." };
  }

  revalidatePath(`/content-planning/${contentItemId}`);
  revalidatePath("/content-planning");
  return {};
}
