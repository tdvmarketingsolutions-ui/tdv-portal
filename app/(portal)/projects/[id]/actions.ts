"use server";

import { revalidatePath } from "next/cache";
import { addProjectComment } from "@/lib/data/projects";
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
