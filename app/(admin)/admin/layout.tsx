import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AccountMenu } from "@/components/layout/AccountMenu";

const ADMIN_NAV = [
  { href: "/admin/clients", label: "Klanten" },
  { href: "/admin/projects", label: "Projecten" },
  { href: "/admin/users", label: "Gebruikers" },
  { href: "/admin/tickets", label: "Tickets" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/ai", label: "AI" },
  { href: "/admin/settings", label: "Instellingen" },
] as const;

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

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-surface px-3 py-6 dark:border-border-dark dark:bg-surface-dark md:flex">
        <div className="mb-8 px-3 text-sm font-medium text-ink-muted dark:text-ink-dark-muted">
          TDV — Adminportaal
        </div>
        <nav className="flex-1 space-y-1">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-xl px-3 py-2 text-sm hover:bg-canvas dark:hover:bg-canvas-dark"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-4 border-t border-border pt-4 dark:border-border-dark">
          <AccountMenu
            email={user.email!}
            fullName={profile?.full_name as string | null}
            settingsHref="/admin/settings"
          />
        </div>
      </aside>
      <main className="mx-auto max-w-6xl flex-1 px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}
