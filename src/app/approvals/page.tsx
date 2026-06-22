export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, ClipboardCheck } from "lucide-react";
import { getPendingApprovals } from "@/app/actions/approvalActions";
import { getSessionUser } from "@/lib/auth-utils";
import ApprovalActions from "@/components/ApprovalActions";
import EmptyState from "@/components/EmptyState";

export default async function ApprovalsPage() {
  const user = await getSessionUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "IT_AGENT")) {
    redirect("/dashboard");
  }

  const pending = await getPendingApprovals();

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <div className="flex items-center space-x-4 mb-10 mt-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
          <ClipboardCheck className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Approvals Queue</h1>
          <p className="text-slate-400 mt-1">Requests awaiting your decision</p>
        </div>
        {pending.length > 0 && (
          <span className="ml-auto px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-sm font-bold">
            {pending.length} pending
          </span>
        )}
      </div>

      {pending.length === 0 ? (
        <div className="glass-panel rounded-3xl border border-white/10">
          <EmptyState
            icon={CheckCircle2}
            title="Nothing to approve"
            description="You're all caught up. New requests that need approval will appear here."
            accent="text-emerald-400"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((inc) => (
            <div
              key={inc.id}
              className="glass-panel border border-white/10 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <Link href={`/incidents/${inc.id}`} className="font-bold text-indigo-400 hover:text-indigo-300 text-sm">
                    {inc.number}
                  </Link>
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Pending Approval
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    inc.priority === "CRITICAL" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                    inc.priority === "HIGH" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                    "bg-slate-500/10 text-slate-400 border-slate-500/20"
                  }`}>
                    {inc.priority}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white truncate">{inc.title}</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Requested by <span className="text-sky-400 font-medium">{inc.caller?.name ?? "Unknown"}</span>
                  {" · "}
                  {inc.createdAt.toLocaleString()}
                </p>
              </div>
              <ApprovalActions incidentId={inc.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
