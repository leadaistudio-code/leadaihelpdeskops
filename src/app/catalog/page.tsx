export const dynamic = "force-dynamic";

import { Library } from "lucide-react";
import { getCatalogItems } from "@/app/actions/catalogActions";
import CatalogBrowser from "@/components/CatalogBrowser";
import EmptyState from "@/components/EmptyState";

// Categories whose requests route through an approval step (kept in sync with
// APPROVAL_CATEGORIES in catalogActions).
const APPROVAL_CATEGORIES = new Set(["Access"]);

export default async function CatalogPage() {
  const raw = await getCatalogItems();
  const items = raw.map((i) => ({
    id: i.id,
    name: i.name,
    description: i.description,
    category: i.category,
    icon: i.icon,
    price: i.price,
    requiresApproval: APPROVAL_CATEGORIES.has(i.category),
  }));

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <div className="flex items-center space-x-4 mb-10 mt-4">
        <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
          <Library className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Service Catalog</h1>
          <p className="text-slate-400 mt-1">Order hardware, request software or access, and get help — browse by category or search.</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="glass-panel rounded-3xl border border-white/10">
          <EmptyState
            icon={Library}
            title="The catalogue is empty"
            description="No catalogue items are currently available. Check back soon."
            accent="text-violet-400"
          />
        </div>
      ) : (
        <CatalogBrowser items={items} />
      )}
    </div>
  );
}
