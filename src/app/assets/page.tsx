export const dynamic = "force-dynamic";

import Link from "next/link";
import { getAssets } from "@/app/actions/assetActions";
import { Laptop, Plus } from "lucide-react";
import EmptyState from "@/components/EmptyState";

export default async function AssetsPage() {
  const assets = await getAssets();

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 mt-4 gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Laptop className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Asset Management</h1>
            <p className="text-slate-400 mt-1">Hardware and software inventory</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link href="/assets/new" className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] hover:-translate-y-0.5 transition-all font-bold">
            <Plus className="w-4 h-4" />
            <span>New Asset</span>
          </Link>
        </div>
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden border border-white/10">
        <div className="px-8 py-6 border-b border-white/5 bg-slate-900/50">
          <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest">Asset Registry</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs text-slate-500 bg-black/20 uppercase tracking-wider">
              <tr>
                <th className="px-8 py-4 font-bold">Asset Tag</th>
                <th className="px-8 py-4 font-bold">Name</th>
                <th className="px-8 py-4 font-bold">Category</th>
                <th className="px-8 py-4 font-bold">Status</th>
                <th className="px-8 py-4 font-bold">Assigned To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={Laptop}
                      title="No assets registered"
                      description="Add your first hardware or software asset to start tracking inventory, assignments, and lifecycle."
                      ctaHref="/assets/new"
                      ctaLabel="New Asset"
                      accent="text-orange-400"
                    />
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-white/5 transition-colors group cursor-pointer">
                    <td className="px-8 py-5">
                      <Link href={`/assets/${asset.id}`} className="font-bold text-orange-400 group-hover:text-orange-300">
                        {asset.assetTag}
                      </Link>
                    </td>
                    <td className="px-8 py-5 font-medium text-slate-200">{asset.name}</td>
                    <td className="px-8 py-5 text-slate-400">{asset.category}</td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        asset.status === 'IN_USE' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 
                        asset.status === 'IN_STOCK' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sky-400 font-medium">
                      {asset.assignee?.name || "Unassigned"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
