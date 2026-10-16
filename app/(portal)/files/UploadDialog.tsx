"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { FILE_CATEGORIES, FILE_CATEGORY_LABEL, type FileCategory } from "@/lib/file-category";
import { uploadFileAction } from "./actions";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

export function UploadDialog({ folderId = null }: { folderId?: string | null } = {}) {
  const router = useRouter();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState<FileCategory>("other");
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setFiles([]);
    setCategory("other");
    setError(null);
    setDragOver(false);
  }

  function addFiles(incoming: File[]) {
    // Re-selecting/dropping the same name twice (easy to do while building up
    // a batch) would otherwise silently upload it twice as two files.
    setFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      return [...prev, ...incoming.filter((f) => !existingNames.has(f.name))];
    });
  }

  function removeFile(name: string) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  async function handleUpload() {
    if (files.length === 0) {
      setError("Kies eerst een bestand.");
      return;
    }
    const tooLarge = files.find((f) => f.size > MAX_FILE_SIZE);
    if (tooLarge) {
      setError(`"${tooLarge.name}" is te groot (max 25 MB).`);
      return;
    }

    setSubmitting(true);
    setError(null);

    // Sequential rather than Promise.all: each call already does its own
    // storage upload + DB insert, and keeping them one-at-a-time avoids
    // hammering Storage with a burst of concurrent requests for what's
    // often a batch of same-folder photos/assets.
    const failed: string[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("category", category);
      if (folderId) formData.set("folderId", folderId);

      const result = await uploadFileAction(formData);
      if (result.error) failed.push(`${file.name}: ${result.error}`);
    }

    setSubmitting(false);

    if (failed.length > 0) {
      setError(
        failed.length === files.length
          ? "Geen van de bestanden kon geüpload worden."
          : `${files.length - failed.length} van ${files.length} bestanden geüpload. Mislukt: ${failed.join("; ")}`
      );
      if (failed.length < files.length) router.refresh();
      return;
    }

    push(files.length === 1 ? `"${files[0]!.name}" geüpload.` : `${files.length} bestanden geüpload.`);
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

      <Dialog open={open} onClose={() => { setOpen(false); reset(); }} title="Bestand(en) uploaden">
        <div className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              addFiles(Array.from(e.dataTransfer.files));
            }}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
              dragOver ? "border-accent bg-accent-soft dark:bg-accent/10" : "border-border dark:border-border-dark"
            }`}
          >
            <Upload size={22} strokeWidth={1.75} className="text-ink-muted dark:text-ink-dark-muted" />
            <p className="text-sm font-medium">Sleep bestanden hierheen</p>
            <p className="text-xs text-ink-muted dark:text-ink-dark-muted">
              of klik om te bladeren — meerdere tegelijk mag (max 25 MB per bestand)
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
            />
          </div>

          {files.length > 0 && (
            <ul className="max-h-40 space-y-1 overflow-y-auto">
              {files.map((f) => (
                <li
                  key={f.name}
                  className="flex items-center justify-between gap-2 rounded-lg bg-canvas px-3 py-1.5 text-sm dark:bg-canvas-dark"
                >
                  <span className="min-w-0 flex-1 truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(f.name)}
                    aria-label={`${f.name} verwijderen uit selectie`}
                    className="shrink-0 rounded p-0.5 text-ink-muted transition-colors hover:text-ink dark:text-ink-dark-muted dark:hover:text-ink-dark"
                  >
                    <X size={14} strokeWidth={1.75} />
                  </button>
                </li>
              ))}
            </ul>
          )}

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
            <p role="alert" className="text-sm text-status-danger dark:text-status-danger-dark">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setOpen(false); reset(); }}>
              Annuleren
            </Button>
            <Button onClick={handleUpload} loading={submitting}>
              {files.length > 1 ? `${files.length} bestanden uploaden` : "Uploaden"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
