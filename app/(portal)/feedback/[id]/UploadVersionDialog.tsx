"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { uploadDeliverableVersionAction } from "./actions";

export function UploadVersionDialog({ deliverableId }: { deliverableId: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setFile(null);
    setError(null);
    setDragOver(false);
  }

  async function handleUpload() {
    if (!file) {
      setError("Kies eerst een bestand.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set("file", file);

    const result = await uploadDeliverableVersionAction(deliverableId, formData);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    push("Nieuwe versie geüpload — de klant is op de hoogte gebracht.");
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        <Upload size={14} strokeWidth={1.75} />
        Nieuwe versie uploaden
      </Button>

      <Dialog open={open} onClose={() => { setOpen(false); reset(); }} title="Nieuwe versie uploaden">
        <div className="space-y-4">
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
                <p className="text-sm font-medium">Sleep een bestand hierheen</p>
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
            <Button onClick={handleUpload} loading={submitting}>
              Uploaden
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
