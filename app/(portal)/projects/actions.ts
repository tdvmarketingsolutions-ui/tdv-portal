"use server";

import { revalidatePath } from "next/cache";
import { createProjectRequest, respondToProjectRequestPrice } from "@/lib/data/project-requests";
import { newProjectRequestSchema, type NewProjectRequestFormValues } from "./schema";

export async function createProjectRequestAction(input: NewProjectRequestFormValues): Promise<{ error?: string }> {
  const parsed = newProjectRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ongeldige gegevens." };
  }

  try {
    await createProjectRequest({
      title: parsed.data.title,
      projectType: parsed.data.projectType,
      budgetIndication: parsed.data.budgetIndication,
      description: parsed.data.description || undefined,
      desiredDeadline: parsed.data.desiredDeadline || undefined,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon projectaanvraag niet versturen." };
  }

  revalidatePath("/projects");
  return {};
}

export async function respondToProjectRequestPriceAction(
  requestId: string,
  accepted: boolean
): Promise<{ error?: string }> {
  try {
    await respondToProjectRequestPrice(requestId, accepted);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon niet reageren op het prijsvoorstel." };
  }

  revalidatePath("/projects");
  return {};
}
