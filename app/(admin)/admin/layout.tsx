import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { MobileNav } from "@/components/layout/MobileNav";
import { NavLinks } from "@/components/layout/NavLinks";
import { RealtimeNotifications } from "@/components/layout/RealtimeNotifications";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  if (profile?.role !== "tdv_admin" && profile?.role !== "tdv_staff") {
    redirect("/dashboard");
  }
  const fullName = profile?.full_name as string | null;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <RealtimeNotifications userId={user.id} />
      <MobileNav
        variant="admin"
        title="TDV"
        subtitle="Adminportaal"
        userEmail={user.email!}
        fullName={fullName}
        settingsHref="/admin/settings"
      />
      <aside className="hidden w-56 shrink-0 flex-col overflow-y-auto border-r border-border bg-surface px-3 py-6 dark:border-border-dark dark:bg-surface-dark md:sticky md:top-0 md:flex md:h-screen">
        <div className="mb-8 px-3 text-sm font-medium text-ink-muted dark:text-ink-dark-muted">
          TDV — Adminportaal
        </div>
        <NavLinks variant="admin" />
        <div className="mt-4 border-t border-border pt-4 dark:border-border-dark">
          <AccountMenu email={user.email!} fullName={fullName} settingsHref="/admin/settings" />
        </div>
      </aside>
      <main className="mx-auto min-w-0 max-w-6xl flex-1 px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}
