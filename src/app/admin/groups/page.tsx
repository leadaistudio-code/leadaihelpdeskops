export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-utils";
import { getGroups } from "@/app/actions/groupActions";
import { getAssignableAgents } from "@/app/actions/incidentActions";
import GroupsManager from "@/components/GroupsManager";
import { PageHeader } from "@/components/ui";

export default async function GroupsPage() {
  const me = await getSessionUser();
  if (!me || (me.role !== "ADMIN" && me.role !== "IT_AGENT")) {
    redirect("/dashboard");
  }

  const [groups, agents] = await Promise.all([getGroups(), getAssignableAgents()]);

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <PageHeader
        title="Assignment Groups"
        description="Build agent teams; new tickets are AI-routed to the matching group"
      />

      <GroupsManager groups={groups} agents={agents} />
    </div>
  );
}
