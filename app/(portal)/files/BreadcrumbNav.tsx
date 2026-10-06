"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { cn } from "@/lib/utils";
import { moveFileAction } from "./actions";
import { FILE_DRAG_MIME } from "./FileList";
import type { BreadcrumbEntry } from "@/lib/data/folders";

export function BreadcrumbNav({ breadcrumb, currentFolderId }: { breadcrumb: BreadcrumbEntry[]; currentFolderId: string | null }) {
  return (
    <nav aria-label="Broodkruimelpad" className="flex flex-wrap items-center gap-1 text-sm">
      {breadcrumb.map((crumb, i) => {
        const isCurrent = i === breadcrumb.length - 1;
        return (
          <span key={crumb.id ?? "root"} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={14} strokeWidth={1.75} className="text-ink-muted dark:text-ink-dark-muted" />}
            {isCurrent ? (
              <span className="font-medium">{crumb.name}</span>
            ) : (
              <Crumb crumb={crumb} currentFolderId={currentFolderId} />
            )}
          </span>
        );
      })}
    </nav>
  );
}

function Crumb({ crumb, currentFolderId }: { crumb: BreadcrumbEntry; currentFolderId: string | null }) {
  const router = useRouter();
  const { push } = useToast();
  const [dragOver, setDragOver] = useState(false);

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const fileId = e.dataTransfer.getData(FILE_DRAG_MIME);
    if (!fileId) return;

    const result = await moveFileAction(fileId, crumb.id, currentFolderId);
    if (result.error) {
      push(result.error, "error");
      return;
    }
    push(`Verplaatst naar "${crumb.name}".`);
    router.refresh();
  }

  return (
    <Link
      href={crumb.id ? `/files/${crumb.id}` : "/files"}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes(FILE_DRAG_MIME)) return;
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={cn(
        "rounded px-1 text-ink-muted hover:text-ink dark:text-ink-dark-muted dark:hover:text-ink-dark",
        dragOver && "bg-accent-soft text-accent dark:bg-accent/15 dark:text-accent-dark"
      )}
    >
      {crumb.name}
    </Link>
  );
}
