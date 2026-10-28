import { createClient } from "@/lib/supabase/server";
import { getMonthlyReportForCurrentUser } from "@/lib/data/reports";
import { isStaffRole, getStaffViewCompanyId } from "@/lib/staff-view";
import { EmptyState } from "@/components/ui/EmptyState";
import { CONTENT_CHANNEL_LABEL } from "@/lib/content-status";
import { BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RapportagePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };
  const isStaff = isStaffRole(profile?.role as string | null | undefined);
  const viewingAsClient = !isStaff || getStaffViewCompanyId() !== null;

  const report = await getMonthlyReportForCurrentUser();
  const periodLabel = `${new Date(report.periodStart).toLocaleDateString("nl-BE")} — ${new Date(report.periodEnd).toLocaleDateString("nl-BE")}`;
  const totalActivity =
    report.contentPublishedCount + report.ticketsResolvedCount + report.deliverablesApprovedCount + report.projectsCompletedCount;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-h2 font-semibold sm:text-h1">rapportage.</h1>
        <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">
          {isStaff && !viewingAsClient
            ? `Wat er over alle klanten heen is afgerond, afgelopen 30 dagen (${periodLabel}).`
            : `Wat TDV de afgelopen 30 dagen voor je heeft afgerond (${periodLabel}).`}
        </p>
      </header>

      {totalActivity === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Nog geen activiteit in deze periode"
          description="Zodra er content wordt gepubliceerd, aanvragen worden opgelost of werk wordt goedgekeurd, verschijnt het hier."
        />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Content gepubliceerd" value={report.contentPublishedCount} />
            <StatCard label="Aanvragen opgelost" value={report.ticketsResolvedCount} />
            <StatCard label="Werk goedgekeurd" value={report.deliverablesApprovedCount} />
            <StatCard label="Projecten afgerond" value={report.projectsCompletedCount} />
          </section>

          {report.recentPublishedContent.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-display text-h3 font-semibold">recent gepubliceerde content.</h2>
              <ul className="space-y-2">
                {report.recentPublishedContent.map((item) => (
                  <li key={item.id} className="card flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="mt-0.5 text-xs text-ink-muted dark:text-ink-dark-muted">
                        {item.channels.map((c) => CONTENT_CHANNEL_LABEL[c]).join(", ")}
                      </p>
                    </div>
                    {item.scheduledFor && (
                      <p className="shrink-0 text-xs text-ink-muted dark:text-ink-dark-muted">
                        {new Date(item.scheduledFor).toLocaleDateString("nl-BE")}
                      </p>
                    )}
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-ink-muted dark:text-ink-dark-muted">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
    </div>
  );
}
