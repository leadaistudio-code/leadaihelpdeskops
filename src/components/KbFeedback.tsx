"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, CheckCircle2 } from "lucide-react";

export default function KbFeedback({ initialViews }: { initialViews: number }) {
  const [hasVoted, setHasVoted] = useState(false);
  const [views, setViews] = useState(initialViews + 1);

  const handleVote = () => {
    setHasVoted(true);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-slate-900/50 rounded-2xl border border-white/5 mt-10">
      <div className="mb-4 sm:mb-0">
        <h3 className="text-white font-bold text-lg">Was this article helpful?</h3>
        <p className="text-slate-400 text-sm mt-1">Your feedback helps us improve our knowledge base.</p>
      </div>
      
      {hasVoted ? (
        <div className="flex items-center space-x-2 text-emerald-400 font-bold bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
          <CheckCircle2 className="w-5 h-5" />
          <span>Thank you for your feedback!</span>
        </div>
      ) : (
        <div className="flex space-x-3">
          <button onClick={handleVote} className="flex items-center space-x-2 px-6 py-2 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/30 text-slate-300 font-bold rounded-xl border border-white/10 transition-colors">
            <ThumbsUp className="w-4 h-4" />
            <span>Yes</span>
          </button>
          <button onClick={handleVote} className="flex items-center space-x-2 px-6 py-2 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30 text-slate-300 font-bold rounded-xl border border-white/10 transition-colors">
            <ThumbsDown className="w-4 h-4" />
            <span>No</span>
          </button>
        </div>
      )}
    </div>
  );
}
