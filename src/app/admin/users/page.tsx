export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-utils";
import { getAllUsers } from "@/app/actions/userActions";
import UserRoleSelect from "@/components/UserRoleSelect";
import UserModuleSelect from "@/components/UserModuleSelect";
import {
  PageHeader,
  Panel,
  Badge,
  DataTable,
  THead,
  TH,
  TBody,
  TR,
  TD,
} from "@/components/ui";

export default async function AdminUsersPage() {
  const me = await getSessionUser();
  if (!me || me.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await getAllUsers();

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <PageHeader
        title="User Management"
        description="Manage team members and their access roles"
        action={<Badge tone="neutral">{users.length} users</Badge>}
      />

      <Panel className="overflow-hidden">
        <DataTable>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH>Email</TH>
              <TH>Title</TH>
              <TH>Role</TH>
              <TH className="min-w-[250px]">Module Access</TH>
            </tr>
          </THead>
          <TBody>
            {users.map((u) => (
              <TR key={u.id}>
                <TD>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-semibold text-slate-300 text-xs shrink-0">
                      {u.name?.charAt(0) || "U"}
                    </div>
                    <span className="font-medium text-slate-200">{u.name}</span>
                    {u.id === me.id && <Badge tone="neutral">You</Badge>}
                  </div>
                </TD>
                <TD className="text-slate-400">{u.email}</TD>
                <TD className="text-slate-400">{u.jobTitle || "—"}</TD>
                <TD>
                  <UserRoleSelect userId={u.id} current={u.role} disabled={u.id === me.id} />
                </TD>
                <TD>
                  <UserModuleSelect userId={u.id} currentModules={u.moduleAccess || []} disabled={u.id === me.id} />
                </TD>
              </TR>
            ))}
          </TBody>
        </DataTable>
      </Panel>

      <p className="text-xs text-slate-500 mt-4">
        Role changes update Clerk (the identity source of truth) and the local database. A user must sign out and back in for elevated access to take full effect.
      </p>
    </div>
  );
}
