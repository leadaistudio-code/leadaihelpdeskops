export const dynamic = "force-dynamic";

import Link from "next/link";
import { getSessionUser } from "@/lib/auth-utils";
import { getIncidents } from "@/app/actions/incidentActions";
import { Plus, Ticket, Activity, ShieldAlert, Library, BookOpen } from "lucide-react";
import DashboardChart from "@/components/DashboardChart";
import EmptyState from "@/components/EmptyState";
import SlaBadge from "@/components/SlaBadge";
import { FadeIn, Stagger, StaggerItem, AnimatedCounter } from "@/components/motion";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4a4]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#ffffff]";
const primaryCta =
  `inline-flex items-center gap-2 px-5 py-2.5 bg-[#0a0a0a] text-white rounded-xl text-sm font-semibold hover:bg-[#1c1c1e] transition-colors duration-200 ${focusRing}`;
const overlayLink = `absolute inset-0 z-20 rounded-2xl ${focusRing}`;

function priorityBadgeClass(priority: string) {
  if (priority === "CRITICAL") return "bg-rose-500/10 text-rose-400 border-rose-500/20";
  if (priority === "HIGH") return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  return "bg-slate-500/10 text-slate-400 border-slate-500/20";
}

function statusBadgeClass(status: string) {
  if (status === "NEW") return "bg-sky-500/10 text-sky-400 border-sky-500/20";
  if (status === "IN_PROGRESS") return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  if (status === "RESOLVED" || status === "CLOSED") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  return "bg-slate-500/10 text-slate-400 border-slate-500/20";
}

