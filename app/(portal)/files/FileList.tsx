"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { File as FileIcon, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { FILE_CATEGORY_LABEL, type FileCategory } from "@/lib/file-category";
import type { FileRecord } from "@/types/domain";
import { deleteFileAction } from "./actions";

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileList({ files }: { files: FileRecord[] }) {
  const router = useRouter();
  const { push } = useToast();
  const [pendingDelete, setPendingDelete] = useState<FileRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    const result = await deleteFileAction(pendingDelete.id);
    setDeleting(false);

    if (result.error) {
      push(result.error, "error");
      return;
    }
    push(`"${pendingDelete.file_name}" verwijderd.`);
    setPendingDelete(null);
    router.refresh();
  }

  return (
    <>
      <ul className="space-y-2">
        {files.map((file) => (
          <li key={file.id} className="card flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-canvas dark:bg-canvas-dark">
              <FileIcon size={18} strokeWidth={1.75} className="text-ink-muted dark:text-ink-dark-muted" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.file_name}</p>
              <p className="text-xs text-ink-muted dark:text-ink-dark-muted">
                {new Date(file.created_at).toLocaleDateString("nl-BE")}
                {file.size_bytes ? ` · ${formatSize(file.size_bytes)}` : ""}
              </p>
            </div>
            {file.category && (
              <Badge tone="gray">{FILE_CATEGORY_LABEL[file.category as FileCategory] ?? file.category}</Badge>
            )}
            <button
              type="button"
              onClick={() => setPendingDelete(file)}
              aria-label={`${file.file_name} verwijderen`}
              className="shrink-0 rounded-lg p-2 text-ink-muted transition-colors hover:bg-canvas hover:text-status-danger dark:text-ink-dark-muted dark:hover:bg-canvas-dark"
            >
              <Trash2 size={16} strokeWidth={1.75} />
            </button>
          </li>
        ))}
      </ul>

      <Dialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Bestand verwijderen?"
        description={pendingDelete ? `"${pendingDelete.file_name}" wordt definitief verwijderd.` : undefined}
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setPendingDelete(null)}>
            Annuleren
          </Button>
          <Button variant="danger" onClick={confirmDelete} loading={deleting}>
            Verwijderen
          </Button>
        </div>
      </Dialog>
    </>
  );
}
