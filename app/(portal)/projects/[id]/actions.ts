"use server";

import { revalidatePath } from "next/cache";
import { addProjectComment } from "@/lib/data/projects";
import { createDeliverable, uploadDeliverableVersion } from "@/lib/data/admin/deliverables";
import { projectCommentSchema, type ProjectCommentFormValues } from "./schema";

export async function addProjectCommentAction(
  projectId: string,
  input: ProjectCommentFormValues
): Promise<{ error?: string }> {
  const parsed = projectCommentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Vul een opmerking in." };
  }

  try {
    await addProjectComment(projectId, parsed.data.body);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon opmerking niet plaatsen." };
  }

  revalidatePath(`/projects/${projectId}`);
  return {};
}

export async function createDeliverableAction(
  projectId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const title = (formData.get("title") as string | null)?.trim();
  const file = formData.get("file");
  if (!title) return { error: "Vul een titel in." };
  if (!(file instanceof File) || file.size === 0) return { error: "Kies een bestand." };
  if (file.size > 25 * 1024 * 1024) return { error: "Bestand is te groot (max 25 MB)." };

  try {
    const deliverable = await createDeliverable({ projectId, title });
    await uploadDeliverableVersion({ deliverableId: deliverable.id, file });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon deliverable niet aanmaken." };
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/feedback");
  return {};
}
