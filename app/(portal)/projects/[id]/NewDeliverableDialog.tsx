"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Upload } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { createDeliverableAction } from "./actions";

export function NewDeliverableDialog({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setTitle("");
    setFile(null);
    setError(null);
    setDragOver(false);
  }

  async function handleCreate() {
    if (!title.trim()) {
      setError("Vul een titel in.");
      return;
    }
    if (!file) {
      setError("Kies een bestand.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set("title", title);
    formData.set("file", file);

    const result = await createDeliverableAction(projectId, formData);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    push(`"${title}" aangemaakt en klaar voor feedback.`);
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Nieuwe deliverable"
        className="rounded-lg p-1 text-ink-muted transition-colors hover:bg-canvas hover:text-ink dark:text-ink-dark-muted dark:hover:bg-canvas-dark dark:hover:text-ink-dark"
      >
        <Plus size={16} strokeWidth={1.75} />
      </button>

      <Dialog open={open} onClose={() => { setOpen(false); reset(); }} title="Nieuwe deliverable">
        <div className="space-y-4">
          <Input
            label="Titel"
            placeholder="Bv. Homepage ontwerp"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const dropped = e.dataTransfer.files[0];
              if (dropped) setFile(dropped);
            }}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
              dragOver ? "border-accent bg-accent-soft dark:bg-accent/10" : "border-border dark:border-border-dark"
            }`}
          >
            <Upload size={22} strokeWidth={1.75} className="text-ink-muted dark:text-ink-dark-muted" />
            {file ? (
              <p className="text-sm font-medium">{file.name}</p>
            ) : (
              <>
                <p className="text-sm font-medium">Sleep de eerste versie hierheen</p>
                <p className="text-xs text-ink-muted dark:text-ink-dark-muted">of klik om te bladeren (max 25 MB)</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-status-danger">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => { setOpen(false); reset(); }}>
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
