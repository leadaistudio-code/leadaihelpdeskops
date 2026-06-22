export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-utils";
import DeflectionPanel from "@/components/DeflectionPanel";
import NewIncidentForm from "@/components/NewIncidentForm";

export default async function NewIncidentPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <div className="flex items-center space-x-4 mb-8 mt-4">
        <Link href="/incidents" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </Link>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">New Incident</h1>
      </div>

      <DeflectionPanel />

      <div className="glass-panel border border-white/10 rounded-3xl max-w-4xl mx-auto overflow-hidden">
        <div className="px-8 py-6 border-b border-white/5 bg-slate-900/50">
          <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest">Incident Form</h2>
        </div>
        <NewIncidentForm user={{ id: user.id, name: user.name, role: user.role }} />
      </div>
    </div>
  );
}
