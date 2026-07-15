export const dynamic = "force-dynamic";

import { Library } from "lucide-react";
import { getCatalogItems } from "@/app/actions/catalogActions";
import CatalogBrowser from "@/components/CatalogBrowser";
import EmptyState from "@/components/EmptyState";
import { PageHeader, Panel } from "@/components/ui";

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
      <PageHeader
        title="Service Catalog"
        description="Order hardware, request software or access, and get help — browse by category or search."
      />

      {items.length === 0 ? (
        <Panel>
          <EmptyState
            icon={Library}
            title="The catalogue is empty"
            description="No catalogue items are currently available. Check back soon."
            accent="text-slate-400"
          />
        </Panel>
      ) : (
        <CatalogBrowser items={items} />
      )}
    </div>
  );
}
