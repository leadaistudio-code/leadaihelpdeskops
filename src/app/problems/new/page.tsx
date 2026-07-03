export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { createProblem } from "@/app/actions/problemActions";
import type { Priority } from "@prisma/client";
import { ChevronLeft, Boxes } from "lucide-react";

export default function NewProblemPage() {
  async function handleCreate(formData: FormData) {
    "use server";
    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string)?.trim();
    const priority = (formData.get("priority") as Priority) || "MEDIUM";
    if (!title || !description) return;
    const problem = await createProblem({ title, description, priority });
    redirect(`/problems/${problem.id}`);
  }

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <div className="flex items-center space-x-4 mb-10 mt-4">
        <Link href="/problems" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10 group">
          <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
        </Link>
        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
          <Boxes className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">New Problem</h1>
          <p className="text-slate-400 mt-1">Open a root-cause investigation.</p>
        </div>
      </div>

      <div className="max-w-2xl glass-panel rounded-3xl border border-white/10 p-8">
        <form action={handleCreate} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Title</label>
            <input required name="title" type="text" placeholder="e.g. Intermittent VPN drops for remote staff" className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Description</label>
            <textarea required name="description" rows={6} placeholder="Symptoms, affected services, and the pattern of incidents…" className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Priority</label>
            <select name="priority" defaultValue="MEDIUM" className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
          <button type="submit" className="w-full py-3 bg-gradient-to-r from-[#12B489] to-[#0E9E77] text-[#03130d] font-bold rounded-xl shadow-[0_0_20px_rgba(56,232,176,0.3)] hover:-translate-y-0.5 transition-all">
            Create Problem
          </button>
        </form>
      </div>
    </div>
  );
}
