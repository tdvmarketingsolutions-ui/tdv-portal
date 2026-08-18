"use server";

import { revalidatePath } from "next/cache";
import { createProjectRequest } from "@/lib/data/project-requests";
import { newProjectRequestSchema, type NewProjectRequestFormValues } from "./schema";

export async function createProjectRequestAction(input: NewProjectRequestFormValues): Promise<{ error?: string }> {
  const parsed = newProjectRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ongeldige gegevens." };
  }

  try {
    await createProjectRequest({
      title: parsed.data.title,
      description: parsed.data.description || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon projectaanvraag niet versturen." };
  }

  revalidatePath("/projects");
  return {};
}
