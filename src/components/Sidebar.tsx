"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
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
  Workflow,
  ClipboardCheck,
  ShoppingBag,
  Users,
  type LucideIcon
} from "lucide-react";

// Hoisted out of the component so it isn't recreated on every render.
function NavLink({
  href,
  icon: Icon,
  children,
  pathname,
  isCollapsed,
}: {
  href: string;
  icon: LucideIcon;
  children: React.ReactNode;
  pathname: string;
  isCollapsed: boolean;
}) {
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
        isActive
          ? "bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20 shadow-[inset_0_0_12px_rgba(99,102,241,0.1)]"
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
      } ${isCollapsed ? 'justify-center px-0' : ''}`}
      title={isCollapsed ? (children as string) : undefined}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"}`} />
      {!isCollapsed && <span className="truncate">{children}</span>}
    </Link>
  );
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: { isCollapsed: boolean, setIsCollapsed: (val: boolean) => void }) {
  const { user } = useUser();
  const pathname = usePathname();
  const role = (user?.publicMetadata?.role as string) || "EMPLOYEE";
  const isAgent = role === "IT_AGENT" || role === "ADMIN";

  // Common props threaded into each NavLink.
  const nav = { pathname, isCollapsed };

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
          <form action="/search" className="mb-6">
            <input
              type="text"
              name="q"
              placeholder="Search everything…"
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 text-slate-200 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder-slate-500"
            />
          </form>
        )}
        {!isCollapsed && <div className="px-2 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Self-Service</div>}
        <NavLink href="/dashboard" icon={LayoutDashboard} {...nav}>Dashboard</NavLink>
        <NavLink href="/catalog" icon={Library} {...nav}>Service Catalog</NavLink>
        <NavLink href="/my-requests" icon={ShoppingBag} {...nav}>My Requests</NavLink>
        <NavLink href="/knowledge" icon={BookOpen} {...nav}>Knowledge Base</NavLink>
        {!isAgent && (
          <NavLink href="/incidents" icon={Ticket} {...nav}>My Tickets</NavLink>
        )}

        {isAgent && (
          <>
            {!isCollapsed && <div className="px-2 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest mt-8">Observability</div>}
            <NavLink href="/dex" icon={Activity} {...nav}>DEX Monitoring</NavLink>
            <NavLink href="/reports" icon={BarChart3} {...nav}>Analytics</NavLink>
            <NavLink href="/cmdb" icon={Network} {...nav}>CMDB Dependency Map</NavLink>

            {!isCollapsed && <div className="px-2 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest mt-8">Service Desk</div>}
            <NavLink href="/incidents" icon={Inbox} {...nav}>All Incidents</NavLink>
            <NavLink href="/incidents/assigned" icon={Ticket} {...nav}>Assigned to me</NavLink>
            <NavLink href="/incidents/active" icon={FolderClock} {...nav}>Open</NavLink>
            <NavLink href="/incidents/closed" icon={CheckCircle2} {...nav}>Closed</NavLink>
            <NavLink href="/approvals" icon={ClipboardCheck} {...nav}>Approvals</NavLink>

            {!isCollapsed && <div className="px-2 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest mt-8">Asset Management</div>}
            <NavLink href="/assets" icon={Laptop} {...nav}>Hardware Assets</NavLink>

            {!isCollapsed && <div className="px-2 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest mt-8">Administration</div>}
            {role === "ADMIN" && <NavLink href="/admin/team" icon={Users} {...nav}>Team &amp; Invites</NavLink>}
            {role === "ADMIN" && <NavLink href="/admin/users" icon={Users} {...nav}>User Management</NavLink>}
            <NavLink href="/admin/groups" icon={Network} {...nav}>Assignment Groups</NavLink>
            <NavLink href="/admin/slas" icon={Settings} {...nav}>SLA Management</NavLink>
            <NavLink href="/admin/flow-designer" icon={Workflow} {...nav}>Flow Designer</NavLink>
          </>
        )}
      </div>
    </aside>
  );
}
