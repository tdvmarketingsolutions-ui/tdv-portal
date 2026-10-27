import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { RealtimeNotifications } from "@/components/layout/RealtimeNotifications";
import { getUnreadNotificationCount } from "@/lib/data/notifications";
import { getAllCompaniesForSelect } from "@/lib/data/admin/projects";
import { getCurrentAgencyBranding } from "@/lib/data/agency-branding";
import { agencyAccentStyle } from "@/lib/color";
import { generateAgencyMetadata, generateAgencyViewport } from "@/lib/branding-metadata";
import { isStaffRole, getStaffViewCompanyId } from "@/lib/staff-view";

export const generateMetadata = generateAgencyMetadata;
export const generateViewport = generateAgencyViewport;

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belt-and-braces: middleware already redirects unauthenticated requests,
  // but Server Components should never assume that ran.
  if (!user) redirect("/login");

  const [{ data: profile }, unreadCount, branding] = await Promise.all([
    supabase.from("profiles").select("full_name, role, companies ( logo_url )").eq("id", user.id).single(),
    getUnreadNotificationCount(),
    getCurrentAgencyBranding(),
  ]);
  const fullName = profile?.full_name as string | null;
  const isStaff = isStaffRole(profile?.role as string | null | undefined);
  // Only ever set for a real client account — a company's own logo has no
  // place in TDV's own portal chrome while staff are using it as staff.
  const companyLogoUrl = !isStaff
    ? ((profile as { companies: { logo_url: string | null } | null } | null)?.companies?.logo_url ?? null)
    : null;

  // "Bekijk als klant": lets staff preview client-facing list views + create
  // flows for one company without a second login (see lib/staff-view.ts).
  const staffView = isStaff
    ? { companies: await getAllCompaniesForSelect(), currentCompanyId: getStaffViewCompanyId() }
    : null;

  return (
    <div className="flex min-h-screen flex-col md:flex-row" style={agencyAccentStyle(branding?.accent_color)}>
      <RealtimeNotifications userId={user.id} />
      <MobileNav
        variant="portal"
        title={branding?.brand_name || "TDV"}
        subtitle="Portaal"
        userId={user.id}
        userEmail={user.email!}
        fullName={fullName}
        unreadCount={unreadCount}
        staffView={staffView}
        agencyLogoUrl={branding?.logo_url}
        agencyBrandName={branding?.brand_name}
      />
      <Sidebar
        userId={user.id}
        userEmail={user.email!}
        fullName={fullName}
        unreadCount={unreadCount}
        staffView={staffView}
        companyLogoUrl={companyLogoUrl}
        agencyLogoUrl={branding?.logo_url}
        agencyBrandName={branding?.brand_name}
      />
      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
