import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Laptop, Server, Network, Database } from "lucide-react";

export default async function AssetCMDBPage({ params }: { params: { id: string } }) {
  // Fix for Next.js 15+ 
  const id = (await Promise.resolve(params)).id;

  const asset = await prisma.asset.findUnique({
    where: { id },
    include: { assignee: true }
  });

  if (!asset) {
    notFound();
  }

  // Simulate upstream/downstream relationships based on category
  const isServer = asset.category === "Server" || asset.name.includes("Server");
  const isNetwork = asset.category === "Network";
  
  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <div className="flex items-center space-x-4 mb-10 mt-4">
        <Link href="/assets" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10 group">
          <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
        </Link>
        <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
          <Laptop className="w-6 h-6 text-orange-400" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{asset.assetTag} - {asset.name}</h1>
          <p className="text-slate-400 mt-1">Configuration Item (CI) Details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel border border-white/10 rounded-3xl overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
              <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest">Asset Information</h2>
            </div>
            
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Asset Tag</label>
                <div className="text-orange-400 font-mono text-lg">{asset.assetTag}</div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Category</label>
                <div className="text-slate-200 font-medium">{asset.category}</div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Status</label>
                <div className="text-slate-200 font-medium">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    asset.status === 'IN_USE' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 
                    asset.status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}>
                    {asset.status}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Assigned User</label>
                <div className="text-slate-200">{asset.assignee?.name || "Unassigned"}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="glass-panel border border-white/10 rounded-3xl overflow-hidden h-full">
            <div className="px-8 py-6 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
              <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest">Service Graph (CMDB Dependency Map)</h2>
            </div>
            
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px] relative">
              
              {/* Upstream */}
              <div className="flex flex-col items-center space-y-2 mb-8">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Upstream Services</div>
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shadow-lg">
                  <Network className="w-8 h-8 text-indigo-400" />
                </div>
                <span className="text-slate-300 text-sm font-medium">{isServer ? 'Core Network Switch' : 'Corporate VPN Gateway'}</span>
              </div>

              {/* Connecting Line */}
              <div className="w-0.5 h-12 bg-gradient-to-b from-indigo-500/50 to-orange-500/50"></div>

              {/* Current CI */}
              <div className="flex flex-col items-center space-y-2 my-4 relative group">
                <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl group-hover:bg-orange-500/40 transition-all"></div>
                <div className="w-20 h-20 rounded-2xl bg-orange-500/20 border-2 border-orange-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.3)] relative z-10">
                  <Laptop className="w-10 h-10 text-orange-400" />
                </div>
                <span className="text-white font-bold bg-slate-900/80 px-3 py-1 rounded-full border border-white/10 z-10">{asset.name}</span>
              </div>

              {/* Connecting Lines (Split) */}
              <div className="flex w-64 justify-between relative mt-4">
                 <div className="w-1/2 h-0.5 bg-gradient-to-r from-orange-500/50 to-emerald-500/50 absolute left-1/4 top-0"></div>
                 <div className="w-0.5 h-12 bg-gradient-to-b from-orange-500/50 to-emerald-500/50 absolute left-1/4 top-0"></div>
                 <div className="w-0.5 h-12 bg-gradient-to-b from-orange-500/50 to-emerald-500/50 absolute right-1/4 top-0"></div>
              </div>

              {/* Downstream */}
              <div className="flex justify-between w-[320px] mt-12">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-lg hover:-translate-y-1 transition-transform cursor-pointer">
                    <Database className="w-6 h-6 text-emerald-400" />
                  </div>
                  <span className="text-slate-300 text-sm font-medium text-center">Local Storage</span>
                  <span className="text-xs font-bold text-slate-500 uppercase">Downstream</span>
                </div>
                
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center shadow-lg hover:-translate-y-1 transition-transform cursor-pointer">
                    <Server className="w-6 h-6 text-sky-400" />
                  </div>
                  <span className="text-slate-300 text-sm font-medium text-center">Identity Agent</span>
                  <span className="text-xs font-bold text-slate-500 uppercase">Downstream</span>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
