export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { createAsset } from "@/app/actions/assetActions";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function NewAssetPage() {
  const users = await prisma.user.findMany();

  async function handleCreate(formData: FormData) {
    "use server";
    await createAsset(formData);
    redirect("/assets");
  }

  return (
    <div className="p-6 h-full overflow-auto bg-slate-50">
      <div className="flex justify-between items-center mb-6 border-b border-slate-300 pb-4">
        <div className="flex items-center space-x-4">
          <Link href="/assets" className="text-slate-500 hover:text-slate-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </Link>
          <h1 className="text-2xl font-semibold text-slate-800">Register New Asset</h1>
        </div>
      </div>

      <div className="bg-white border border-slate-300 rounded shadow-sm max-w-4xl mx-auto">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-100 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-700 uppercase">Asset Details</h2>
        </div>
        
        <form action={handleCreate} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Asset Tag</label>
              <input type="text" name="assetTag" required placeholder="e.g., MAC-2026-001" className="w-full px-3 py-2 border border-slate-300 rounded shadow-sm focus:outline-none focus:border-blue-500 text-sm" />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
              <select name="status" required className="w-full px-3 py-2 border border-slate-300 rounded shadow-sm focus:outline-none focus:border-blue-500 text-sm">
                <option value="IN_STOCK">In Stock</option>
                <option value="IN_USE">In Use</option>
                <option value="RETIRED">Retired</option>
                <option value="MISSING">Missing</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Name / Model</label>
              <input type="text" name="name" required placeholder="e.g., MacBook Pro 16-inch M3" className="w-full px-3 py-2 border border-slate-300 rounded shadow-sm focus:outline-none focus:border-blue-500 text-sm" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
              <select name="category" required className="w-full px-3 py-2 border border-slate-300 rounded shadow-sm focus:outline-none focus:border-blue-500 text-sm">
                <option value="Hardware">Hardware</option>
                <option value="Software License">Software License</option>
                <option value="Peripherals">Peripherals</option>
                <option value="Networking">Networking</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-1">Assigned To (Optional)</label>
            <select name="assigneeId" className="w-full px-3 py-2 border border-slate-300 rounded shadow-sm focus:outline-none focus:border-blue-500 text-sm">
              <option value="">-- Unassigned --</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-1">Notes</label>
            <textarea name="notes" rows={4} className="w-full px-3 py-2 border border-slate-300 rounded shadow-sm focus:outline-none focus:border-blue-500 text-sm" placeholder="Any additional information..."></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded shadow-sm text-sm hover:bg-blue-700 font-bold">
              Register Asset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
