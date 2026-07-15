export const dynamic = "force-dynamic";

import Link from "next/link";
import { ShoppingBag, ExternalLink } from "lucide-react";
import { getMyCatalogRequests } from "@/app/actions/catalogActions";
import CatalogIcon from "@/components/CatalogIcon";
import EmptyState from "@/components/EmptyState";
import {
  PageHeader,
  Button,
  Panel,
  Badge,
  focusRing,
  cn,
} from "@/components/ui";
import type { BadgeTone } from "@/components/ui";

const STATUS_TONE: Record<string, BadgeTone> = {
  REQUESTED: "warning",
  APPROVED: "success",
  REJECTED: "critical",
  FULFILLED: "info",
};

export default async function MyRequestsPage() {
  const requests = await getMyCatalogRequests();

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <PageHeader
        title="My Requests"
        description="Track the status of your catalogue orders"
        action={
          <Button href="/catalog" variant="secondary">
            Browse Catalog
          </Button>
        }
      />

      {requests.length === 0 ? (
        <Panel>
          <EmptyState
            icon={ShoppingBag}
            title="No requests yet"
            description="When you order from the service catalogue, your requests and their status will show up here."
            ctaHref="/catalog"
            ctaLabel="Browse Catalog"
          />
        </Panel>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <Panel key={r.id} padded className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <CatalogIcon icon={r.item.icon} className="w-6 h-6 text-slate-300" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-white truncate">{r.item.name}</h3>
                <p className="text-sm text-slate-400">
                  {r.item.category} · Requested {r.createdAt.toLocaleDateString()}
                </p>
                {r.notes && <p className="text-xs text-slate-500 mt-1 line-clamp-1">&ldquo;{r.notes}&rdquo;</p>}
              </div>
              <Badge tone={STATUS_TONE[r.status] ?? "neutral"}>{r.status}</Badge>
              {r.incidentId && (
                <Link
                  href={`/incidents/${r.incidentId}`}
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-semibold text-slate-100 hover:text-[#00926f] transition-colors shrink-0 rounded-sm",
                    focusRing
                  )}
                >
                  View ticket <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
