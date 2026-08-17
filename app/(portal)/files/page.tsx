import { FileStack } from "lucide-react";
import { getFilesForCurrentUser } from "@/lib/data/files";
import { EmptyState } from "@/components/ui/EmptyState";
import { UploadDialog } from "./UploadDialog";
import { FileList } from "./FileList";

export default async function FilesPage() {
  const files = await getFilesForCurrentUser();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Bestanden</h1>
          <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">
            Logo&apos;s, huisstijl, foto&apos;s en andere bestanden die je met TDV deelt.
          </p>
        </div>
        <UploadDialog />
      </header>

      {files.length === 0 ? (
        <EmptyState
          icon={FileStack}
          title="Nog geen bestanden"
          description="Upload je eerste bestand om te delen met TDV."
        />
      ) : (
        <FileList files={files} />
      )}
    </div>
  );
}
