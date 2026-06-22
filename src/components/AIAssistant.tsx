"use client";

import { useState } from "react";

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
      <button
        onClick={handleSuggest}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl shadow-lg text-sm hover:brightness-110 transition-all font-bold disabled:opacity-50"
      >
        <span>✨</span>
        {loading ? "Analyzing…" : "Suggest Resolution"}
      </button>

      {suggestion && (
        <div className="mt-4 p-4 bg-black/20 border border-white/10 rounded-2xl text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">
          {suggestion}
        </div>
      )}
    </div>
  );
}
