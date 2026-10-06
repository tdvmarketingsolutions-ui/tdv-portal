import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getFilesForCurrentUser } from "@/lib/data/files";
import { EmptyState } from "@/components/ui/EmptyState";
import { FILE_CATEGORIES, FILE_CATEGORY_LABEL, FILE_CATEGORY_ICON, type FileCategory } from "@/lib/file-category";
import { UploadDialog } from "../UploadDialog";
import { FileList } from "../FileList";

export default async function FilesFolderPage({ params }: { params: { category: string } }) {
  if (!FILE_CATEGORIES.includes(params.category as FileCategory)) notFound();
  const category = params.category as FileCategory;
  const Icon = FILE_CATEGORY_ICON[category];

  const allFiles = await getFilesForCurrentUser();
  const files = allFiles.filter((file) => ((file.category as FileCategory) ?? "other") === category);

  return (
    <div className="space-y-6">
      <Link
        href="/files"
        className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink dark:text-ink-dark-muted dark:hover:text-ink-dark"
      >
        <ChevronLeft size={16} strokeWidth={1.75} />
        Terug naar bestanden
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-canvas dark:bg-canvas-dark">
            <Icon size={18} strokeWidth={1.75} className="text-ink-muted dark:text-ink-dark-muted" />
          </div>
          <h1 className="font-display text-2xl font-semibold">{FILE_CATEGORY_LABEL[category]}</h1>
        </div>
        <UploadDialog defaultCategory={category} />
      </header>

      {files.length === 0 ? (
        <EmptyState
          icon={Icon}
          title="Nog geen bestanden in deze map"
          description="Upload een bestand om het hier te laten verschijnen."
        />
      ) : (
        <FileList files={files} />
      )}
    </div>
  );
}
