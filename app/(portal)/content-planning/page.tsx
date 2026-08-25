import Link from "next/link";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, addMonths } from "date-fns";
import { nl } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getContentItemsForCurrentUser, withVisualThumbnails } from "@/lib/data/content";
import { getAllCompaniesForSelect } from "@/lib/data/admin/projects";
import { getStaffViewCompanyId } from "@/lib/staff-view";
import { EmptyState } from "@/components/ui/EmptyState";
import { CalendarGrid } from "./CalendarGrid";
import { NewContentItemDialog } from "./NewContentItemDialog";
import { NewContentItemDialog as StaffNewContentItemDialog } from "@/app/(admin)/admin/content/NewContentItemDialog";

export default async function ContentPlanningPage({ searchParams }: { searchParams: { month?: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };
  const isStaff = profile?.role === "tdv_admin" || profile?.role === "tdv_staff";
  // While staff previews "as a client" (sidebar switcher), the calendar should
  // behave exactly like the client would see it — no edit/duplicate/drag/quick-add
  // affordances — so staff can actually verify the client experience instead of
  // just narrowing which company's data shows.
  const canManage = isStaff && !getStaffViewCompanyId();

  const [rawItems, companies] = await Promise.all([
    getContentItemsForCurrentUser(),
    canManage ? getAllCompaniesForSelect() : Promise.resolve([]),
  ]);
  const items = await withVisualThumbnails(rawItems);

  const referenceDate = searchParams.month ? new Date(`${searchParams.month}-01T00:00:00`) : new Date();
  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const prevMonth = format(addMonths(monthStart, -1), "yyyy-MM");
  const nextMonth = format(addMonths(monthStart, 1), "yyyy-MM");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Contentplanning</h1>
          <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">
            {canManage
              ? "Sleep items naar een andere dag om te herplannen, of klik het potloodje om te bewerken."
              : "Bekijk en keur geplande content goed, of stel zelf iets voor."}
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="flex items-center justify-between gap-2 sm:justify-start">
            <Link href={`/content-planning?month=${prevMonth}`} className="btn-secondary px-2.5" aria-label="Vorige maand">
              <ChevronLeft size={16} strokeWidth={1.75} />
            </Link>
            <span className="text-center text-sm font-medium capitalize sm:w-32">
              {format(monthStart, "MMMM yyyy", { locale: nl })}
            </span>
            <Link href={`/content-planning?month=${nextMonth}`} className="btn-secondary px-2.5" aria-label="Volgende maand">
              <ChevronRight size={16} strokeWidth={1.75} />
            </Link>
          </div>
          {canManage ? <StaffNewContentItemDialog companies={companies} /> : <NewContentItemDialog />}
        </div>
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nog geen content gepland"
          description={canManage ? "Maak een content-item aan om te beginnen." : "Zodra TDV content inplant, verschijnt die hier."}
        />
      ) : (
        <CalendarGrid items={items} days={days} monthStart={monthStart} canManage={canManage} companies={companies} />
      )}
    </div>
  );
}
