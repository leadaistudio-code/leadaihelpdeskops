export const dynamic = "force-dynamic";

import Link from "next/link";
import { Search, Ticket, Laptop, FileText, SearchX } from "lucide-react";
import { globalSearch } from "@/app/actions/searchActions";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const results = q.trim().length >= 2 ? await globalSearch(q) : { incidents: [], assets: [], articles: [] };
  const total = results.incidents.length + results.assets.length + results.articles.length;

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <div className="flex items-center space-x-4 mb-8 mt-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
          <Search className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Search</h1>
          <p className="text-slate-400 mt-1">{q ? `${total} results for "${q}"` : "Search across incidents, assets, and knowledge"}</p>
        </div>
      </div>

      <form action="/search" className="mb-10 relative max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          name="q"
          defaultValue={q}
          autoFocus
          placeholder="Search incidents, assets, knowledge…"
          className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-white/10 text-slate-200 rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder-slate-500 text-lg"
        />
      </form>

      {q.trim().length < 2 ? (
        <p className="text-slate-500">Type at least 2 characters to search.</p>
      ) : total === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20">
          <SearchX className="w-12 h-12 text-slate-600 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No results</h2>
          <p className="text-slate-400">Nothing matched &ldquo;{q}&rdquo;. Try a different term.</p>
        </div>
      ) : (
        <div className="space-y-10 max-w-3xl">
          {results.incidents.length > 0 && (
            <Section title="Incidents" icon={<Ticket className="w-4 h-4" />}>
              {results.incidents.map((i) => (
                <Link key={i.id} href={`/incidents/${i.id}`} className="flex items-center gap-3 p-4 glass-panel border border-white/10 rounded-xl hover:border-indigo-500/40 transition-colors">
                  <span className="font-bold text-indigo-400 text-sm">{i.number}</span>
                  <span className="text-slate-200 truncate flex-1">{i.title}</span>
                  <span className="text-xs text-slate-500 uppercase">{i.status}</span>
                </Link>
              ))}
            </Section>
          )}
          {results.assets.length > 0 && (
            <Section title="Assets" icon={<Laptop className="w-4 h-4" />}>
              {results.assets.map((a) => (
                <Link key={a.id} href={`/assets/${a.id}`} className="flex items-center gap-3 p-4 glass-panel border border-white/10 rounded-xl hover:border-orange-500/40 transition-colors">
                  <span className="font-bold text-orange-400 text-sm">{a.assetTag}</span>
                  <span className="text-slate-200 truncate flex-1">{a.name}</span>
                  <span className="text-xs text-slate-500">{a.category}</span>
                </Link>
              ))}
            </Section>
          )}
          {results.articles.length > 0 && (
            <Section title="Knowledge" icon={<FileText className="w-4 h-4" />}>
              {results.articles.map((a) => (
                <Link key={a.id} href={`/knowledge/${a.id}`} className="flex items-center gap-3 p-4 glass-panel border border-white/10 rounded-xl hover:border-emerald-500/40 transition-colors">
                  <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-200 truncate flex-1">{a.title}</span>
                </Link>
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
        {icon} {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
