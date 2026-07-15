"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { approveRequest, rejectRequest } from "@/app/actions/approvalActions";
import { toast } from "@/components/toast";
import { Button, Input, cn, focusRing } from "@/components/ui";

// Calm emerald "approve" action. Mirrors the Button primitive's shape and focus
// treatment; emerald is the semantic success intent (Button has no success
// variant, so we style it here while keeping the same geometry).
const approveClasses = cn(
  "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-colors duration-150",
  "text-sm px-4 py-2.5 select-none disabled:opacity-50 disabled:pointer-events-none",
  "bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 hover:bg-emerald-500/20",
  focusRing
);

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
        <Input
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)"
        />
        <div className="flex gap-2">
          <Button
            onClick={reject}
            disabled={pending}
            variant="danger"
            icon={X}
            className="flex-1"
          >
            Confirm Reject
          </Button>
          <Button
            onClick={() => setRejecting(false)}
            disabled={pending}
            variant="secondary"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 shrink-0">
      <button onClick={approve} disabled={pending} className={approveClasses}>
        <Check className="w-4 h-4" aria-hidden /> Approve
      </button>
      <Button
        onClick={() => setRejecting(true)}
        disabled={pending}
        variant="secondary"
        icon={X}
      >
        Reject
      </Button>
    </div>
  );
}
