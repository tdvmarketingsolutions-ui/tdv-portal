import { AccountMenu } from "@/components/layout/AccountMenu";
import { NavLinks } from "@/components/layout/NavLinks";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { StaffViewSwitcher } from "@/components/layout/StaffViewSwitcher";

export function Sidebar({
  userId,
  userEmail,
  fullName,
  unreadCount,
  staffView,
}: {
  userId: string;
  userEmail: string;
  fullName?: string | null;
  unreadCount: number;
  staffView?: { companies: { id: string; name: string }[]; currentCompanyId: string | null } | null;
}) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface px-3 py-6 dark:border-border-dark dark:bg-surface-dark md:flex">
      <div className="mb-8 flex items-center justify-between px-3">
        <div>
          <span className="font-display text-lg font-semibold">TDV</span>
          <span className="ml-1 text-sm text-ink-muted dark:text-ink-dark-muted">Portaal</span>
        </div>
        <NotificationBell userId={userId} initialUnreadCount={unreadCount} />
      </div>

      <NavLinks variant="portal" />

      {staffView && (
        <div className="mt-4 border-t border-border pt-4 dark:border-border-dark">
          <StaffViewSwitcher companies={staffView.companies} currentCompanyId={staffView.currentCompanyId} />
        </div>
      )}

      <div className="mt-4 border-t border-border pt-4 dark:border-border-dark">
        <AccountMenu email={userEmail} fullName={fullName} />
      </div>
    </aside>
  );
}
