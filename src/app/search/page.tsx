export const dynamic = "force-dynamic";

import Link from "next/link";
import { Search, Ticket, Laptop, FileText, SearchX } from "lucide-react";
import { globalSearch } from "@/app/actions/searchActions";
import {
  PageHeader,
  Input,
  Badge,
  statusTone,
  humanize,
  focusRing,
  cn,
} from "@/components/ui";

const resultCard = cn(
  "flex items-center gap-3 p-4 rounded-2xl border border-white/10 bg-white/[0.02]",
  "transition-colors hover:bg-white/[0.04] hover:border-white/15",
  focusRing
);

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const results = q.trim().length >= 2 ? await globalSearch(q) : { incidents: [], assets: [], articles: [] };
  const total = results.incidents.length + results.assets.length + results.articles.length;

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <PageHeader
        title="Search"
        description={q ? `${total} results for "${q}"` : "Search across incidents, assets, and knowledge"}
      />

      <form action="/search" className="mb-10 relative max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
        <Input
          type="text"
          name="q"
          defaultValue={q}
          autoFocus
          placeholder="Search incidents, assets, knowledge…"
          className="pl-12 py-4 text-lg"
        />
      </form>

      {q.trim().length < 2 ? (
        <p className="text-slate-500">Type at least 2 characters to search.</p>
      ) : total === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20">
          <SearchX className="w-12 h-12 text-slate-600 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No results</h2>
          <p className="text-slate-400">Nothing matched &ldquo;{q}&rdquo;. Try a different term.</p>
        </div>
      ) : (
        <div className="space-y-10 max-w-3xl">
          {results.incidents.length > 0 && (
            <Section title="Incidents" icon={<Ticket className="w-4 h-4" />}>
              {results.incidents.map((i) => (
                <Link key={i.id} href={`/incidents/${i.id}`} className={resultCard}>
                  <span className="font-semibold text-slate-100 text-sm">{i.number}</span>
                  <span className="text-slate-200 truncate flex-1">{i.title}</span>
                  <Badge tone={statusTone(i.status)}>{humanize(i.status)}</Badge>
                </Link>
              ))}
            </Section>
          )}
          {results.assets.length > 0 && (
            <Section title="Assets" icon={<Laptop className="w-4 h-4" />}>
              {results.assets.map((a) => (
                <Link key={a.id} href={`/assets/${a.id}`} className={resultCard}>
                  <span className="font-semibold text-slate-100 text-sm">{a.assetTag}</span>
                  <span className="text-slate-200 truncate flex-1">{a.name}</span>
                  <span className="text-xs text-slate-500">{a.category}</span>
                </Link>
              ))}
            </Section>
          )}
          {results.articles.length > 0 && (
            <Section title="Knowledge" icon={<FileText className="w-4 h-4" />}>
              {results.articles.map((a) => (
                <Link key={a.id} href={`/knowledge/${a.id}`} className={resultCard}>
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
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
      <h2 className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        {icon} {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
