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
    <div className="mt-8 bg-indigo-50 border border-indigo-200 rounded p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-indigo-900 flex items-center">
          <span className="mr-2">✨</span> AI Resolution Assistant
        </h3>
        <button 
          onClick={handleSuggest} 
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded shadow-sm text-sm hover:bg-indigo-700 font-bold disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Suggest Resolution"}
        </button>
      </div>
      
      {suggestion && (
        <div className="mt-4 p-4 bg-white border border-indigo-100 rounded text-slate-800 whitespace-pre-wrap text-sm">
          {suggestion}
        </div>
      )}
    </div>
  );
}
