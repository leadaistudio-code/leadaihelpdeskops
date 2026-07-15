export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getCatalogItemById } from "@/app/actions/catalogActions";
import CatalogRequestForm from "@/components/CatalogRequestForm";
import { PageHeader, Button } from "@/components/ui";

const APPROVAL_CATEGORIES = new Set(["Access"]);

export default async function CatalogItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getCatalogItemById(id);

  if (!item) {
    notFound();
  }

  const requiresApproval = APPROVAL_CATEGORIES.has(item.category);

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <Button href="/catalog" variant="ghost" size="sm" icon={ChevronLeft} className="-ml-2 mb-4">
        Back to Catalog
      </Button>

      <PageHeader eyebrow={`${item.category} Request`} title={item.name} />

      <CatalogRequestForm itemId={item.id} description={item.description} requiresApproval={requiresApproval} formSchema={item.formSchema as any[]} />
    </div>
  );
}
