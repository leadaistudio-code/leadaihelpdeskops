export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getCatalogItemById } from "@/app/actions/catalogActions";
import CatalogIcon from "@/components/CatalogIcon";
import CatalogRequestForm from "@/components/CatalogRequestForm";

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
      <div className="flex items-center space-x-4 mb-10 mt-4">
        <Link href="/catalog" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10 group">
          <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
        </Link>
        <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
          <CatalogIcon icon={item.icon} className="w-6 h-6 text-violet-300" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{item.name}</h1>
          <p className="text-slate-400 mt-1">{item.category} Request</p>
        </div>
      </div>

      <CatalogRequestForm itemId={item.id} description={item.description} requiresApproval={requiresApproval} />
    </div>
  );
}
