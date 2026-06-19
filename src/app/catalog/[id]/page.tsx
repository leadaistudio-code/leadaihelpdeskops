"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle2, ShieldAlert, Library, Clock } from "lucide-react";
import { createIncident } from "@/app/actions/incidentActions";

const catalogDB = {
  "laptop-macbook": { name: "Apple MacBook Pro 16\"", category: "Hardware", desc: "Request a standard developer laptop. Requires manager approval.", requiresApproval: true },
  "monitor-dell": { name: "Dell 27\" 4K Monitor", category: "Hardware", desc: "Request an additional external display.", requiresApproval: false },
  "soft-office": { name: "Microsoft Office 365", category: "Software", desc: "Request a license for Word, Excel, PowerPoint.", requiresApproval: false },
  "soft-adobe": { name: "Adobe Creative Cloud", category: "Software", desc: "Request access to Photoshop, Illustrator, etc. Requires approval and business justification.", requiresApproval: true },
  "access-vpn": { name: "VPN Access", category: "Access", desc: "Request remote access to corporate network. Subject to security review.", requiresApproval: true },
  "help-generic": { name: "Report an Issue", category: "Help", desc: "Can't find what you need? Report a generic issue.", requiresApproval: false },
  "admin-rights": { name: "Global Admin Rights", category: "Access", desc: "Request elevated administrative privileges across the domain.", requiresApproval: true },
};

export default function CatalogItemPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [justification, setJustification] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const resolvedParams = use(params as any) as { id: string };
  const id = resolvedParams.id as keyof typeof catalogDB;
  const item = catalogDB[id];

  if (!item) {
    return <div className="p-8 text-white">Item not found.</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // We create a ticket, but if requiresApproval is true, we set priority high or state to ON_HOLD to simulate pending approval
    const title = `Request for ${item.name}`;
    const description = `Category: ${item.category}\nJustification:\n${justification}\n\nApproval Required: ${item.requiresApproval}`;
    
    await createIncident({
      title,
      description,
      priority: item.requiresApproval ? "HIGH" : "MEDIUM",
      type: "REQUEST",
      status: item.requiresApproval ? "PENDING_APPROVAL" : "NEW",
    });

    setSuccess(true);
    setIsSubmitting(false);
  };

  if (success) {
    return (
      <div className="p-8 h-full flex items-center justify-center relative z-10">
        <div className="glass-panel p-10 rounded-3xl border border-emerald-500/30 text-center max-w-md w-full shadow-[0_0_50px_rgba(16,185,129,0.2)]">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Request Submitted</h2>
          {item.requiresApproval ? (
            <p className="text-slate-400 mb-8 leading-relaxed">Your request has been routed to the <strong className="text-amber-400">Approvals Queue</strong>. You will be notified once a manager approves your request.</p>
          ) : (
            <p className="text-slate-400 mb-8 leading-relaxed">Your request has been received and is being processed by the IT team.</p>
          )}
          <Link href="/catalog" className="inline-block px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors border border-white/10">
            Return to Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <div className="flex items-center space-x-4 mb-10 mt-4">
        <Link href="/catalog" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10 group">
          <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
        </Link>
        <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
          <Library className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{item.name}</h1>
          <p className="text-slate-400 mt-1">{item.category} Request</p>
        </div>
      </div>

      <div className="max-w-3xl glass-panel border border-white/10 rounded-3xl overflow-hidden">
        <div className="px-8 py-6 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
          <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest">Order Details</h2>
          {item.requiresApproval && (
            <span className="flex items-center space-x-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-400 uppercase">Approval Required</span>
            </span>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="p-8">
          <p className="text-slate-300 mb-8 leading-relaxed text-lg bg-white/5 p-6 rounded-2xl border border-white/5">
            {item.desc}
          </p>

          <div className="mb-8">
            <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Business Justification</label>
            <textarea 
              required
              rows={4}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="w-full px-5 py-4 bg-slate-900/50 border border-slate-700/50 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all placeholder-slate-600 shadow-inner resize-none"
              placeholder="Why do you need this item or access? Be specific."
            ></textarea>
          </div>

          <div className="flex justify-end pt-6 border-t border-white/5">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 transition-all font-bold disabled:opacity-50 flex items-center space-x-2"
            >
              {item.requiresApproval ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              <span>{isSubmitting ? "Submitting..." : (item.requiresApproval ? "Submit for Approval" : "Order Now")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
