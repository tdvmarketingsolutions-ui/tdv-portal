"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { deleteContentItemAction } from "./actions";

export function DeleteContentItemButton({ contentItemId, title }: { contentItemId: string; title: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    setDeleting(true);
    const result = await deleteContentItemAction(contentItemId);
    setDeleting(false);

    if (result.error) {
      push(result.error, "error");
      return;
    }
    push(`"${title}" verwijderd.`);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${title} verwijderen`}
        className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-canvas hover:text-status-danger dark:text-ink-dark-muted dark:hover:bg-canvas-dark"
      >
        <Trash2 size={15} strokeWidth={1.75} />
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Content-item verwijderen?"
        description={`"${title}" wordt definitief verwijderd.`}
      >
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            Annuleren
          </Button>
          <Button type="button" variant="danger" onClick={confirmDelete} loading={deleting}>
            Verwijderen
          </Button>
        </div>
      </Dialog>
    </>
  );
}
