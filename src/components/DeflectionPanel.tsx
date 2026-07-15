"use client";

import { useState } from "react";
import { Sparkles, FileText, ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { Panel, Button, Input, cn, focusRing } from "@/components/ui";

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
    <Panel className="max-w-4xl mx-auto overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-slate-300" />
        </div>
        <div>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Before you file — try AI self-service</h2>
          <p className="text-xs text-slate-500 mt-0.5">Many issues resolve instantly from the knowledge base.</p>
        </div>
      </div>

      <div className="p-8">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="Describe your issue, e.g. 'can't connect to VPN'"
              className="pl-11"
            />
          </div>
          <Button
            onClick={search}
            disabled={loading || query.trim().length < 4}
            loading={loading}
            className="whitespace-nowrap"
          >
            {loading ? "Searching…" : "Get Help"}
          </Button>
        </div>

        {searched && !loading && (
          <div className="mt-6 space-y-4">
            {answer && (
              <div className="p-5 bg-white/[0.02] border border-white/10 rounded-2xl">
                <div className="flex items-center gap-2 mb-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" /> AI Suggestion
                </div>
                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{answer}</p>
              </div>
            )}

            {articles.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Related articles</p>
                {articles.map((a) => (
                  <Link
                    key={a.id}
                    href={`/knowledge/${a.id}`}
                    target="_blank"
                    className={cn("flex items-start gap-3 p-4 bg-white/[0.02] border border-white/10 rounded-xl hover:border-white/15 hover:bg-white/[0.04] transition-colors group", focusRing)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-slate-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-200 group-hover:text-[#00926f] truncate transition-colors">{a.title}</div>
                      <div className="text-xs text-slate-500 line-clamp-1">{a.excerpt}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 shrink-0 mt-0.5" />
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
    </Panel>
  );
}
