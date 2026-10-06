import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Folder, FileStack } from "lucide-react";
import { getFolderContents } from "@/lib/data/folders";
import { EmptyState } from "@/components/ui/EmptyState";
import { UploadDialog } from "./UploadDialog";
import { NewFolderDialog } from "./NewFolderDialog";
import { DeleteFolderButton } from "./DeleteFolderButton";
import { FileList } from "./FileList";

export async function FolderBrowser({ folderId }: { folderId: string | null }) {
  let contents;
  try {
    contents = await getFolderContents(folderId);
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") notFound();
    throw err;
  }

  const { folder, breadcrumb, subfolders, files } = contents;
  const parentCrumb = breadcrumb.length >= 2 ? breadcrumb[breadcrumb.length - 2] : null;
  const isEmpty = subfolders.length === 0 && files.length === 0;

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        {/* Broodkruimelpad: toont altijd waar je je bevindt, elke stap klikbaar. */}
        <nav aria-label="Broodkruimelpad" className="flex flex-wrap items-center gap-1 text-sm">
          {breadcrumb.map((crumb, i) => (
            <span key={crumb.id ?? "root"} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={14} strokeWidth={1.75} className="text-ink-muted dark:text-ink-dark-muted" />}
              {i === breadcrumb.length - 1 ? (
                <span className="font-medium">{crumb.name}</span>
              ) : (
                <Link
                  href={crumb.id ? `/files/${crumb.id}` : "/files"}
                  className="text-ink-muted hover:text-ink dark:text-ink-dark-muted dark:hover:text-ink-dark"
                >
                  {crumb.name}
                </Link>
              )}
            </span>
          ))}
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold">{folder ? folder.name : "Bestanden"}</h1>
            {!folder && (
              <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">
                Logo&apos;s, huisstijl, foto&apos;s en andere bestanden die je met TDV deelt.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <NewFolderDialog parentId={folderId} />
            <UploadDialog folderId={folderId} />
          </div>
        </div>
      </header>

      {isEmpty ? (
        <EmptyState
          icon={FileStack}
          title={folder ? "Deze map is leeg" : "Nog geen bestanden"}
          description="Maak een submap aan of upload je eerste bestand."
        />
      ) : (
        <div className="space-y-6">
          {subfolders.length > 0 && (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {subfolders.map((sub) => (
                <li key={sub.id} className="group relative">
                  <Link
                    href={`/files/${sub.id}`}
                    className="card flex items-center gap-3 p-4 pr-10 transition-shadow hover:shadow-md"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-canvas dark:bg-canvas-dark">
                      <Folder size={18} strokeWidth={1.75} className="text-ink-muted dark:text-ink-dark-muted" />
                    </div>
                    <span className="min-w-0 flex-1 truncate font-medium">{sub.name}</span>
                  </Link>
                  <DeleteFolderButton folderId={sub.id} folderName={sub.name} parentId={folderId} />
                </li>
              ))}
            </ul>
          )}

          {files.length > 0 && <FileList files={files} folderId={folderId} />}
        </div>
      )}

      {folder && parentCrumb && (
        <Link
          href={parentCrumb.id ? `/files/${parentCrumb.id}` : "/files"}
          className="inline-block text-sm text-ink-muted hover:text-ink dark:text-ink-dark-muted dark:hover:text-ink-dark"
        >
          ← Terug naar &quot;{parentCrumb.name}&quot;
        </Link>
      )}
    </div>
  );
}
