export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { OrganizationProfile } from "@clerk/nextjs";
import { Users } from "lucide-react";
import { getSessionUser } from "@/lib/auth-utils";

// Tenant team management: members, roles, and email invitations — handled
// natively by Clerk Organizations.
export default async function TeamPage() {
  const me = await getSessionUser();
  if (!me || me.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <div className="flex items-center space-x-4 mb-8 mt-4">
        <div className="w-12 h-12 rounded-xl bg-sky-500/20 flex items-center justify-center">
          <Users className="w-6 h-6 text-sky-400" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Team &amp; Invitations</h1>
          <p className="text-slate-400 mt-1">Invite agents and employees to this tenant and manage their roles</p>
        </div>
      </div>

      <div className="flex justify-center">
        <OrganizationProfile routing="hash" />
      </div>
    </div>
  );
}
