import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FolderKanban,
  Inbox,
  CalendarDays,
  MessageSquareText,
  FileStack,
  Sparkles,
  Bell,
  Settings,
  Building2,
  Users,
  Bot,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const PORTAL_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projecten", icon: FolderKanban },
  { href: "/aanvragen", label: "Aanvragen", icon: Inbox },
  { href: "/content-planning", label: "Contentplanning", icon: CalendarDays },
  { href: "/feedback", label: "Feedback", icon: MessageSquareText },
  { href: "/files", label: "Bestanden", icon: FileStack },
  { href: "/ai-assistant", label: "AI Assistent", icon: Sparkles },
  { href: "/notifications", label: "Meldingen", icon: Bell },
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
