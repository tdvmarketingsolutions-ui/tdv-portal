"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Folder } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { cn } from "@/lib/utils";
import type { FolderRecord } from "@/types/domain";
import { moveFileAction } from "./actions";
import { DeleteFolderButton } from "./DeleteFolderButton";
import { FILE_DRAG_MIME } from "./FileList";

export function FolderTile({ folder, currentFolderId }: { folder: FolderRecord; currentFolderId: string | null }) {
  const router = useRouter();
  const { push } = useToast();
  const [dragOver, setDragOver] = useState(false);

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const fileId = e.dataTransfer.getData(FILE_DRAG_MIME);
    if (!fileId) return;

    const result = await moveFileAction(fileId, folder.id, currentFolderId);
    if (result.error) {
      push(result.error, "error");
      return;
    }
    push(`Verplaatst naar "${folder.name}".`);
    router.refresh();
  }

  return (
    <li className="group relative">
      <Link
        href={`/files/${folder.id}`}
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes(FILE_DRAG_MIME)) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "card flex items-center gap-3 p-4 pr-10 transition-shadow hover:shadow-md",
          dragOver && "ring-2 ring-accent"
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-canvas dark:bg-canvas-dark">
          <Folder size={18} strokeWidth={1.75} className="text-ink-muted dark:text-ink-dark-muted" />
        </div>
        <span className="min-w-0 flex-1 truncate font-medium">{folder.name}</span>
      </Link>
      <DeleteFolderButton folderId={folder.id} folderName={folder.name} parentId={currentFolderId} />
    </li>
  );
}
