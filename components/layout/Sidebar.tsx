import Link from "next/link";
import { AgencyLogo } from "@/components/brand/AgencyLogo";
import { ShieldCheck } from "lucide-react";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { NavLinks } from "@/components/layout/NavLinks";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { StaffViewSwitcher } from "@/components/layout/StaffViewSwitcher";

export function Sidebar({
  userId,
  userEmail,
  fullName,
  unreadCount,
  staffView,
  companyLogoUrl,
  agencyLogoUrl,
  agencyBrandName,
}: {
  userId: string;
  userEmail: string;
  fullName?: string | null;
  unreadCount: number;
  staffView?: { companies: { id: string; name: string }[]; currentCompanyId: string | null } | null;
  companyLogoUrl?: string | null;
  agencyLogoUrl?: string | null;
  agencyBrandName?: string | null;
}) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto border-r border-border bg-surface-sunken px-3 py-6 dark:border-border-dark dark:bg-surface-sunken-dark md:sticky md:top-0 md:flex md:h-screen">
      <div className="mb-8 flex items-center justify-between px-3">
        <div className="flex min-w-0 items-center gap-2">
          {companyLogoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={companyLogoUrl} alt="" className="h-6 w-6 shrink-0 rounded object-cover" />
          )}
          <Link href="/dashboard" className="shrink-0">
            <AgencyLogo logoUrl={agencyLogoUrl} brandName={agencyBrandName} />
          </Link>
        </div>
        {/* Staff previewing a specific client ("Bekijk als klant") shouldn't see
            their own staff inbox here — those notifications (and where clicking
            one takes you) belong to staff's own environment, not this preview. */}
        {!staffView?.currentCompanyId && <NotificationBell userId={userId} initialUnreadCount={unreadCount} />}
      </div>

      <div className="mb-4 px-0">
        <GlobalSearch />
      </div>

      <NavLinks variant="portal" />

      {staffView && (
        <div className="mt-4 space-y-3 border-t border-border pt-4 dark:border-border-dark">
          <Link
            href="/admin/clients"
            className="focus-ring flex h-10 items-center gap-2 rounded-xl px-3 text-sm text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink dark:text-ink-dark-muted dark:hover:bg-ink-dark/5 dark:hover:text-ink-dark"
          >
            <ShieldCheck size={18} strokeWidth={1.75} />
            Naar adminportaal
          </Link>
          <StaffViewSwitcher companies={staffView.companies} currentCompanyId={staffView.currentCompanyId} />
        </div>
      )}

      <div className="mt-4 border-t border-border pt-4 dark:border-border-dark">
        <AccountMenu email={userEmail} fullName={fullName} />
      </div>
    </aside>
  );
}
