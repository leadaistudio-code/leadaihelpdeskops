import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getIncidents } from "@/app/actions/incidentActions";
import { Plus, Ticket, Activity, ShieldAlert, Library, BookOpen } from "lucide-react";
import DashboardChart from "@/components/DashboardChart";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const isEmployee = session?.user?.role === "EMPLOYEE";
  
  if (isEmployee) {
    const myIncidents = await getIncidents(session?.user?.id);
    const activeCount = myIncidents.filter(i => i.status !== "RESOLVED" && i.status !== "CLOSED").length;
    
    return (
      <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 mt-4 gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Welcome, {session?.user?.name}</h1>
            <p className="text-slate-400 mt-2 text-lg">Your personalized IT service portal.</p>
          </div>
          <Link href="/incidents/new" className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] hover:-translate-y-1 transition-all font-bold group">
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            <span>Report an Issue</span>
          </Link>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="col-span-1 glass-panel rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity">
              <Ticket className="w-24 h-24 text-sky-400" />
            </div>
            <div className="relative z-10">
              <span className="block text-6xl font-black bg-clip-text text-transparent bg-gradient-to-br from-sky-400 to-indigo-500 mb-2">{activeCount}</span>
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
                <span>Active Requests</span>
              </span>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Link href="/catalog" className="glass-panel rounded-3xl p-8 flex flex-col justify-between hover:bg-white/5 transition-all group border border-white/5 hover:border-violet-500/30">
              <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Library className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Service Catalog</h3>
                <p className="text-slate-400 text-sm">Request hardware, software, or access.</p>
              </div>
            </Link>
            
            <Link href="/knowledge" className="glass-panel rounded-3xl p-8 flex flex-col justify-between hover:bg-white/5 transition-all group border border-white/5 hover:border-emerald-500/30">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Knowledge Base</h3>
                <p className="text-slate-400 text-sm">Find answers and troubleshooting steps.</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="glass-panel rounded-3xl overflow-hidden border border-white/10">
          <div className="px-8 py-6 border-b border-white/5 bg-slate-900/50">
            <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center space-x-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>My Recent Tickets</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs text-slate-500 bg-black/20 uppercase tracking-wider">
                <tr>
                  <th className="px-8 py-4 font-bold">Number</th>
                  <th className="px-8 py-4 font-bold">State</th>
                  <th className="px-8 py-4 font-bold">Short Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {myIncidents.slice(0, 5).map(inc => (
                  <tr key={inc.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-5">
                      <Link href={`/incidents/${inc.id}`} className="font-bold text-indigo-400 group-hover:text-indigo-300">
                        {inc.number}
                      </Link>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        inc.status === 'NEW' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 
                        inc.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                        {inc.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 font-medium">{inc.title}</td>
                  </tr>
                ))}
                {myIncidents.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-8 py-8 text-center text-slate-500 italic">You have no active requests.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Agent Dashboard
  const allIncidents = await getIncidents();
  const openIncidents = allIncidents.filter(i => i.status !== "RESOLVED" && i.status !== "CLOSED");
  const criticalCount = openIncidents.filter(i => i.priority === "CRITICAL").length;
  const myWork = openIncidents.filter(i => i.assigneeId === session?.user?.id);

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 mt-4 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Command Center</h1>
          <p className="text-slate-400 mt-2 text-lg">Global overview of IT operations.</p>
        </div>
        <Link href="/incidents/new" className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] hover:-translate-y-1 transition-all font-bold group">
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          <span>Create Incident</span>
        </Link>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        
        {/* KPI Cards */}
        <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-6">
          <div className="glass-panel rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <Ticket className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <span className="block text-4xl font-black text-white mb-1">{openIncidents.length}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Open Incidents</span>
            </div>
          </div>
          
          <div className="glass-panel rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between border-rose-500/30">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center animate-pulse-glow">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
              </div>
            </div>
            <div>
              <span className="block text-4xl font-black text-rose-400 mb-1">{criticalCount}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Critical Priority</span>
            </div>
          </div>

          <div className="col-span-2 glass-panel rounded-3xl p-6 relative overflow-hidden flex items-center justify-between">
             <div>
              <span className="block text-4xl font-black text-emerald-400 mb-1">{myWork.length}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assigned to Me</span>
             </div>
             <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
               <Activity className="w-8 h-8 text-emerald-400" />
             </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="col-span-1 md:col-span-2 glass-panel rounded-3xl p-6 flex flex-col">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Incident Volume (7 Days)</h3>
          <div className="flex-1 min-h-[200px]">
             <DashboardChart />
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden border border-white/10">
        <div className="px-8 py-6 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
          <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest">My Active Work</h2>
          <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-slate-400">{myWork.length} Tickets</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs text-slate-500 bg-black/20 uppercase tracking-wider">
              <tr>
                <th className="px-8 py-4 font-bold">Number</th>
                <th className="px-8 py-4 font-bold">Priority</th>
                <th className="px-8 py-4 font-bold">State</th>
                <th className="px-8 py-4 font-bold">Short Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {myWork.map(inc => (
                <tr key={inc.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-5">
                    <Link href={`/incidents/${inc.id}`} className="font-bold text-indigo-400 group-hover:text-indigo-300">
                      {inc.number}
                    </Link>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      inc.priority === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                      inc.priority === 'HIGH' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      {inc.priority}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-slate-400">{inc.status}</td>
                  <td className="px-8 py-5 font-medium">{inc.title}</td>
                </tr>
              ))}
              {myWork.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-8 text-center text-slate-500 italic">You're all caught up. No tickets assigned.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
