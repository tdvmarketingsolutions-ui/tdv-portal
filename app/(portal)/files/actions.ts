"use server";

import { revalidatePath } from "next/cache";
import { uploadFile, deleteFile, moveFile } from "@/lib/data/files";
import { createFolder, deleteFolder } from "@/lib/data/folders";
import { FILE_CATEGORIES, type FileCategory } from "@/lib/file-category";

function folderPath(folderId: string | null): string {
  return folderId ? `/files/${folderId}` : "/files";
}

export async function uploadFileAction(formData: FormData): Promise<{ error?: string }> {
  const file = formData.get("file");
  const category = formData.get("category");
  const folderId = (formData.get("folderId") as string | null) || null;

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
    await uploadFile({ file, category: category as FileCategory, folderId });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon bestand niet uploaden." };
  }

  revalidatePath(folderPath(folderId));
  return {};
}

export async function deleteFileAction(fileId: string, folderId: string | null): Promise<{ error?: string }> {
  try {
    await deleteFile(fileId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon bestand niet verwijderen." };
  }

  revalidatePath(folderPath(folderId));
  return {};
}

export async function moveFileAction(
  fileId: string,
  targetFolderId: string | null,
  currentFolderId: string | null
): Promise<{ error?: string }> {
  try {
    await moveFile(fileId, targetFolderId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon bestand niet verplaatsen." };
  }

  revalidatePath(folderPath(currentFolderId));
  revalidatePath(folderPath(targetFolderId));
  return {};
}

export async function createFolderAction(
  parentId: string | null,
  name: string
): Promise<{ error?: string }> {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Vul een naam in." };

  try {
    await createFolder({ parentId, name: trimmed });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon map niet aanmaken." };
  }

  revalidatePath(folderPath(parentId));
  return {};
}

export async function deleteFolderAction(folderId: string, parentId: string | null): Promise<{ error?: string }> {
  try {
    await deleteFolder(folderId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon map niet verwijderen." };
  }

  revalidatePath(folderPath(parentId));
  return {};
}
