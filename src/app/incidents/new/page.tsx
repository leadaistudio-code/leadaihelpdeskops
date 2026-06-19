import prisma from "@/lib/prisma";
import { createIncident } from "@/app/actions/incidentActions";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function NewIncidentPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  async function handleCreate(formData: FormData) {
    "use server";
    const incident = await createIncident(formData);
    redirect(`/incidents/${incident.id}`);
  }

  return (
    <div className="p-6 h-full overflow-auto bg-slate-50">
      <div className="flex justify-between items-center mb-6 border-b border-slate-300 pb-4">
        <div className="flex items-center space-x-4">
          <Link href="/incidents" className="text-slate-500 hover:text-slate-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </Link>
          <h1 className="text-2xl font-semibold text-slate-800">New Record</h1>
        </div>
      </div>

      <div className="bg-white border border-slate-300 rounded shadow-sm max-w-4xl mx-auto">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-100 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-700 uppercase">Incident Form</h2>
        </div>
        
        <form action={handleCreate} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Caller</label>
              <input type="hidden" name="callerId" value={session.user.id} />
              <input type="text" disabled value={`${session.user.name} (${session.user.role})`} className="w-full px-3 py-2 border border-slate-300 bg-slate-100 rounded shadow-sm text-sm text-slate-500 cursor-not-allowed" />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Priority</label>
              <select name="priority" required className="w-full px-3 py-2 border border-slate-300 rounded shadow-sm focus:outline-none focus:border-blue-500 text-sm">
                <option value="LOW">4 - Low</option>
                <option value="MEDIUM">3 - Moderate</option>
                <option value="HIGH">2 - High</option>
                <option value="CRITICAL">1 - Critical</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-1">Short Description</label>
            <input type="text" name="title" required className="w-full px-3 py-2 border border-slate-300 rounded shadow-sm focus:outline-none focus:border-blue-500 text-sm" />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
            <textarea name="description" rows={6} required className="w-full px-3 py-2 border border-slate-300 rounded shadow-sm focus:outline-none focus:border-blue-500 text-sm"></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded shadow-sm text-sm hover:bg-blue-700 font-bold">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
