import Link from "next/link";
import { Library, Laptop, Monitor, FileSpreadsheet, Palette, ShieldAlert, BadgeHelp, Search, Settings } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function CatalogPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || "EMPLOYEE";
  const items = [
    { id: "laptop-macbook", name: "Apple MacBook Pro 16\"", category: "Hardware", desc: "Request a standard developer laptop.", icon: Laptop, color: "text-sky-400", bg: "bg-sky-500/20", allowedRoles: ["EMPLOYEE", "IT_AGENT", "ADMIN"] },
    { id: "monitor-dell", name: "Dell 27\" 4K Monitor", category: "Hardware", desc: "Request an additional external display.", icon: Monitor, color: "text-indigo-400", bg: "bg-indigo-500/20", allowedRoles: ["EMPLOYEE", "IT_AGENT", "ADMIN"] },
    { id: "soft-office", name: "Microsoft Office 365", category: "Software", desc: "Request a license for Word, Excel, PowerPoint.", icon: FileSpreadsheet, color: "text-emerald-400", bg: "bg-emerald-500/20", allowedRoles: ["EMPLOYEE", "IT_AGENT", "ADMIN"] },
    { id: "soft-adobe", name: "Adobe Creative Cloud", category: "Software", desc: "Request access to Photoshop, Illustrator, etc.", icon: Palette, color: "text-rose-400", bg: "bg-rose-500/20", allowedRoles: ["EMPLOYEE", "IT_AGENT", "ADMIN"] },
    { id: "access-vpn", name: "VPN Access", category: "Access", desc: "Request remote access to corporate network.", icon: ShieldAlert, color: "text-amber-400", bg: "bg-amber-500/20", allowedRoles: ["EMPLOYEE", "IT_AGENT", "ADMIN"] },
    { id: "help-generic", name: "Report an Issue", category: "Help", desc: "Can't find what you need? Report a generic issue.", icon: BadgeHelp, color: "text-violet-400", bg: "bg-violet-500/20", allowedRoles: ["EMPLOYEE", "IT_AGENT", "ADMIN"] },
    { id: "admin-rights", name: "Global Admin Rights", category: "Access", desc: "Request elevated administrative privileges across the domain.", icon: Settings, color: "text-red-400", bg: "bg-red-500/20", allowedRoles: ["IT_AGENT", "ADMIN"] },
  ];

  const visibleItems = items.filter(item => item.allowedRoles.includes(role));

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <div className="flex items-center space-x-4 mb-10 mt-4">
        <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
          <Library className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Service Catalog</h1>
          <p className="text-slate-400 mt-1">Order hardware, request software access, or get help.</p>
        </div>
      </div>

      <div className="mb-10 relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
        <input 
          type="text" 
          placeholder="What do you need help with?" 
          className="w-full max-w-2xl pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-700/50 text-slate-200 rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder-slate-500 text-lg"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleItems.map(item => (
          <Link key={item.id} href={`/catalog/${item.id}`} className="glass-panel rounded-3xl p-8 hover:bg-white/5 transition-all group border border-white/5 hover:border-violet-500/30 flex flex-col hover:-translate-y-1">
            <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
              <item.icon className={`w-7 h-7 ${item.color}`} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{item.name}</h2>
            <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
