"use server";

import { revalidatePath } from "next/cache";
import { addDeliverableComment, updateDeliverableVersionStatus } from "@/lib/data/deliverables";
import { uploadDeliverableVersion } from "@/lib/data/admin/deliverables";
import type { FeedbackStatus } from "@/types/domain";
import { deliverableCommentSchema, type DeliverableCommentFormValues } from "./schema";

export async function addDeliverableCommentAction(
  deliverableId: string,
  deliverableVersionId: string,
  input: DeliverableCommentFormValues
): Promise<{ error?: string }> {
  const parsed = deliverableCommentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Vul een opmerking in." };
  }

  try {
    await addDeliverableComment({
      deliverableVersionId,
      body: parsed.data.body,
      anchorX: parsed.data.anchorX,
      anchorY: parsed.data.anchorY,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon opmerking niet plaatsen." };
  }

  revalidatePath(`/feedback/${deliverableId}`);
  return {};
}

export async function updateVersionStatusAction(
  deliverableId: string,
  versionId: string,
  status: FeedbackStatus
): Promise<{ error?: string }> {
  try {
    await updateDeliverableVersionStatus(versionId, status);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon status niet bijwerken." };
  }

  revalidatePath(`/feedback/${deliverableId}`);
  revalidatePath("/feedback");
  return {};
}

export async function uploadDeliverableVersionAction(
  deliverableId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Kies eerst een bestand." };
  }
  if (file.size > 25 * 1024 * 1024) {
    return { error: "Bestand is te groot (max 25 MB)." };
  }

  try {
    await uploadDeliverableVersion({ deliverableId, file });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon versie niet uploaden." };
  }

  revalidatePath(`/feedback/${deliverableId}`);
  revalidatePath("/feedback");
  revalidatePath("/projects");
  return {};
}
