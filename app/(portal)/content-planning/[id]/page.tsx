import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, FileText } from "lucide-react";
import { getContentItemById } from "@/lib/data/content";
import { getFileDownloadUrl } from "@/lib/data/files";
import { Badge } from "@/components/ui/Badge";
import { CONTENT_STATUS_LABEL, CONTENT_STATUS_TONE, CONTENT_CHANNEL_LABEL } from "@/lib/content-status";
import { CommentForm } from "./CommentForm";
import { StatusActions } from "./StatusActions";

export default async function ContentItemDetailPage({ params }: { params: { id: string } }) {
  const item = await getContentItemById(params.id);
  if (!item) notFound();

  const visualUrl = item.visual ? await getFileDownloadUrl(item.visual.storage_path) : null;
  const isImage = item.visual?.mime_type?.startsWith("image/") ?? false;
  const isVideo = item.visual?.mime_type?.startsWith("video/") ?? false;

  const comments = [...(item.content_item_comments ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/content-planning"
        className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink dark:text-ink-dark-muted dark:hover:text-ink-dark"
      >
        <ChevronLeft size={16} strokeWidth={1.75} />
        Terug naar contentplanning
      </Link>

      <header className="space-y-2">
        <h1 className="font-display text-2xl font-semibold">{item.title}</h1>
        <div className="flex flex-wrap gap-2">
          <Badge tone={CONTENT_STATUS_TONE[item.status]}>{CONTENT_STATUS_LABEL[item.status]}</Badge>
          {item.channels.map((c) => (
            <Badge key={c} tone="gray">
              {CONTENT_CHANNEL_LABEL[c]}
            </Badge>
          ))}
        </div>
        {item.scheduled_for && (
          <p className="text-sm text-ink-muted dark:text-ink-dark-muted">
            Gepland voor {new Date(item.scheduled_for).toLocaleDateString("nl-BE")}
          </p>
        )}
      </header>

      {item.visual && visualUrl && (
        <section className="card overflow-hidden p-0">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={visualUrl} alt={item.visual.file_name} className="block max-h-[480px] w-full object-contain" />
          ) : isVideo ? (
            <video src={visualUrl} controls className="block max-h-[480px] w-full">
              <track kind="captions" />
            </video>
          ) : (
            <a
              href={visualUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-4 text-sm hover:bg-canvas dark:hover:bg-canvas-dark"
            >
              <FileText size={18} strokeWidth={1.75} className="shrink-0 text-ink-muted dark:text-ink-dark-muted" />
              <span className="min-w-0 flex-1 truncate">{item.visual.file_name}</span>
            </a>
          )}
        </section>
      )}

      {item.caption && (
        <section className="card p-6">
          <h2 className="mb-2 font-display text-base font-medium">Tekst</h2>
          <p className="whitespace-pre-wrap text-sm">{item.caption}</p>
        </section>
      )}

      {item.status === "pending_approval" && (
        <section className="card p-6">
          <h2 className="mb-3 font-display text-base font-medium">Actie vereist</h2>
          <p className="mb-4 text-sm text-ink-muted dark:text-ink-dark-muted">
            Keur deze content goed, of vraag een revisie aan met een opmerking hieronder.
          </p>
          <StatusActions contentItemId={item.id} />
        </section>
      )}

      <section className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="card p-4">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-sm font-medium">{comment.profiles?.full_name ?? "Onbekend"}</p>
              <p className="text-xs text-ink-muted dark:text-ink-dark-muted">
                {new Date(comment.created_at).toLocaleString("nl-BE")}
              </p>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm">{comment.body}</p>
          </div>
        ))}
      </section>

      <section className="card p-6">
        <h2 className="mb-3 font-display text-base font-medium">Reageren</h2>
        <CommentForm contentItemId={item.id} />
      </section>
    </div>
  );
}
