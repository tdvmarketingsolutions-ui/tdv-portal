"use server";

import { revalidatePath } from "next/cache";
import { uploadFile, deleteFile } from "@/lib/data/files";
import { FILE_CATEGORIES, type FileCategory } from "@/lib/file-category";

export async function uploadFileAction(formData: FormData): Promise<{ error?: string }> {
  const file = formData.get("file");
  const category = formData.get("category");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Kies een bestand om te uploaden." };
  }
  if (typeof category !== "string" || !FILE_CATEGORIES.includes(category as FileCategory)) {
    return { error: "Kies een categorie." };
  }
  if (file.size > 25 * 1024 * 1024) {
    return { error: "Bestand is te groot (max 25 MB)." };
  }

  try {
    await uploadFile({ file, category: category as FileCategory });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon bestand niet uploaden." };
  }

  revalidatePath("/files");
  return {};
}

export async function deleteFileAction(fileId: string): Promise<{ error?: string }> {
  try {
    await deleteFile(fileId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon bestand niet verwijderen." };
  }

  revalidatePath("/files");
  return {};
}
