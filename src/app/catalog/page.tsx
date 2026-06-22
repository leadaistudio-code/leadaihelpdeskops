export const dynamic = "force-dynamic";

import Link from "next/link";
import { Library } from "lucide-react";
import { getCatalogItems } from "@/app/actions/catalogActions";
import CatalogIcon from "@/components/CatalogIcon";
import EmptyState from "@/components/EmptyState";

export default async function CatalogPage() {
  const items = await getCatalogItems();

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <div className="flex items-center space-x-4 mb-10 mt-4">
        <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
          <Library className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Service Catalog</h1>
          <p className="text-slate-400 mt-1">Order hardware, request software access, or get help.</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/catalog/${item.id}`}
              className="glass-panel rounded-3xl p-8 hover:bg-white/5 transition-all group border border-white/5 hover:border-violet-500/30 flex flex-col hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <CatalogIcon icon={item.icon} className="w-7 h-7 text-violet-300" />
              </div>
              <div className="inline-flex w-fit px-2.5 py-0.5 bg-white/5 text-slate-400 text-[10px] font-bold rounded uppercase tracking-wider border border-white/10 mb-3">
                {item.category}
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{item.name}</h2>
              <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
