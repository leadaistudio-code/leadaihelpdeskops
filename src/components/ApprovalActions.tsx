"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { approveRequest, rejectRequest } from "@/app/actions/approvalActions";
import { toast } from "@/components/toast";

export default function ApprovalActions({ incidentId }: { incidentId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const approve = () =>
    startTransition(async () => {
      try {
        await approveRequest(incidentId);
        toast("Request approved");
        router.refresh();
      } catch {
        toast("Couldn't approve request", "error");
      }
    });

  const reject = () =>
    startTransition(async () => {
      try {
        await rejectRequest(incidentId, reason);
        toast("Request rejected");
        router.refresh();
      } catch {
        toast("Couldn't reject request", "error");
      }
    });

  if (rejecting) {
    return (
      <div className="flex flex-col gap-2 w-full sm:w-80">
        <input
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)"
          className="px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-rose-500"
        />
        <div className="flex gap-2">
          <button
            onClick={reject}
            disabled={pending}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" /> Confirm Reject
          </button>
          <button
            onClick={() => setRejecting(false)}
            disabled={pending}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 shrink-0">
      <button
        onClick={approve}
        disabled={pending}
        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
      >
        <Check className="w-4 h-4" /> Approve
      </button>
      <button
        onClick={() => setRejecting(true)}
        disabled={pending}
        className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-rose-600/20 text-slate-300 hover:text-rose-300 border border-white/10 rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
      >
        <X className="w-4 h-4" /> Reject
      </button>
    </div>
  );
}
