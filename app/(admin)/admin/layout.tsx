import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { MobileNav } from "@/components/layout/MobileNav";
import { NavLinks } from "@/components/layout/NavLinks";
import { RealtimeNotifications } from "@/components/layout/RealtimeNotifications";
import { getCurrentAgencyBranding } from "@/lib/data/agency-branding";
import { agencyAccentStyle } from "@/lib/brand/accent";
import { themeClass } from "@/lib/theme";
import { getThemePreference } from "@/lib/theme-server";
import { cn } from "@/lib/utils";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { generateAgencyMetadata, generateAgencyViewport } from "@/lib/branding-metadata";

export const generateMetadata = generateAgencyMetadata;
export const generateViewport = generateAgencyViewport;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  if (profile?.role !== "agency_admin" && profile?.role !== "agency_staff") {
    redirect("/dashboard");
  }
  const fullName = profile?.full_name as string | null;
  const branding = await getCurrentAgencyBranding();
  const brandName = branding?.brand_name || "TDV";

  return (
    <div
      className={cn(
        "accent-scope flex min-h-screen flex-col bg-canvas text-ink dark:bg-canvas-dark dark:text-ink-dark md:flex-row",
        themeClass(getThemePreference())
      )}
      style={agencyAccentStyle(branding?.accent_color)}
    >
      {/* Eigen ToastProvider binnen de wrapper: zo erven toasts het thema en
          de agency-accentkleur (de root-provider staat erbuiten). */}
      <ToastProvider>
        <RealtimeNotifications userId={user.id} />
        <MobileNav
          variant="admin"
          title={brandName}
          subtitle="Adminportaal"
          userEmail={user.email!}
          fullName={fullName}
          settingsHref="/admin/settings"
        />
        <aside className="hidden w-56 shrink-0 flex-col overflow-y-auto border-r border-border bg-surface-sunken px-3 py-6 dark:border-border-dark dark:bg-surface-sunken-dark md:sticky md:top-0 md:flex md:h-screen">
          <div className="mb-8 px-3 text-sm font-medium text-ink-muted dark:text-ink-dark-muted">
            {brandName} — Adminportaal
          </div>
          <div className="mb-4">
            <GlobalSearch />
          </div>
          <NavLinks variant="admin" />
          <div className="mt-4 border-t border-border pt-4 dark:border-border-dark">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-canvas hover:text-ink dark:text-ink-dark-muted dark:hover:bg-canvas-dark dark:hover:text-ink-dark"
            >
              <LayoutDashboard size={18} strokeWidth={1.75} />
              Naar klantportaal
            </Link>
          </div>
          <div className="mt-4 border-t border-border pt-4 dark:border-border-dark">
            <AccountMenu email={user.email!} fullName={fullName} settingsHref="/admin/settings" />
          </div>
        </aside>
        <main className="mx-auto min-w-0 max-w-6xl flex-1 px-4 py-8 md:px-8">{children}</main>
      </ToastProvider>
    </div>
  );
}
