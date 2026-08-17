"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, isSameMonth, isSameDay } from "date-fns";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/ToastProvider";
import { Badge, TONE_CLASS } from "@/components/ui/Badge";
import { CONTENT_STATUS_LABEL, CONTENT_STATUS_TONE, CONTENT_CHANNEL_LABEL } from "@/lib/content-status";
import type { ContentItemWithCompany } from "@/lib/data/content";
import type { ContentStatus } from "@/types/domain";
import { EditContentItemDialog } from "./EditContentItemDialog";
import { rescheduleContentItemAction } from "./actions";

const WEEKDAYS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
// Sentinel for the "unscheduled" drop zone, distinct from `null` (which
// means "not currently hovering any drop zone") on the dragOverKey state.
const UNSCHEDULED = "__unscheduled__";
const STATUSES = Object.keys(CONTENT_STATUS_LABEL) as ContentStatus[];

export function CalendarGrid({
  items,
  days,
  monthStart,
  isStaff,
}: {
  items: ContentItemWithCompany[];
  days: Date[];
  monthStart: Date;
  isStaff: boolean;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ContentStatus | "all">("all");

  const counts = useMemo(() => {
    const byStatus = new Map<ContentStatus, number>();
    for (const item of items) byStatus.set(item.status, (byStatus.get(item.status) ?? 0) + 1);
    return byStatus;
  }, [items]);

  const visibleItems = statusFilter === "all" ? items : items.filter((i) => i.status === statusFilter);

  const itemsByDay = new Map<string, ContentItemWithCompany[]>();
  for (const item of visibleItems) {
    if (!item.scheduled_for) continue;
    const key = format(new Date(item.scheduled_for), "yyyy-MM-dd");
    itemsByDay.set(key, [...(itemsByDay.get(key) ?? []), item]);
  }
  const unscheduled = visibleItems.filter((i) => !i.scheduled_for);

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
    if (!isStaff) return {};
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

  function Chip({ item }: { item: ContentItemWithCompany }) {
    return (
      <div
        draggable={isStaff}
        onDragStart={() => setDraggedId(item.id)}
        onDragEnd={() => {
          setDraggedId(null);
          setDragOverKey(null);
        }}
        title={`${CONTENT_STATUS_LABEL[item.status]}${item.companies?.name ? ` — ${item.companies.name}` : ""}`}
        className={cn(
          "flex items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[11px] hover:opacity-80",
          TONE_CLASS[CONTENT_STATUS_TONE[item.status]],
          isStaff ? "cursor-grab active:cursor-grabbing" : "",
          draggedId === item.id ? "opacity-40" : ""
        )}
      >
        {item.visual_file_id && <ImageIcon size={10} strokeWidth={2} className="shrink-0" />}
        <Link href={`/content-planning/${item.id}`} className="min-w-0 flex-1 truncate">
          {item.title}
        </Link>
        {isStaff && (
          <EditContentItemDialog
            contentItemId={item.id}
            title={item.title}
            caption={item.caption}
            channel={item.channel}
            scheduledFor={item.scheduled_for}
            visualFileName={item.visual?.file_name ?? null}
          />
        )}
      </div>
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

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-border bg-border text-xs dark:border-border-dark dark:bg-border-dark">
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
              className={`min-h-[92px] bg-surface p-1.5 dark:bg-surface-dark ${!isSameMonth(day, monthStart) ? "opacity-40" : ""} ${
                dragOverKey === key ? "bg-accent-soft dark:bg-accent/10" : ""
              }`}
            >
              <div className="mb-1 flex justify-end">
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

      {(unscheduled.length > 0 || (isStaff && draggedId)) && (
        <section
          {...dropZoneProps(UNSCHEDULED)}
          className={`card p-6 ${dragOverKey === UNSCHEDULED ? "bg-accent-soft dark:bg-accent/10" : ""}`}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-medium">Nog niet ingepland</h2>
            {isStaff && <p className="text-xs text-ink-muted dark:text-ink-dark-muted">Sleep hierheen om te ontplannen</p>}
          </div>
          {unscheduled.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted dark:text-ink-dark-muted">Geen items.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {unscheduled.map((item) => (
                <li
                  key={item.id}
                  draggable={isStaff}
                  onDragStart={() => setDraggedId(item.id)}
                  onDragEnd={() => {
                    setDraggedId(null);
                    setDragOverKey(null);
                  }}
                  className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm hover:bg-canvas dark:hover:bg-canvas-dark ${
                    isStaff ? "cursor-grab active:cursor-grabbing" : ""
                  } ${draggedId === item.id ? "opacity-40" : ""}`}
                >
                  <Link href={`/content-planning/${item.id}`} className="min-w-0 flex-1 truncate">
                    {item.title}
                  </Link>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone="gray">{CONTENT_CHANNEL_LABEL[item.channel]}</Badge>
                    <Badge tone={CONTENT_STATUS_TONE[item.status]}>{CONTENT_STATUS_LABEL[item.status]}</Badge>
                    {isStaff && (
                      <EditContentItemDialog
                        contentItemId={item.id}
                        title={item.title}
                        caption={item.caption}
                        channel={item.channel}
                        scheduledFor={item.scheduled_for}
                        visualFileName={item.visual?.file_name ?? null}
                      />
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
