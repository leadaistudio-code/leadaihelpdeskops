"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import { createCatalogRequest } from "@/app/actions/catalogActions";
import { toast } from "@/components/toast";

export default function CatalogRequestForm({
  itemId,
  description,
  requiresApproval,
}: {
  itemId: string;
  description: string;
  requiresApproval: boolean;
}) {
  const [justification, setJustification] = useState("");
  const [pending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim()) return;
    startTransition(async () => {
      try {
        await createCatalogRequest(itemId, justification);
        toast("Request submitted");
        setSuccess(true);
      } catch {
        toast("Couldn't submit request", "error");
      }
    });
  };

  if (success) {
    return (
      <div className="max-w-3xl glass-panel p-10 rounded-3xl border border-emerald-500/30 text-center shadow-[0_0_50px_rgba(16,185,129,0.2)]">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Request Submitted</h2>
        <p className="text-slate-400 mb-8 leading-relaxed">
          {requiresApproval ? (
            <>Your request has been routed to the <strong className="text-amber-400">Approvals Queue</strong>. You&apos;ll be notified once it&apos;s approved.</>
          ) : (
            <>Your request has been received and is being processed by the IT team.</>
          )}
        </p>
        <Link href="/catalog" className="inline-block px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors border border-white/10">
          Return to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl glass-panel border border-white/10 rounded-3xl overflow-hidden">
      <div className="px-8 py-6 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
        <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest">Order Details</h2>
        {requiresApproval && (
          <span className="flex items-center space-x-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-400 uppercase">Approval Required</span>
          </span>
        )}
      </div>

      <form onSubmit={submit} className="p-8">
        <p className="text-slate-300 mb-8 leading-relaxed text-lg bg-white/5 p-6 rounded-2xl border border-white/5">
          {description}
        </p>

        <div className="mb-8">
          <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Business Justification</label>
          <textarea
            required
            rows={4}
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            className="w-full px-5 py-4 bg-slate-900/50 border border-white/10 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all placeholder-slate-500 shadow-inner resize-none"
            placeholder="Why do you need this item or access? Be specific."
          />
        </div>

        <div className="flex justify-end pt-6 border-t border-white/5">
          <button
            type="submit"
            disabled={pending || !justification.trim()}
            className="px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 transition-all font-bold disabled:opacity-50 flex items-center space-x-2"
          >
            {requiresApproval ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            <span>{pending ? "Submitting…" : requiresApproval ? "Submit for Approval" : "Order Now"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
