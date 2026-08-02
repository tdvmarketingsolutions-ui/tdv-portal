import { createClient } from "@/lib/supabase/server";

export default async function AdminClientsPage() {
  // Regular RLS-bound client is enough here: is_tdv_staff() in the policies
  // already grants staff full read access, so the admin/service-role client
  // is reserved for actions RLS genuinely can't express (e.g. creating an
  // auth.users row for a new client contact via the Admin API).
  const supabase = createClient();
  const { data: companies } = await supabase
    .from("companies")
    .select("*, projects(count), profiles(count)")
    .order("name");

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold">Klanten</h1>
      <table className="card w-full overflow-hidden text-sm">
        <thead className="border-b border-border text-left text-ink-muted dark:border-border-dark dark:text-ink-dark-muted">
          <tr>
            <th className="px-5 py-3 font-medium">Bedrijf</th>
            <th className="px-5 py-3 font-medium">Projecten</th>
            <th className="px-5 py-3 font-medium">Gebruikers</th>
          </tr>
        </thead>
        <tbody>
          {companies?.map((c) => (
            <tr key={c.id} className="border-b border-border last:border-0 dark:border-border-dark">
              <td className="px-5 py-3">{c.name}</td>
              <td className="px-5 py-3">{c.projects?.[0]?.count ?? 0}</td>
              <td className="px-5 py-3">{c.profiles?.[0]?.count ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
