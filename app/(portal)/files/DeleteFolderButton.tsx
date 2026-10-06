"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { deleteFolderAction } from "./actions";

export function DeleteFolderButton({
  folderId,
  folderName,
  parentId,
}: {
  folderId: string;
  folderName: string;
  parentId: string | null;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    setDeleting(true);
    const result = await deleteFolderAction(folderId, parentId);
    setDeleting(false);

    if (result.error) {
      push(result.error, "error");
      return;
    }
    push(`Map "${folderName}" verwijderd.`);
    setConfirming(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); setConfirming(true); }}
        aria-label={`Map "${folderName}" verwijderen`}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-muted opacity-0 transition-opacity hover:bg-canvas hover:text-status-danger group-hover:opacity-100 dark:text-ink-dark-muted dark:hover:bg-canvas-dark"
      >
        <Trash2 size={15} strokeWidth={1.75} />
      </button>

      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Map verwijderen?"
        description={`"${folderName}" en alle submappen erin worden verwijderd. Bestanden erin blijven bestaan en verschijnen terug bovenaan.`}
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirming(false)}>
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
