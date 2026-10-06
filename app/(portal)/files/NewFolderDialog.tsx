"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { createFolderAction } from "./actions";

export function NewFolderDialog({ parentId }: { parentId: string | null }) {
  const router = useRouter();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setSubmitting(true);
    setError(null);
    const result = await createFolderAction(parentId, name);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    push(`Map "${name.trim()}" aangemaakt.`);
    setOpen(false);
    setName("");
    router.refresh();
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <FolderPlus size={16} strokeWidth={1.75} />
        Nieuwe map
      </Button>

      <Dialog open={open} onClose={() => { setOpen(false); setName(""); setError(null); }} title="Nieuwe map">
        <div className="space-y-4">
          <Input
            label="Naam"
            placeholder="Bv. Contracten 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={error ?? undefined}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setOpen(false); setName(""); setError(null); }}>
              Annuleren
            </Button>
            <Button onClick={handleCreate} loading={submitting}>
              Aanmaken
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
