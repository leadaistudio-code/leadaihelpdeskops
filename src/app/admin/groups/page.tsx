export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { Network } from "lucide-react";
import { getSessionUser } from "@/lib/auth-utils";
import { getGroups } from "@/app/actions/groupActions";
import { getAssignableAgents } from "@/app/actions/incidentActions";
import GroupsManager from "@/components/GroupsManager";

export default async function GroupsPage() {
  const me = await getSessionUser();
  if (!me || (me.role !== "ADMIN" && me.role !== "IT_AGENT")) {
    redirect("/dashboard");
  }

  const [groups, agents] = await Promise.all([getGroups(), getAssignableAgents()]);

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <div className="flex items-center space-x-4 mb-8 mt-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
          <Network className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Assignment Groups</h1>
          <p className="text-slate-400 mt-1">Build agent teams; new tickets are AI-routed to the matching group</p>
        </div>
      </div>

      <GroupsManager groups={groups} agents={agents} />
    </div>
  );
}
