import Link from "next/link";
import { FileStack } from "lucide-react";
import { getFilesForCurrentUser } from "@/lib/data/files";
import { EmptyState } from "@/components/ui/EmptyState";
import { UploadDialog } from "./UploadDialog";
import { FILE_CATEGORIES, FILE_CATEGORY_LABEL, FILE_CATEGORY_ICON, type FileCategory } from "@/lib/file-category";

export default async function FilesPage() {
  const files = await getFilesForCurrentUser();

  const counts = Object.fromEntries(FILE_CATEGORIES.map((c) => [c, 0])) as Record<FileCategory, number>;
  for (const file of files) {
    const category = (file.category as FileCategory) ?? "other";
    counts[category] = (counts[category] ?? 0) + 1;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Bestanden</h1>
          <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">
            Logo&apos;s, huisstijl, foto&apos;s en andere bestanden die je met TDV deelt, per map georganiseerd.
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
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FILE_CATEGORIES.map((category) => {
            const Icon = FILE_CATEGORY_ICON[category];
            const count = counts[category];
            return (
              <li key={category}>
                <Link
                  href={`/files/${category}`}
                  className="card flex items-center gap-4 p-5 transition-shadow hover:shadow-md"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-canvas dark:bg-canvas-dark">
                    <Icon size={20} strokeWidth={1.75} className="text-ink-muted dark:text-ink-dark-muted" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{FILE_CATEGORY_LABEL[category]}</p>
                    <p className="text-xs text-ink-muted dark:text-ink-dark-muted">
                      {count === 0 ? "Leeg" : count === 1 ? "1 bestand" : `${count} bestanden`}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
