"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, isSameMonth, isSameDay } from "date-fns";
import { nl } from "date-fns/locale";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/ToastProvider";
import { Badge, TONE_CLASS } from "@/components/ui/Badge";
import { CONTENT_STATUS_LABEL, CONTENT_STATUS_TONE, CONTENT_CHANNEL_LABEL } from "@/lib/content-status";
import type { ContentItemWithThumbnail } from "@/lib/data/content";
import type { ContentChannel, ContentStatus } from "@/types/domain";
import { EditContentItemDialog } from "./EditContentItemDialog";
import { NewContentItemDialog } from "@/app/(admin)/admin/content/NewContentItemDialog";
import { DuplicateContentItemButton } from "@/app/(admin)/admin/content/DuplicateContentItemButton";
import { rescheduleContentItemAction } from "./actions";

const WEEKDAYS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
// Sentinel for the "unscheduled" drop zone, distinct from `null` (which
// means "not currently hovering any drop zone") on the dragOverKey state.
const UNSCHEDULED = "__unscheduled__";
const STATUSES = Object.keys(CONTENT_STATUS_LABEL) as ContentStatus[];
const CHANNELS = Object.keys(CONTENT_CHANNEL_LABEL) as ContentChannel[];

export function CalendarGrid({
  items,
  days,
  monthStart,
  canManage,
  companies,
}: {
  items: ContentItemWithThumbnail[];
  days: Date[];
  monthStart: Date;
  canManage: boolean;
  companies: { id: string; name: string }[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ContentStatus | "all">("all");
  const [channelFilter, setChannelFilter] = useState<ContentChannel | "all">("all");

  const counts = useMemo(() => {
    const byStatus = new Map<ContentStatus, number>();
    for (const item of items) byStatus.set(item.status, (byStatus.get(item.status) ?? 0) + 1);
    return byStatus;
  }, [items]);

  const channelCounts = useMemo(() => {
    const byChannel = new Map<ContentChannel, number>();
    for (const item of items) {
      for (const c of item.channels) byChannel.set(c, (byChannel.get(c) ?? 0) + 1);
    }
    return byChannel;
  }, [items]);

  const visibleItems = items
    .filter((i) => statusFilter === "all" || i.status === statusFilter)
    .filter((i) => channelFilter === "all" || i.channels.includes(channelFilter));

  const itemsByDay = new Map<string, ContentItemWithThumbnail[]>();
  for (const item of visibleItems) {
    if (!item.scheduled_for) continue;
    const key = format(new Date(item.scheduled_for), "yyyy-MM-dd");
    itemsByDay.set(key, [...(itemsByDay.get(key) ?? []), item]);
  }
  const unscheduled = visibleItems.filter((i) => !i.scheduled_for);

  // A 7-column grid has no room left for real content on a phone (chip
  // text was truncating to 3-4 characters) — below `sm` this renders an
  // agenda list instead: one section per day-with-items, full titles.
  const agendaDays = days
    .filter((day) => isSameMonth(day, monthStart))
    .map((day) => {
      const key = format(day, "yyyy-MM-dd");
      return { day, key, dayItems: itemsByDay.get(key) ?? [] };
    })
    .filter((d) => d.dayItems.length > 0);

  async function handleDrop(zoneKey: string) {
    const id = draggedId;
    setDraggedId(null);
    setDragOverKey(null);
    if (!id || busy) return;

    const dateKey = zoneKey === UNSCHEDULED ? null : zoneKey;
    const item = items.find((i) => i.id === id);
    const currentKey = item?.scheduled_for ? format(new Date(item.scheduled_for), "yyyy-MM-dd") : null;
    if (currentKey === dateKey) return;

    setBusy(true);
    const result = await rescheduleContentItemAction(id, dateKey);
    setBusy(false);

    if (result.error) {
      push(result.error, "error");
      return;
    }
    router.refresh();
  }

  function dropZoneProps(key: string) {
    if (!canManage) return {};
    return {
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        setDragOverKey(key);
      },
      onDragLeave: () => setDragOverKey((current) => (current === key ? null : current)),
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        void handleDrop(key);
      },
    };
  }

  function Chip({ item }: { item: ContentItemWithThumbnail }) {
    return (
      <div
        draggable={canManage}
        onDragStart={() => setDraggedId(item.id)}
        onDragEnd={() => {
          setDraggedId(null);
          setDragOverKey(null);
        }}
        title={`${CONTENT_STATUS_LABEL[item.status]}${item.companies?.name ? ` — ${item.companies.name}` : ""}`}
        className={cn(
          "flex items-center gap-1.5 truncate rounded-md px-1.5 py-1 text-[11px] hover:opacity-80",
          TONE_CLASS[CONTENT_STATUS_TONE[item.status]],
          canManage ? "cursor-grab active:cursor-grabbing" : "",
          draggedId === item.id ? "opacity-40" : ""
        )}
      >
        {item.visualThumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.visualThumbnailUrl}
            alt=""
            draggable={false}
            className="h-9 w-9 shrink-0 rounded object-cover"
          />
        ) : (
          item.visual_file_id && <ImageIcon size={10} strokeWidth={2} className="shrink-0" />
        )}
        <Link href={`/content-planning/${item.id}`} className="min-w-0 flex-1 truncate">
          {item.title}
        </Link>
        {canManage && (
          <EditContentItemDialog
            contentItemId={item.id}
            title={item.title}
            caption={item.caption}
            channels={item.channels}
            scheduledFor={item.scheduled_for}
            visualFileName={item.visual?.file_name ?? null}
          />
        )}
      </div>
    );
  }

  function AgendaCard({ item }: { item: ContentItemWithThumbnail }) {
    return (
      <li className="card flex items-center gap-3 p-3">
        <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", TONE_CLASS[CONTENT_STATUS_TONE[item.status]])} />
        {item.visualThumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.visualThumbnailUrl}
            alt=""
            draggable={false}
            className="h-14 w-14 shrink-0 rounded-lg object-cover"
          />
        ) : (
          item.visual_file_id && (
            <ImageIcon size={16} strokeWidth={1.75} className="shrink-0 text-ink-muted dark:text-ink-dark-muted" />
          )
        )}
        <Link href={`/content-planning/${item.id}`} className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{item.title}</p>
          <p className="mt-0.5 truncate text-xs text-ink-muted dark:text-ink-dark-muted">
            {item.channels.map((c) => CONTENT_CHANNEL_LABEL[c]).join(", ")} · {CONTENT_STATUS_LABEL[item.status]}
            {item.companies?.name ? ` · ${item.companies.name}` : ""}
          </p>
        </Link>
        {canManage && (
          <div className="flex shrink-0 items-center gap-1">
            <DuplicateContentItemButton contentItemId={item.id} title={item.title} />
            <EditContentItemDialog
              contentItemId={item.id}
              title={item.title}
              caption={item.caption}
              channels={item.channels}
              scheduledFor={item.scheduled_for}
              visualFileName={item.visual?.file_name ?? null}
            />
          </div>
        )}
      </li>
    );
  }

  return (
    <>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            statusFilter === "all"
              ? "border-ink bg-ink text-white dark:border-ink-dark dark:bg-ink-dark dark:text-ink"
              : "border-border text-ink-muted hover:border-ink/30 dark:border-border-dark dark:text-ink-dark-muted"
          )}
        >
          Alles ({items.length})
        </button>
        {STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter((current) => (current === status ? "all" : status))}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-opacity",
              TONE_CLASS[CONTENT_STATUS_TONE[status]],
              statusFilter === status
                ? "ring-2 ring-current ring-offset-1 ring-offset-canvas dark:ring-offset-canvas-dark"
                : "opacity-60 hover:opacity-100"
            )}
          >
            {CONTENT_STATUS_LABEL[status]} ({counts.get(status) ?? 0})
          </button>
        ))}
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <button
          type="button"
          onClick={() => setChannelFilter("all")}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            channelFilter === "all"
              ? "border-ink bg-ink text-white dark:border-ink-dark dark:bg-ink-dark dark:text-ink"
              : "border-border text-ink-muted hover:border-ink/30 dark:border-border-dark dark:text-ink-dark-muted"
          )}
        >
          Alle kanalen
        </button>
        {CHANNELS.filter((c) => (channelCounts.get(c) ?? 0) > 0).map((channel) => (
          <button
            key={channel}
            type="button"
            onClick={() => setChannelFilter((current) => (current === channel ? "all" : channel))}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              channelFilter === channel
                ? "border-ink bg-ink text-white dark:border-ink-dark dark:bg-ink-dark dark:text-ink"
                : "border-border text-ink-muted hover:border-ink/30 dark:border-border-dark dark:text-ink-dark-muted"
            )}
          >
            {CONTENT_CHANNEL_LABEL[channel]} ({channelCounts.get(channel) ?? 0})
          </button>
        ))}
      </div>

      {/* Mobile: agenda list, one section per day that actually has something. */}
      <div className="space-y-4 sm:hidden">
        {agendaDays.length === 0 ? (
          <p className="card p-4 text-center text-sm text-ink-muted dark:text-ink-dark-muted">
            Niets gepland deze maand{statusFilter !== "all" || channelFilter !== "all" ? " voor dit filter" : ""}.
          </p>
        ) : (
          agendaDays.map(({ day, key, dayItems }) => (
            <div key={key}>
              <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs",
                    isSameDay(day, new Date())
                      ? "bg-accent font-semibold text-white dark:bg-accent-dark"
                      : "bg-canvas text-ink-muted dark:bg-canvas-dark dark:text-ink-dark-muted"
                  )}
                >
                  {format(day, "d")}
                </span>
                <span className="capitalize">{format(day, "EEEE d MMMM", { locale: nl })}</span>
              </p>
              <ul className="space-y-2">
                {dayItems.map((item) => (
                  <AgendaCard key={item.id} item={item} />
                ))}
              </ul>
            </div>
          ))
        )}
      </div>

      {/* Tablet/desktop: full month grid. */}
      <div className="hidden grid-cols-7 gap-px overflow-hidden rounded-2xl border border-border bg-border text-xs dark:border-border-dark dark:bg-border-dark sm:grid">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-surface p-2 text-center font-medium text-ink-muted dark:bg-surface-dark dark:text-ink-dark-muted">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayItems = itemsByDay.get(key) ?? [];
          return (
            <div
              key={key}
              {...dropZoneProps(key)}
              className={`min-h-[116px] bg-surface p-1.5 dark:bg-surface-dark ${!isSameMonth(day, monthStart) ? "opacity-40" : ""} ${
                dragOverKey === key ? "bg-accent-soft dark:bg-accent/10" : ""
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                {canManage ? (
                  <NewContentItemDialog companies={companies} defaultScheduledFor={`${key}T09:00`} compact />
                ) : (
                  <span />
                )}
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                    isSameDay(day, new Date())
                      ? "bg-accent font-semibold text-white dark:bg-accent-dark"
                      : "text-ink-muted dark:text-ink-dark-muted"
                  }`}
                >
                  {format(day, "d")}
                </span>
              </div>
              <div className="space-y-1">
                {dayItems.map((item) => (
                  <Chip key={item.id} item={item} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {(unscheduled.length > 0 || (canManage && draggedId)) && (
        <section
          {...dropZoneProps(UNSCHEDULED)}
          className={`card p-6 ${dragOverKey === UNSCHEDULED ? "bg-accent-soft dark:bg-accent/10" : ""}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-base font-medium">Nog niet ingepland</h2>
            {canManage && (
              <p className="hidden text-xs text-ink-muted dark:text-ink-dark-muted sm:block">
                Sleep hierheen om te ontplannen
              </p>
            )}
          </div>
          {unscheduled.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted dark:text-ink-dark-muted">Geen items.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {unscheduled.map((item) => (
                <li
                  key={item.id}
                  draggable={canManage}
                  onDragStart={() => setDraggedId(item.id)}
                  onDragEnd={() => {
                    setDraggedId(null);
                    setDragOverKey(null);
                  }}
                  className={`flex flex-col gap-2 rounded-xl px-3 py-2 text-sm hover:bg-canvas dark:hover:bg-canvas-dark sm:flex-row sm:items-center sm:justify-between ${
                    canManage ? "cursor-grab active:cursor-grabbing" : ""
                  } ${draggedId === item.id ? "opacity-40" : ""}`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {item.visualThumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.visualThumbnailUrl}
                        alt=""
                        draggable={false}
                        className="h-11 w-11 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      item.visual_file_id && (
                        <ImageIcon size={14} strokeWidth={1.75} className="shrink-0 text-ink-muted dark:text-ink-dark-muted" />
                      )
                    )}
                    <Link href={`/content-planning/${item.id}`} className="min-w-0 flex-1 truncate">
                      {item.title}
                    </Link>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {item.channels.map((c) => (
                      <Badge key={c} tone="gray">
                        {CONTENT_CHANNEL_LABEL[c]}
                      </Badge>
                    ))}
                    <Badge tone={CONTENT_STATUS_TONE[item.status]}>{CONTENT_STATUS_LABEL[item.status]}</Badge>
                    {canManage && (
                      <>
                        <DuplicateContentItemButton contentItemId={item.id} title={item.title} />
                        <EditContentItemDialog
                          contentItemId={item.id}
                          title={item.title}
                          caption={item.caption}
                          channels={item.channels}
                          scheduledFor={item.scheduled_for}
                          visualFileName={item.visual?.file_name ?? null}
                        />
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
