import Link from "next/link";
import { ShieldCheck } from "lucide-react";
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
  companyLogoUrl,
}: {
  userId: string;
  userEmail: string;
  fullName?: string | null;
  unreadCount: number;
  staffView?: { companies: { id: string; name: string }[]; currentCompanyId: string | null } | null;
  companyLogoUrl?: string | null;
}) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto border-r border-border bg-surface px-3 py-6 dark:border-border-dark dark:bg-surface-dark md:sticky md:top-0 md:flex md:h-screen">
      <div className="mb-8 flex items-center justify-between px-3">
        <div className="flex min-w-0 items-center gap-2">
          {companyLogoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={companyLogoUrl} alt="" className="h-6 w-6 shrink-0 rounded object-cover" />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo.png" alt="TDV Marketing Solutions" className="h-6 w-auto shrink-0" />
        </div>
        <NotificationBell userId={userId} initialUnreadCount={unreadCount} />
      </div>

      <NavLinks variant="portal" />

      {staffView && (
        <div className="mt-4 space-y-3 border-t border-border pt-4 dark:border-border-dark">
          <Link
            href="/admin/clients"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-canvas hover:text-ink dark:text-ink-dark-muted dark:hover:bg-canvas-dark dark:hover:text-ink-dark"
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
