import { AccountMenu } from "@/components/layout/AccountMenu";
import { NavLinks } from "@/components/layout/NavLinks";

export function Sidebar({ userEmail, fullName }: { userEmail: string; fullName?: string | null }) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface px-3 py-6 dark:border-border-dark dark:bg-surface-dark md:flex">
      <div className="mb-8 px-3">
        <span className="font-display text-lg font-semibold">TDV</span>
        <span className="ml-1 text-sm text-ink-muted dark:text-ink-dark-muted">Portaal</span>
      </div>

      <NavLinks variant="portal" />

      <div className="mt-4 border-t border-border pt-4 dark:border-border-dark">
        <AccountMenu email={userEmail} fullName={fullName} />
      </div>
    </aside>
  );
}
