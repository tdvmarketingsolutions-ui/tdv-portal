import { Users } from "lucide-react";
import { getAllUsers, isServiceRoleConfigured } from "@/lib/data/admin/users";
import { getAllCompaniesForSelect } from "@/lib/data/admin/projects";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { InviteUserDialog } from "./InviteUserDialog";
import { EditUserDialog } from "./EditUserDialog";

const ROLE_LABEL: Record<string, string> = {
  tdv_admin: "TDV Admin",
  tdv_staff: "TDV Staff",
  client_admin: "Klant (admin)",
  client_member: "Klant (lid)",
};

export default async function AdminUsersPage() {
  const [users, companies] = await Promise.all([getAllUsers(), getAllCompaniesForSelect()]);
  const serviceRoleConfigured = isServiceRoleConfigured();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Gebruikers</h1>
        <InviteUserDialog companies={companies} serviceRoleConfigured={serviceRoleConfigured} />
      </header>

      {users.length === 0 ? (
        <EmptyState icon={Users} title="Nog geen gebruikers" description="Nodig je eerste gebruiker uit." />
      ) : (
        <Table>
          <Table.Head>
            <Table.HeadCell>Naam</Table.HeadCell>
            <Table.HeadCell>Klant</Table.HeadCell>
            <Table.HeadCell>Rol</Table.HeadCell>
            <Table.HeadCell />
          </Table.Head>
          <Table.Body>
            {users.map((u) => (
              <Table.Row key={u.id}>
                <Table.Cell>{u.full_name ?? "Naamloos"}</Table.Cell>
                <Table.Cell>{u.companies?.name ?? "—"}</Table.Cell>
                <Table.Cell>
                  <Badge tone="gray">{ROLE_LABEL[u.role] ?? u.role}</Badge>
                </Table.Cell>
                <Table.Cell>
                  <EditUserDialog
                    userId={u.id}
                    userName={u.full_name ?? "deze gebruiker"}
                    currentRole={u.role}
                    currentCompanyId={u.company_id}
                    companies={companies}
                  />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </div>
  );
}
