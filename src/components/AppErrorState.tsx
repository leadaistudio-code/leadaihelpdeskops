"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

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
      <div className="glass-panel border border-rose-500/20 rounded-3xl p-10 max-w-md text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center mb-6">
          <AlertTriangle className="w-7 h-7 text-rose-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Something went wrong loading {area}</h2>
        <p className="text-sm text-slate-400 mb-8">
          An unexpected error occurred. You can retry, or head back to your dashboard.
        </p>
        {error.digest && (
          <p className="text-xs text-slate-600 font-mono mb-6">Ref: {error.digest}</p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors"
          >
            <RotateCw className="w-4 h-4" /> Try again
          </button>
          <a
            href="/dashboard"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold rounded-xl transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
