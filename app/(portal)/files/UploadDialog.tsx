"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { FILE_CATEGORIES, FILE_CATEGORY_LABEL, type FileCategory } from "@/lib/file-category";
import { uploadFileAction } from "./actions";

export function UploadDialog() {
  const router = useRouter();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<FileCategory>("other");
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setFile(null);
    setCategory("other");
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
    formData.set("category", category);

    const result = await uploadFileAction(formData);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    push(`"${file.name}" geüpload.`);
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Upload size={16} strokeWidth={1.75} />
        Bestand uploaden
      </Button>

      <Dialog open={open} onClose={() => { setOpen(false); reset(); }} title="Bestand uploaden">
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

          <Select
            label="Categorie"
            value={category}
            onChange={(e) => setCategory(e.target.value as FileCategory)}
          >
            {FILE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {FILE_CATEGORY_LABEL[c]}
              </option>
            ))}
          </Select>

          {error && (
            <p role="alert" className="text-sm text-status-danger">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setOpen(false); reset(); }}>
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
