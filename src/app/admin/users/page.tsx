export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { getSessionUser } from "@/lib/auth-utils";
import { getAllUsers } from "@/app/actions/userActions";
import UserRoleSelect from "@/components/UserRoleSelect";

export default async function AdminUsersPage() {
  const me = await getSessionUser();
  if (!me || me.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await getAllUsers();

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <div className="flex items-center space-x-4 mb-10 mt-4">
        <div className="w-12 h-12 rounded-xl bg-sky-500/20 flex items-center justify-center">
          <Users className="w-6 h-6 text-sky-400" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">User Management</h1>
          <p className="text-slate-400 mt-1">Manage team members and their access roles</p>
        </div>
        <span className="ml-auto px-4 py-2 bg-white/5 border border-white/10 text-slate-300 rounded-xl text-sm font-bold">
          {users.length} users
        </span>
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs text-slate-500 bg-black/20 uppercase tracking-wider">
              <tr>
                <th className="px-8 py-4 font-bold">Name</th>
                <th className="px-8 py-4 font-bold">Email</th>
                <th className="px-8 py-4 font-bold">Title</th>
                <th className="px-8 py-4 font-bold">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs shrink-0">
                        {u.name?.charAt(0) || "U"}
                      </div>
                      <span className="font-medium text-slate-200">{u.name}</span>
                      {u.id === me.id && (
                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-[10px] font-bold uppercase">You</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-slate-400">{u.email}</td>
                  <td className="px-8 py-5 text-slate-400">{u.jobTitle || "—"}</td>
                  <td className="px-8 py-5">
                    <UserRoleSelect userId={u.id} current={u.role} disabled={u.id === me.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-4">
        Role changes update Clerk (the identity source of truth) and the local database. A user must sign out and back in for elevated access to take full effect.
      </p>
    </div>
  );
}
