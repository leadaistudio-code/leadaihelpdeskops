export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { createAsset } from "@/app/actions/assetActions";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getActiveDomain } from "@/lib/tenant";

export default async function NewAssetPage() {
  const users = await prisma.user.findMany({ where: { domain: await getActiveDomain() } });

  async function handleCreate(formData: FormData) {
    "use server";
    await createAsset(formData);
    redirect("/assets");
  }

  const field = "w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 text-sm transition-colors";
  const label = "block text-sm font-bold text-slate-300 mb-2";

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <div className="flex items-center space-x-4 mb-8 mt-4">
        <Link href="/assets" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </Link>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Register New Asset</h1>
      </div>

      <div className="glass-panel border border-white/10 rounded-3xl max-w-4xl mx-auto overflow-hidden">
        <div className="px-8 py-6 border-b border-white/5 bg-slate-900/50">
          <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest">Asset Details</h2>
        </div>

        <form action={handleCreate} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className={label}>Asset Tag</label>
              <input type="text" name="assetTag" required placeholder="e.g., MAC-2026-001" className={field} />
            </div>

            <div>
              <label className={label}>Status</label>
              <select name="status" required className={field}>
                <option value="IN_STOCK">In Stock</option>
                <option value="IN_USE">In Use</option>
                <option value="RETIRED">Retired</option>
                <option value="MISSING">Missing</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className={label}>Name / Model</label>
              <input type="text" name="name" required placeholder="e.g., MacBook Pro 16-inch M3" className={field} />
            </div>

            <div>
              <label className={label}>Category</label>
              <select name="category" required className={field}>
                <option value="Hardware">Hardware</option>
                <option value="Software License">Software License</option>
                <option value="Peripherals">Peripherals</option>
                <option value="Networking">Networking</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className={label}>Assigned To (Optional)</label>
            <select name="assigneeId" className={field}>
              <option value="">-- Unassigned --</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className={label}>Notes</label>
            <textarea name="notes" rows={4} className={field} placeholder="Any additional information..."></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-white/5">
            <button type="submit" className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] hover:-translate-y-0.5 transition-all font-bold text-sm">
              Register Asset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
