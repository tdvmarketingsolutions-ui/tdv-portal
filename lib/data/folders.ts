import "server-only";
import { createClient } from "@/lib/supabase/server";
import { resolveListFilterCompanyId, resolveWriteCompanyId } from "@/lib/staff-view";
import type { FileRecord, FolderRecord } from "@/types/domain";

export interface BreadcrumbEntry {
  id: string | null; // null = root ("Bestanden")
  name: string;
}

export interface FolderContents {
  folder: FolderRecord | null; // null = root
  breadcrumb: BreadcrumbEntry[];
  subfolders: FolderRecord[];
  files: FileRecord[];
}

/**
 * folderId null means "root" (files/folders with no parent). Returns
 * `folder: null` for root. Walks parent_id up to build the breadcrumb trail
 * — a handful of small sequential queries rather than a recursive-CTE RPC,
 * since folder nesting here is expected to stay shallow (same "don't reach
 * for SQL views for small volume" call made in lib/data/dashboard.ts).
 */
export async function getFolderContents(folderId: string | null): Promise<FolderContents> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role, company_id").eq("id", user.id).single()
    : { data: null };
  const viewCompanyId = resolveListFilterCompanyId(profile);

  let folder: FolderRecord | null = null;
  const breadcrumb: BreadcrumbEntry[] = [{ id: null, name: "Bestanden" }];

  if (folderId) {
    const { data, error } = await supabase.from("folders").select("*").eq("id", folderId).maybeSingle();
    if (error) throw new Error(`Kon map niet laden: ${error.message}`);
    if (!data) throw new Error("NOT_FOUND");
    folder = data as unknown as FolderRecord;

    const chain: FolderRecord[] = [folder];
    let cursor = folder.parent_id;
    while (cursor) {
      const { data: parent } = await supabase.from("folders").select("*").eq("id", cursor).maybeSingle();
      if (!parent) break;
      const parentFolder = parent as unknown as FolderRecord;
      chain.unshift(parentFolder);
      cursor = parentFolder.parent_id;
    }
    breadcrumb.push(...chain.map((f) => ({ id: f.id, name: f.name })));
  }

  let subfoldersQuery = supabase.from("folders").select("*").order("name");
  subfoldersQuery = folderId ? subfoldersQuery.eq("parent_id", folderId) : subfoldersQuery.is("parent_id", null);
  if (viewCompanyId) subfoldersQuery = subfoldersQuery.eq("company_id", viewCompanyId);

  let filesQuery = supabase.from("files").select("*").order("created_at", { ascending: false });
  filesQuery = folderId ? filesQuery.eq("folder_id", folderId) : filesQuery.is("folder_id", null);
  if (viewCompanyId) filesQuery = filesQuery.eq("company_id", viewCompanyId);

  const [{ data: subfolders, error: subError }, { data: files, error: filesError }] = await Promise.all([
    subfoldersQuery,
    filesQuery,
  ]);
  if (subError) throw new Error(`Kon mappen niet laden: ${subError.message}`);
  if (filesError) throw new Error(`Kon bestanden niet laden: ${filesError.message}`);

  return {
    folder,
    breadcrumb,
    subfolders: (subfolders ?? []) as unknown as FolderRecord[],
    files: (files ?? []) as unknown as FileRecord[],
  };
}

export async function createFolder(input: { parentId: string | null; name: string }): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");

  const { data: profile } = await supabase.from("profiles").select("role, company_id").eq("id", user.id).single();
  const companyId = resolveWriteCompanyId(profile);
  if (!companyId) throw new Error("Geen bedrijf gekoppeld aan dit account.");

  const { error } = await supabase
    .from("folders")
    .insert({ company_id: companyId, parent_id: input.parentId, name: input.name, created_by: user.id });
  if (error) throw new Error(`Kon map niet aanmaken: ${error.message}`);
}

/** RLS (migration 0023) restricts this to staff or the folder's own creator. */
export async function deleteFolder(folderId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("folders").delete().eq("id", folderId);
  if (error) throw new Error(`Kon map niet verwijderen: ${error.message}`);
}
