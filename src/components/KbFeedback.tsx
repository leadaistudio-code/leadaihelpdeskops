"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, CheckCircle2 } from "lucide-react";
import { Panel, Button, Badge } from "@/components/ui";

export default function KbFeedback({ initialViews }: { initialViews: number }) {
  const [hasVoted, setHasVoted] = useState(false);
  const [views, setViews] = useState(initialViews + 1);

  const handleVote = () => {
    setHasVoted(true);
  };

  return (
    <Panel className="flex flex-col sm:flex-row sm:items-center justify-between p-6 mt-10">
      <div className="mb-4 sm:mb-0">
        <h3 className="text-lg font-semibold text-white">Was this article helpful?</h3>
        <p className="text-slate-400 text-sm mt-1">Your feedback helps us improve our knowledge base.</p>
      </div>

      {hasVoted ? (
        <Badge tone="success">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Thank you for your feedback!
        </Badge>
      ) : (
        <div className="flex gap-3">
          <Button onClick={handleVote} variant="secondary" icon={ThumbsUp}>
            Yes
          </Button>
          <Button onClick={handleVote} variant="secondary" icon={ThumbsDown}>
            No
          </Button>
        </div>
      )}
    </Panel>
  );
}
