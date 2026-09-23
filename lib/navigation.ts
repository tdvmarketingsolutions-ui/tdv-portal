import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FolderKanban,
  Inbox,
  CalendarDays,
  FileStack,
  Sparkles,
  Settings,
  Building2,
  Users,
  Bot,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

// "Aanvragen" and "Feedback" are deliberately not top-level items: aanvragen
// (tickets) live under a project's own detail page (linked + creatable from
// there), and feedback lives on deliverables, which are also shown per
// project — see app/(portal)/projects/[id]/page.tsx. "Meldingen" isn't
// listed either since the bell icon in the sidebar header already opens
// /notifications; a second nav entry for the same page was redundant.
export const PORTAL_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projecten", icon: FolderKanban },
  { href: "/content-planning", label: "Contentplanning", icon: CalendarDays },
  { href: "/files", label: "Bestanden", icon: FileStack },
  { href: "/ai-assistant", label: "AI Assistent", icon: Sparkles },
  { href: "/settings", label: "Instellingen", icon: Settings },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin/clients", label: "Klanten", icon: Building2 },
  { href: "/admin/projects", label: "Projecten", icon: FolderKanban },
  { href: "/admin/users", label: "Gebruikers", icon: Users },
  { href: "/admin/aanvragen", label: "Aanvragen", icon: Inbox },
  { href: "/admin/content", label: "Content", icon: CalendarDays },
  { href: "/admin/ai", label: "AI", icon: Bot },
  { href: "/admin/settings", label: "Instellingen", icon: Settings },
];
