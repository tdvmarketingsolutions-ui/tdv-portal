import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, FileText } from "lucide-react";
import { getDeliverableById, getSignedFileUrl } from "@/lib/data/deliverables";
import { Badge } from "@/components/ui/Badge";
import { FEEDBACK_STATUS_LABEL, FEEDBACK_STATUS_TONE } from "@/lib/feedback-status";
import { VersionPreview } from "./VersionPreview";
import { FeedbackStatusActions } from "./FeedbackStatusActions";
import { CommentForm } from "./CommentForm";
import { cn } from "@/lib/utils";

export default async function DeliverableDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { version?: string };
}) {
  const deliverable = await getDeliverableById(params.id);
  if (!deliverable) notFound();

  const versions = [...deliverable.deliverable_versions].sort((a, b) => b.version_number - a.version_number);
  const requestedVersion = searchParams.version ? Number(searchParams.version) : undefined;
  const version = versions.find((v) => v.version_number === requestedVersion) ?? versions[0];

  if (!version) notFound();

  const isImage = version.files?.mime_type?.startsWith("image/") ?? false;
  const signedUrl = version.files ? await getSignedFileUrl(version.files.storage_path) : null;

  const allComments = [...version.deliverable_comments].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const pinComments = allComments.filter((c) => c.anchor_x != null && c.anchor_y != null);
  const generalComments = allComments.filter((c) => c.anchor_x == null || c.anchor_y == null);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/feedback" className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink dark:text-ink-dark-muted dark:hover:text-ink-dark">
        <ChevronLeft size={16} strokeWidth={1.75} />
        Terug naar feedback
      </Link>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-semibold">{deliverable.title}</h1>
          <Badge tone={FEEDBACK_STATUS_TONE[version.status]}>{FEEDBACK_STATUS_LABEL[version.status]}</Badge>
        </div>
        {deliverable.projects?.name && (
          <p className="text-sm text-ink-muted dark:text-ink-dark-muted">{deliverable.projects.name}</p>
        )}
      </header>

      {versions.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {versions.map((v) => (
            <Link
              key={v.id}
              href={`/feedback/${deliverable.id}?version=${v.version_number}`}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                v.id === version.id
                  ? "bg-accent text-white"
                  : "bg-canvas text-ink-muted hover:text-ink dark:bg-canvas-dark dark:text-ink-dark-muted dark:hover:text-ink-dark"
              )}
            >
              Versie {v.version_number}
            </Link>
          ))}
        </div>
      )}

      <section>
        {signedUrl && isImage ? (
          <VersionPreview
            imageUrl={signedUrl}
            fileName={version.files?.file_name ?? deliverable.title}
            deliverableId={deliverable.id}
            versionId={version.id}
            pins={pinComments.map((c) => ({ id: c.id, anchorX: c.anchor_x!, anchorY: c.anchor_y!, body: c.body }))}
          />
        ) : signedUrl ? (
          <a
            href={signedUrl}
            target="_blank"
            rel="noreferrer"
            className="card flex items-center gap-3 p-5 hover:shadow-md"
          >
            <FileText size={20} strokeWidth={1.75} className="shrink-0 text-ink-muted dark:text-ink-dark-muted" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{version.files?.file_name ?? "Bestand bekijken"}</span>
          </a>
        ) : (
          <p className="card p-5 text-sm text-ink-muted dark:text-ink-dark-muted">Geen bestand gekoppeld aan deze versie.</p>
        )}
      </section>

      {version.status === "pending" && (
        <section className="card p-6">
          <h2 className="mb-3 font-display text-base font-medium">Actie vereist</h2>
          <p className="mb-4 text-sm text-ink-muted dark:text-ink-dark-muted">
            Keur deze versie goed, of vraag een revisie aan met een opmerking.
          </p>
          <FeedbackStatusActions deliverableId={deliverable.id} versionId={version.id} />
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-base font-medium">Opmerkingen</h2>
        {allComments.length === 0 ? (
          <p className="text-sm text-ink-muted dark:text-ink-dark-muted">Nog geen opmerkingen op deze versie.</p>
        ) : (
          generalComments.map((comment) => (
            <div key={comment.id} className="card p-4">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-sm font-medium">{comment.profiles?.full_name ?? "Onbekend"}</p>
                <p className="text-xs text-ink-muted dark:text-ink-dark-muted">
                  {new Date(comment.created_at).toLocaleString("nl-BE")}
                </p>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{comment.body}</p>
            </div>
          ))
        )}
        {pinComments.length > 0 && (
          <div className="space-y-2">
            {pinComments.map((comment, i) => (
              <div key={comment.id} className="card flex gap-3 p-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-white">
                  {i + 1}
                </span>
                <div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-sm font-medium">{comment.profiles?.full_name ?? "Onbekend"}</p>
                    <p className="text-xs text-ink-muted dark:text-ink-dark-muted">
                      {new Date(comment.created_at).toLocaleString("nl-BE")}
                    </p>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{comment.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card p-6">
        <CommentForm deliverableId={deliverable.id} versionId={version.id} />
      </section>
    </div>
  );
}
