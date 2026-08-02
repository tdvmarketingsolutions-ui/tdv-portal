import Link from "next/link";
import {
  LayoutDashboard,
  FolderKanban,
  Ticket,
  CalendarDays,
  MessageSquareText,
  FileStack,
  Sparkles,
  Bell,
  Settings,
} from "lucide-react";
import { AccountMenu } from "@/components/layout/AccountMenu";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projecten", icon: FolderKanban },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/content-planning", label: "Contentplanning", icon: CalendarDays },
  { href: "/feedback", label: "Feedback", icon: MessageSquareText },
  { href: "/files", label: "Bestanden", icon: FileStack },
  { href: "/ai-assistant", label: "AI Assistent", icon: Sparkles },
  { href: "/notifications", label: "Meldingen", icon: Bell },
  { href: "/settings", label: "Instellingen", icon: Settings },
] as const;

export function Sidebar({ userEmail, fullName }: { userEmail: string; fullName?: string | null }) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface px-3 py-6 dark:border-border-dark dark:bg-surface-dark md:flex">
      <div className="mb-8 px-3">
        <span className="font-display text-lg font-semibold">TDV</span>
        <span className="ml-1 text-sm text-ink-muted dark:text-ink-dark-muted">Portaal</span>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-canvas hover:text-ink dark:text-ink-dark-muted dark:hover:bg-canvas-dark dark:hover:text-ink-dark"
          >
            <Icon size={18} strokeWidth={1.75} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-4 border-t border-border pt-4 dark:border-border-dark">
        <AccountMenu email={userEmail} fullName={fullName} />
      </div>
    </aside>
  );
}
