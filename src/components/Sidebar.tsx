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
  Boxes,
  ScrollText,
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
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4a4]/40 ${
        isActive
          ? "bg-[#00d4a4]/10 text-[#00926f] font-semibold"
          : "text-slate-400 hover:text-slate-100 hover:bg-white/5 font-medium"
      } ${isCollapsed ? 'justify-center px-0' : ''}`}
      title={isCollapsed ? (children as string) : undefined}
    >
      <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-[#00926f]" : "text-slate-500 group-hover:text-slate-300"}`} />
      {!isCollapsed && <span className="truncate">{children}</span>}
    </Link>
  );
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: { isCollapsed: boolean, setIsCollapsed: (val: boolean) => void }) {
  const { user } = useUser();
  const pathname = usePathname();
  const role = (user?.publicMetadata?.role as string) || "EMPLOYEE";
  const isAgent = role === "IT_AGENT" || role === "ADMIN";
  const modules = Array.isArray(user?.publicMetadata?.modules) ? (user.publicMetadata.modules as string[]) : ["SELF_SERVICE"];
  
  const hasModule = (modId: string) => role === "ADMIN" || modules.includes(modId);

  // Common props threaded into each NavLink.
  const nav = { pathname, isCollapsed };

  return (
    <aside className={`fixed left-0 top-16 bottom-0 overflow-hidden flex flex-col text-sm font-medium z-40 bg-slate-950/20 backdrop-blur-md border-r border-white/5 transition-all duration-300 ${isCollapsed ? 'w-24' : 'w-64'}`}>
      <div className={`p-4 border-b border-white/5 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Navigation</span>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4a4]/40"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>

      <div className="overflow-y-auto custom-scrollbar flex-1 px-3 py-4 space-y-1">
        {!isCollapsed && (
          <form action="/search" className="mb-5 px-1">
            <input
              type="text"
              name="q"
              placeholder="Search everything…"
              className="w-full px-4 py-2.5 bg-black/20 border border-white/10 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00d4a4]/20 focus:border-[#00d4a4]/60 transition-colors placeholder-slate-500"
            />
          </form>
        )}
        {hasModule("SELF_SERVICE") && (
          <>
            {!isCollapsed && <div className="px-2 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2">Self-Service</div>}
            <NavLink href="/dashboard" icon={LayoutDashboard} {...nav}>Dashboard</NavLink>
            <NavLink href="/catalog" icon={Library} {...nav}>Service Catalog</NavLink>
            <NavLink href="/my-requests" icon={ShoppingBag} {...nav}>My Requests</NavLink>
            <NavLink href="/knowledge" icon={BookOpen} {...nav}>Knowledge Base</NavLink>
            {!hasModule("SERVICE_DESK") && (
              <NavLink href="/incidents" icon={Ticket} {...nav}>My Tickets</NavLink>
            )}
          </>
        )}

        {hasModule("DEX") && (
          <>
            {!isCollapsed && <div className="px-2 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-8">Observability</div>}
            <NavLink href="/dex" icon={Activity} {...nav}>DEX Monitoring</NavLink>
            <NavLink href="/reports" icon={BarChart3} {...nav}>Fleet Reports</NavLink>
            <NavLink href="/analytics" icon={Activity} {...nav}>Shadow IT Analytics</NavLink>
            <NavLink href="/cmdb" icon={Network} {...nav}>CMDB Dependency Map</NavLink>
          </>
        )}

        {hasModule("SERVICE_DESK") && (
          <>
            {!isCollapsed && <div className="px-2 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-8">Service Desk</div>}
            <NavLink href="/incidents" icon={Inbox} {...nav}>All Incidents</NavLink>
            <NavLink href="/incidents/assigned" icon={Ticket} {...nav}>Assigned to me</NavLink>
            <NavLink href="/incidents/active" icon={FolderClock} {...nav}>Open</NavLink>
            <NavLink href="/incidents/closed" icon={CheckCircle2} {...nav}>Closed</NavLink>
            <NavLink href="/problems" icon={Boxes} {...nav}>Problems</NavLink>
            <NavLink href="/approvals" icon={ClipboardCheck} {...nav}>Approvals</NavLink>
          </>
        )}

        {hasModule("ASSET_MANAGEMENT") && (
          <>
            {!isCollapsed && <div className="px-2 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-8">Asset Management</div>}
            <NavLink href="/assets" icon={Laptop} {...nav}>Hardware Assets</NavLink>
          </>
        )}

        {isAgent && (
          <>
            {!isCollapsed && <div className="px-2 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-8">Administration</div>}
            {role === "ADMIN" && <NavLink href="/admin/team" icon={Users} {...nav}>Team &amp; Invites</NavLink>}
            {role === "ADMIN" && <NavLink href="/admin/users" icon={Users} {...nav}>User Management</NavLink>}
            <NavLink href="/admin/groups" icon={Network} {...nav}>Assignment Groups</NavLink>
            <NavLink href="/admin/slas" icon={Settings} {...nav}>SLA Management</NavLink>
            <NavLink href="/admin/flow-designer" icon={Workflow} {...nav}>Flow Designer</NavLink>
            {role === "ADMIN" && <NavLink href="/admin/audit" icon={ScrollText} {...nav}>Audit Log</NavLink>}
          </>
        )}
      </div>
    </aside>
  );
}
