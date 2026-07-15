export const dynamic = "force-dynamic";

import Link from "next/link";
import { getIncidents } from "@/app/actions/incidentActions";
import { getSessionUser } from "@/lib/auth-utils";
import { Plus } from "lucide-react";
import SlaBadge from "@/components/SlaBadge";
import {
  PageHeader,
  Button,
  Panel,
  PanelHeader,
  Badge,
  statusTone,
  priorityTone,
  humanize,
  DataTable,
  THead,
  TH,
  TBody,
  TR,
  TD,
  focusRing,
  cn,
} from "@/components/ui";

export default async function AssignedIncidentsPage() {
  const user = await getSessionUser();

  // Fetch all incidents and filter by assignee (or we could update incidentActions to accept assigneeId)
  const allIncidents = await getIncidents();
  const incidents = allIncidents.filter(i => i.assigneeId === user?.id);

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <PageHeader
        title="Assigned to Me"
        description="Tickets currently in your queue"
        action={
          <Button href="/incidents/new" icon={Plus}>
            New Incident
          </Button>
        }
      />

      <Panel className="overflow-hidden">
        <PanelHeader title="My Work Queue" />
        <DataTable>
          <THead>
            <tr>
              <TH>Number</TH>
              <TH>Opened</TH>
              <TH>Short description</TH>
              <TH>Caller</TH>
              <TH>Priority</TH>
              <TH>State</TH>
            </tr>
          </THead>
          <TBody>
            {incidents.length === 0 ? (
              <tr>
                <TD colSpan={6} align="center" className="text-slate-500">
                  No assigned tickets. You&apos;re caught up!
                </TD>
              </tr>
            ) : (
              incidents.map((inc) => (
                <TR key={inc.id} className="cursor-pointer">
                  <TD>
                    <Link href={`/incidents/${inc.id}`} className={cn("font-semibold text-slate-100 hover:text-[#00926f] transition-colors rounded-sm", focusRing)}>
                      {inc.number}
                    </Link>
                  </TD>
                  <TD className="text-slate-400">{inc.createdAt.toLocaleString()}</TD>
                  <TD className="font-medium text-slate-200">{inc.title}</TD>
                  <TD className="text-slate-400">{inc.caller?.name || "Unknown"}</TD>
                  <TD>
                    <Badge tone={priorityTone(inc.priority)}>{inc.priority}</Badge>
                  </TD>
                  <TD>
                    <Badge tone={statusTone(inc.status)}>{humanize(inc.status)}</Badge>
                    {inc.slaInstances[0] && (
                      <div className="mt-1.5">
                        <SlaBadge dueAt={inc.slaInstances[0].dueAt} stage={inc.slaInstances[0].stage} />
                      </div>
                    )}
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </DataTable>
      </Panel>
    </div>
  );
}
