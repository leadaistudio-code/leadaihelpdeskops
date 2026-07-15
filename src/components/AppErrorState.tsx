"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Panel, Button } from "@/components/ui";

// Shared client-side error boundary UI for app route segments. Next.js passes
// the thrown error plus a reset() to re-render the segment.
export default function AppErrorState({
  error,
  reset,
  area = "this page",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  area?: string;
}) {
  useEffect(() => {
    // Surface to the console (and any future monitoring hook) for debugging.
    console.error(error);
  }, [error]);

  return (
    <div className="h-full flex items-center justify-center p-8">
      <Panel className="p-10 max-w-md text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center mb-6">
          <AlertTriangle className="w-7 h-7 text-rose-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Something went wrong loading {area}</h2>
        <p className="text-sm text-slate-400 mb-8">
          An unexpected error occurred. You can retry, or head back to your dashboard.
        </p>
        {error.digest && (
          <p className="text-xs text-slate-600 font-mono mb-6">Ref: {error.digest}</p>
        )}
        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset} icon={RotateCw}>
            Try again
          </Button>
          <Button href="/dashboard" variant="secondary">
            Go to Dashboard
          </Button>
        </div>
      </Panel>
    </div>
  );
}
