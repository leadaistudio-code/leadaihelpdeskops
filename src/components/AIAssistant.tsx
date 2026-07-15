"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui";

export default function AIAssistant({ title, description }: { title: string, description: string }) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSuggest = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const data = await res.json();
      if (data.suggestion) setSuggestion(data.suggestion);
      else setSuggestion("Failed to generate suggestion.");
    } catch (e) {
      setSuggestion("Error connecting to AI.");
    }
    setLoading(false);
  };

  return (
    <div>
      <Button
        onClick={handleSuggest}
        loading={loading}
        icon={Sparkles}
        className="w-full"
      >
        {loading ? "Analyzing…" : "Suggest Resolution"}
      </Button>

      {suggestion && (
        <div className="mt-4 p-4 bg-white/[0.02] border border-white/10 rounded-2xl text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">
          {suggestion}
        </div>
      )}
    </div>
  );
}
