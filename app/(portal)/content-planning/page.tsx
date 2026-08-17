import Link from "next/link";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, addMonths } from "date-fns";
import { nl } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays, ImageIcon } from "lucide-react";
import { getContentItemsForCurrentUser } from "@/lib/data/content";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CONTENT_STATUS_TONE, CONTENT_CHANNEL_LABEL } from "@/lib/content-status";
import type { ContentItem } from "@/types/domain";

const WEEKDAYS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

export default async function ContentPlanningPage({ searchParams }: { searchParams: { month?: string } }) {
  const items = await getContentItemsForCurrentUser();

  const referenceDate = searchParams.month ? new Date(`${searchParams.month}-01T00:00:00`) : new Date();
  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const prevMonth = format(addMonths(monthStart, -1), "yyyy-MM");
  const nextMonth = format(addMonths(monthStart, 1), "yyyy-MM");

  const itemsByDay = new Map<string, ContentItem[]>();
  for (const item of items) {
    if (!item.scheduled_for) continue;
    const key = format(new Date(item.scheduled_for), "yyyy-MM-dd");
    itemsByDay.set(key, [...(itemsByDay.get(key) ?? []), item]);
  }
  const unscheduled = items.filter((i) => !i.scheduled_for);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Contentplanning</h1>
          <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">
            Bekijk en keur geplande content goed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/content-planning?month=${prevMonth}`} className="btn-secondary px-2.5" aria-label="Vorige maand">
            <ChevronLeft size={16} strokeWidth={1.75} />
          </Link>
          <span className="w-32 text-center text-sm font-medium capitalize">
            {format(monthStart, "MMMM yyyy", { locale: nl })}
          </span>
          <Link href={`/content-planning?month=${nextMonth}`} className="btn-secondary px-2.5" aria-label="Volgende maand">
            <ChevronRight size={16} strokeWidth={1.75} />
          </Link>
        </div>
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nog geen content gepland"
          description="Zodra TDV content inplant, verschijnt die hier."
        />
      ) : (
        <>
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
                  className={`min-h-[92px] bg-surface p-1.5 dark:bg-surface-dark ${!isSameMonth(day, monthStart) ? "opacity-40" : ""}`}
                >
                  <p
                    className={`mb-1 text-right text-[11px] ${
                      isSameDay(day, new Date()) ? "font-semibold text-accent dark:text-accent-dark" : "text-ink-muted dark:text-ink-dark-muted"
                    }`}
                  >
                    {format(day, "d")}
                  </p>
                  <div className="space-y-1">
                    {dayItems.map((item) => (
                      <Link
                        key={item.id}
                        href={`/content-planning/${item.id}`}
                        className="flex items-center gap-1 truncate rounded-md bg-accent-soft px-1.5 py-0.5 text-[11px] text-accent hover:bg-accent/20 dark:bg-accent/15 dark:text-accent-dark"
                      >
                        {item.visual_file_id && <ImageIcon size={10} strokeWidth={2} className="shrink-0" />}
                        <span className="truncate">{item.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {unscheduled.length > 0 && (
            <section className="card p-6">
              <h2 className="font-display text-base font-medium">Nog niet ingepland</h2>
              <ul className="mt-3 space-y-2">
                {unscheduled.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/content-planning/${item.id}`}
                      className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-canvas dark:hover:bg-canvas-dark"
                    >
                      <span>{item.title}</span>
                      <Badge tone={CONTENT_STATUS_TONE[item.status]}>{CONTENT_CHANNEL_LABEL[item.channel]}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
