"use server";

import { revalidatePath } from "next/cache";
import { createProjectAdmin, updateProjectStatusAdmin } from "@/lib/data/admin/projects";
import type { ProjectStatus } from "@/types/domain";
import { newProjectSchema, type NewProjectFormValues } from "./schema";

export async function createProjectAction(input: NewProjectFormValues): Promise<{ error?: string }> {
  const parsed = newProjectSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ongeldige gegevens." };
  }

  try {
    await createProjectAdmin({
      companyId: parsed.data.companyId,
      name: parsed.data.name,
      description: parsed.data.description || undefined,
      deadline: parsed.data.deadline || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon project niet aanmaken." };
  }

  revalidatePath("/admin/projects");
  return {};
}

export async function updateProjectStatusAction(
  projectId: string,
  status: ProjectStatus
): Promise<{ error?: string }> {
  try {
    await updateProjectStatusAdmin(projectId, status);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon status niet bijwerken." };
  }

  revalidatePath("/admin/projects");
  return {};
}
