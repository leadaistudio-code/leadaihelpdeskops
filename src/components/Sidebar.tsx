"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Library, 
  BookOpen, 
  Ticket, 
  Activity, 
  Inbox, 
  FolderClock, 
  CheckCircle2, 
  Laptop,
  BarChart3,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Network,
  Workflow
} from "lucide-react";

export default function Sidebar({ isCollapsed, setIsCollapsed }: { isCollapsed: boolean, setIsCollapsed: (val: boolean) => void }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = session?.user?.role;
  const isAgent = role === "IT_AGENT" || role === "ADMIN";

  const NavLink = ({ href, icon: Icon, children }: { href: string, icon: any, children: React.ReactNode }) => {
    const isActive = pathname === href;
    return (
      <Link 
        href={href} 
        className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
          isActive 
            ? "bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20 shadow-[inset_0_0_12px_rgba(99,102,241,0.1)]" 
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
        } ${isCollapsed ? 'justify-center px-0' : ''}`}
        title={isCollapsed ? children as string : undefined}
      >
        <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"}`} />
        {!isCollapsed && <span className="truncate">{children}</span>}
      </Link>
    );
  };

  return (
    <aside className={`fixed left-0 top-16 bottom-0 overflow-hidden flex flex-col text-sm font-medium z-40 bg-slate-950/20 backdrop-blur-md border-r border-white/5 transition-all duration-300 ${isCollapsed ? 'w-24' : 'w-64'}`}>
      <div className={`p-4 border-b border-white/5 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Navigation</span>}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>

      <div className="overflow-y-auto custom-scrollbar flex-1 px-4 py-4 space-y-2">
        {!isCollapsed && (
          <div className="mb-6">
            <input 
              type="text" 
              placeholder="Filter navigator..." 
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 text-slate-200 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder-slate-500"
            />
          </div>
        )}
        {!isCollapsed && <div className="px-2 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Self-Service</div>}
        <NavLink href="/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>
        <NavLink href="/catalog" icon={Library}>Service Catalog</NavLink>
        <NavLink href="/knowledge" icon={BookOpen}>Knowledge Base</NavLink>
        {!isAgent && (
          <NavLink href="/incidents" icon={Ticket}>My Tickets</NavLink>
        )}

        {isAgent && (
          <>
            {!isCollapsed && <div className="px-2 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest mt-8">Observability</div>}
            <NavLink href="/dex" icon={Activity}>DEX Monitoring</NavLink>
            <NavLink href="/reports" icon={BarChart3}>Analytics</NavLink>
            <NavLink href="/cmdb" icon={Network}>CMDB Dependency Map</NavLink>

            {!isCollapsed && <div className="px-2 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest mt-8">Service Desk</div>}
            <NavLink href="/incidents" icon={Inbox}>All Incidents</NavLink>
            <NavLink href="/incidents/assigned" icon={Ticket}>Assigned to me</NavLink>
            <NavLink href="/incidents/active" icon={FolderClock}>Open</NavLink>
            <NavLink href="/incidents/closed" icon={CheckCircle2}>Closed</NavLink>

            {!isCollapsed && <div className="px-2 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest mt-8">Asset Management</div>}
            <NavLink href="/assets" icon={Laptop}>Hardware Assets</NavLink>

            {!isCollapsed && <div className="px-2 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest mt-8">Administration</div>}
            <NavLink href="/admin/slas" icon={Settings}>SLA Management</NavLink>
            <NavLink href="/admin/flow-designer" icon={Workflow}>Flow Designer</NavLink>
          </>
        )}
      </div>
    </aside>
  );
}