export default async function Home() {
  const user = await getSessionUser();
  const isEmployee = user?.role === "EMPLOYEE";
  
  if (isEmployee) {
    const myIncidents = await getIncidents(user?.id);
    const activeCount = myIncidents.filter(i => i.status !== "RESOLVED" && i.status !== "CLOSED").length;
    
    return (
      <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
        <FadeIn y={12} className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 mt-4 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight text-balance">Welcome, {user?.name}</h1>
            <p className="text-slate-400 mt-2 text-sm max-w-prose">Your personalized IT service portal.</p>
          </div>
          <Link href="/incidents/new" className={primaryCta}>
            <Plus className="w-4 h-4" />
            <span>Report an Issue</span>
          </Link>
        </FadeIn>

        <Stagger className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          <StaggerItem lift={false} className="col-span-1 rounded-2xl border border-white/10 bg-white/[0.02] p-6 relative hover:bg-white/[0.04] transition-colors">
            <Link href="/incidents" aria-label="View my active requests" className={overlayLink} />
            <div className="relative z-10">
              <AnimatedCounter value={activeCount} className="block text-4xl font-semibold text-white mb-1 tabular-nums" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00d4a4]" />
                <span>Active Requests</span>
              </span>
            </div>
          </StaggerItem>

          <StaggerItem lift={false} className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Link href="/catalog" className={`rounded-2xl border border-white/10 bg-white/[0.02] p-6 flex flex-col justify-between hover:bg-white/[0.04] hover:border-white/15 transition-colors ${focusRing}`}>
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                <Library className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Service Catalog</h3>
                <p className="text-slate-400 text-sm">Request hardware, software, or access.</p>
              </div>
            </Link>

            <Link href="/knowledge" className={`rounded-2xl border border-white/10 bg-white/[0.02] p-6 flex flex-col justify-between hover:bg-white/[0.04] hover:border-white/15 transition-colors ${focusRing}`}>
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Knowledge Base</h3>
                <p className="text-slate-400 text-sm">Find answers and troubleshooting steps.</p>
              </div>
            </Link>
          </StaggerItem>
        </Stagger>

        <FadeIn y={12} delay={0.1} className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02]">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-500" />
              <span>My Recent Tickets</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs text-slate-500 bg-black/20 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-semibold">Number</th>
                  <th className="px-6 py-3 font-semibold">State</th>
                  <th className="px-6 py-3 font-semibold">Short description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {myIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      <EmptyState
                        icon={Ticket}
                        title="No open tickets"
                        description="When you report an issue, it will appear here."
                        ctaHref="/incidents/new"
                        ctaLabel="Report an Issue"
                      />
                    </td>
                  </tr>
                ) : (
                  myIncidents.slice(0, 5).map((inc) => (
                  <tr key={inc.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <Link href={`/incidents/${inc.id}`} className={`font-semibold text-slate-200 hover:text-[#00926f] transition-colors ${focusRing} rounded-sm`}>
                        {inc.number}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${statusBadgeClass(inc.status)}`}>
                        {inc.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-200">{inc.title}</td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </FadeIn>
      </div>
    );
  }

  // Agent Dashboard
  const allIncidents = await getIncidents();
  const openIncidents = allIncidents.filter(i => i.status !== "RESOLVED" && i.status !== "CLOSED");
  const criticalCount = openIncidents.filter(i => i.priority === "CRITICAL").length;
  const myWork = openIncidents.filter(i => i.assigneeId === user?.id);

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <FadeIn y={12} className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 mt-4 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight text-balance">Operations Overview</h1>
          <p className="text-slate-400 mt-2 text-sm max-w-prose">Global overview of IT operations.</p>
        </div>
        <Link href="/incidents/new" className={primaryCta}>
          <Plus className="w-4 h-4" />
          <span>Create Incident</span>
        </Link>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-10">
        <Stagger className="col-span-1 md:col-span-2 grid grid-cols-2 gap-5">
          <StaggerItem lift={false} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 relative flex flex-col justify-between hover:bg-white/[0.04] transition-colors">
            <Link href="/incidents/active" aria-label="View open incidents" className={overlayLink} />
            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center mb-3">
              <Ticket className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <AnimatedCounter value={openIncidents.length} className="block text-3xl font-semibold text-white mb-0.5 tabular-nums" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Open Incidents</span>
            </div>
          </StaggerItem>

          <StaggerItem lift={false} className="rounded-2xl border border-rose-500/20 bg-white/[0.02] p-5 relative flex flex-col justify-between hover:bg-white/[0.04] transition-colors">
            <Link href="/incidents?priority=CRITICAL" aria-label="View critical priority incidents" className={overlayLink} />
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center mb-3">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <AnimatedCounter value={criticalCount} className="block text-3xl font-semibold text-rose-400 mb-0.5 tabular-nums" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Critical Priority</span>
            </div>
          </StaggerItem>

          <StaggerItem lift={false} className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-5 relative flex items-center justify-between hover:bg-white/[0.04] transition-colors">
            <Link href="/incidents/assigned" aria-label="View incidents assigned to me" className={overlayLink} />
            <div>
              <AnimatedCounter value={myWork.length} className="block text-3xl font-semibold text-white mb-0.5 tabular-nums" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned to Me</span>
            </div>
            <Activity className="w-5 h-5 text-slate-500" />
          </StaggerItem>
        </Stagger>

        <FadeIn y={12} delay={0.1} className="col-span-1 md:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-5 flex flex-col">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Incident Volume (7 Days)</h3>
          <div className="h-[220px] w-full">
            <DashboardChart />
          </div>
        </FadeIn>
      </div>

      <FadeIn y={12} delay={0.1} className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02]">
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">My Active Work</h2>
          <span className="px-2.5 py-0.5 border border-white/10 rounded-full text-xs font-medium text-slate-400 tabular-nums">{myWork.length} tickets</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs text-slate-500 bg-black/20 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 font-semibold">Number</th>
                <th className="px-6 py-3 font-semibold">Priority</th>
                <th className="px-6 py-3 font-semibold">State</th>
                <th className="px-6 py-3 font-semibold">Short description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {myWork.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      icon={Ticket}
                      title="You're all caught up"
                      description="No tickets are assigned to you right now."
                      ctaHref="/incidents/active"
                      ctaLabel="View open queue"
                    />
                  </td>
                </tr>
              ) : (
                myWork.map((inc) => (
                <tr key={inc.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <Link href={`/incidents/${inc.id}`} className={`font-semibold text-slate-200 hover:text-[#00926f] transition-colors ${focusRing} rounded-sm`}>
                      {inc.number}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${priorityBadgeClass(inc.priority)}`}>
                      {inc.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${statusBadgeClass(inc.status)}`}>
                      {inc.status.replace(/_/g, " ")}
                    </span>
                    {inc.slaInstances[0] && (
                      <div className="mt-1.5">
                        <SlaBadge dueAt={inc.slaInstances[0].dueAt} stage={inc.slaInstances[0].stage} />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-200">{inc.title}</td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </FadeIn>
    </div>
  );
}
