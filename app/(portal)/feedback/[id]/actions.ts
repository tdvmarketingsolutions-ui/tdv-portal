"use server";

import { revalidatePath } from "next/cache";
import { addDeliverableComment, updateDeliverableVersionStatus } from "@/lib/data/deliverables";
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
