export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getPendingApprovals } from "@/app/actions/approvalActions";
import { getSessionUser } from "@/lib/auth-utils";
import ApprovalActions from "@/components/ApprovalActions";
import EmptyState from "@/components/EmptyState";
import {
  PageHeader,
  Panel,
  Badge,
  priorityTone,
  focusRing,
  cn,
} from "@/components/ui";

export default async function ApprovalsPage() {
  const user = await getSessionUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "IT_AGENT")) {
    redirect("/dashboard");
  }

  const pending = await getPendingApprovals();

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <PageHeader
        title="Approvals Queue"
        description="Requests awaiting your decision"
        action={
          pending.length > 0 ? (
            <Badge tone="warning">{pending.length} pending</Badge>
          ) : undefined
        }
      />

      {pending.length === 0 ? (
        <Panel>
          <EmptyState
            icon={CheckCircle2}
            title="Nothing to approve"
            description="You're all caught up. New requests that need approval will appear here."
            accent="text-emerald-400"
          />
        </Panel>
      ) : (
        <div className="space-y-4">
          {pending.map((inc) => (
            <Panel
              key={inc.id}
              className="p-6 flex flex-col lg:flex-row lg:items-center gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <Link
                    href={`/incidents/${inc.id}`}
                    className={cn("font-semibold text-slate-100 hover:text-[#00926f] transition-colors text-sm rounded-sm", focusRing)}
                  >
                    {inc.number}
                  </Link>
                  <Badge tone="warning">Pending Approval</Badge>
                  <Badge tone={priorityTone(inc.priority)}>{inc.priority}</Badge>
                </div>
                <h3 className="text-lg font-semibold text-white truncate">{inc.title}</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Requested by <span className="text-slate-300 font-medium">{inc.caller?.name ?? "Unknown"}</span>
                  {" · "}
                  {inc.createdAt.toLocaleString()}
                </p>
              </div>
              <ApprovalActions incidentId={inc.id} />
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
