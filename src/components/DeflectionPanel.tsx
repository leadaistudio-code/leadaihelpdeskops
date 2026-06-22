"use client";

import { useState } from "react";
import { Sparkles, FileText, ArrowRight, Search } from "lucide-react";
import Link from "next/link";

type Match = { id: string; title: string; excerpt: string };

// Pre-ticket self-service: the user describes their issue and we surface
// matching KB articles plus an AI answer, deflecting routine L1 tickets.
export default function DeflectionPanel() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [articles, setArticles] = useState<Match[]>([]);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (query.trim().length < 4) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch("/api/ai/deflect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setAnswer(data.answer ?? null);
      setArticles(data.articles ?? []);
    } catch {
      setAnswer("Couldn't reach the assistant. You can still file a ticket below.");
      setArticles([]);
    }
    setLoading(false);
  };

  return (
    <div className="glass-panel border border-indigo-500/20 rounded-3xl max-w-4xl mx-auto overflow-hidden mb-6">
      <div className="px-8 py-6 border-b border-white/5 bg-indigo-500/5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-sm font-black text-slate-200 uppercase tracking-widest">Before you file — try AI self-service</h2>
          <p className="text-xs text-slate-500 mt-0.5">Many issues resolve instantly from the knowledge base.</p>
        </div>
      </div>

      <div className="p-8">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="Describe your issue, e.g. 'can't connect to VPN'"
              className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 text-sm transition-colors"
            />
          </div>
          <button
            onClick={search}
            disabled={loading || query.trim().length < 4}
            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl shadow-lg hover:brightness-110 transition-all font-bold text-sm disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? "Searching…" : "Get Help"}
          </button>
        </div>

        {searched && !loading && (
          <div className="mt-6 space-y-4">
            {answer && (
              <div className="p-5 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
                <div className="flex items-center gap-2 mb-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" /> AI Suggestion
                </div>
                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{answer}</p>
              </div>
            )}

            {articles.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Related articles</p>
                {articles.map((a) => (
                  <Link
                    key={a.id}
                    href={`/knowledge/${a.id}`}
                    target="_blank"
                    className="flex items-start gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:border-indigo-500/40 hover:bg-white/[0.07] transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-200 group-hover:text-white truncate">{a.title}</div>
                      <div className="text-xs text-slate-500 line-clamp-1">{a.excerpt}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 shrink-0 mt-0.5" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No matching articles found. Go ahead and file the ticket below — our AI will triage it.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
