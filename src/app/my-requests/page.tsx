export const dynamic = "force-dynamic";

import Link from "next/link";
import { ShoppingBag, ExternalLink } from "lucide-react";
import { getMyCatalogRequests } from "@/app/actions/catalogActions";
import CatalogIcon from "@/components/CatalogIcon";
import EmptyState from "@/components/EmptyState";

const STATUS_STYLE: Record<string, string> = {
  REQUESTED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  REJECTED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  FULFILLED: "bg-sky-500/10 text-sky-400 border-sky-500/20",
};

export default async function MyRequestsPage() {
  const requests = await getMyCatalogRequests();

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <div className="flex items-center space-x-4 mb-10 mt-4">
        <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
          <ShoppingBag className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">My Requests</h1>
          <p className="text-slate-400 mt-1">Track the status of your catalogue orders</p>
        </div>
        <Link
          href="/catalog"
          className="ml-auto px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl shadow-lg hover:brightness-110 transition-all font-bold text-sm"
        >
          Browse Catalog
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="glass-panel rounded-3xl border border-white/10">
          <EmptyState
            icon={ShoppingBag}
            title="No requests yet"
            description="When you order from the service catalogue, your requests and their status will show up here."
            ctaHref="/catalog"
            ctaLabel="Browse Catalog"
            accent="text-violet-400"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="glass-panel border border-white/10 rounded-2xl p-6 flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
                <CatalogIcon icon={r.item.icon} className="w-6 h-6 text-violet-300" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-white truncate">{r.item.name}</h3>
                <p className="text-sm text-slate-400">
                  {r.item.category} · Requested {r.createdAt.toLocaleDateString()}
                </p>
                {r.notes && <p className="text-xs text-slate-500 mt-1 line-clamp-1">&ldquo;{r.notes}&rdquo;</p>}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${STATUS_STYLE[r.status] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
                {r.status}
              </span>
              {r.incidentId && (
                <Link
                  href={`/incidents/${r.incidentId}`}
                  className="flex items-center gap-1.5 text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors shrink-0"
                >
                  View ticket <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
