import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { RealtimeNotifications } from "@/components/layout/RealtimeNotifications";
import { getUnreadNotificationCount } from "@/lib/data/notifications";
import { getAllCompaniesForSelect } from "@/lib/data/admin/projects";
import { isStaffRole, getStaffViewCompanyId } from "@/lib/staff-view";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belt-and-braces: middleware already redirects unauthenticated requests,
  // but Server Components should never assume that ran.
  if (!user) redirect("/login");

  const [{ data: profile }, unreadCount] = await Promise.all([
    supabase.from("profiles").select("full_name, role").eq("id", user.id).single(),
    getUnreadNotificationCount(),
  ]);
  const fullName = profile?.full_name as string | null;
  const isStaff = isStaffRole(profile?.role as string | null | undefined);

  // "Bekijk als klant": lets staff preview client-facing list views + create
  // flows for one company without a second login (see lib/staff-view.ts).
  const staffView = isStaff
    ? { companies: await getAllCompaniesForSelect(), currentCompanyId: getStaffViewCompanyId() }
    : null;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <RealtimeNotifications userId={user.id} />
      <MobileNav
        variant="portal"
        title="TDV"
        subtitle="Portaal"
        userId={user.id}
        userEmail={user.email!}
        fullName={fullName}
        unreadCount={unreadCount}
        staffView={staffView}
      />
      <Sidebar userId={user.id} userEmail={user.email!} fullName={fullName} unreadCount={unreadCount} staffView={staffView} />
      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
