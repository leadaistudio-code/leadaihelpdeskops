export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { Laptop, Server, Network, Database, ChevronLeft } from "lucide-react";
import { getAssetById } from "@/app/actions/assetActions";
import {
  PageHeader,
  Button,
  Panel,
  PanelHeader,
  Badge,
  humanize,
  type BadgeTone,
} from "@/components/ui";

function assetStatusTone(status: string): BadgeTone {
  switch (status) {
    case "IN_USE":
      return "info";
    case "IN_STOCK":
      return "success";
    case "MISSING":
      return "warning";
    default:
      return "neutral";
  }
}

export default async function AssetCMDBPage({ params }: { params: { id: string } }) {
  // Fix for Next.js 15+
  const id = (await Promise.resolve(params)).id;

  // Domain-scoped lookup so cross-tenant assets aren't reachable by id.
  const asset = await getAssetById(id);

  if (!asset) {
    notFound();
  }

  // Simulate upstream/downstream relationships based on category
  const isServer = asset.category === "Server" || asset.name.includes("Server");

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <PageHeader
        title={`${asset.assetTag} - ${asset.name}`}
        description="Configuration Item (CI) Details"
        action={
          <Button href="/assets" variant="secondary" icon={ChevronLeft}>
            Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Panel padded={false}>
            <PanelHeader title="Asset Information" />
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Asset Tag</label>
                <div className="text-slate-100 font-mono text-lg">{asset.assetTag}</div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Category</label>
                <div className="text-slate-200 font-medium">{asset.category}</div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Status</label>
                <div>
                  <Badge tone={assetStatusTone(asset.status)}>{humanize(asset.status)}</Badge>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Assigned User</label>
                <div className="text-slate-200">{asset.assignee?.name || "Unassigned"}</div>
              </div>
            </div>
          </Panel>
        </div>

        <div className="lg:col-span-2">
          <Panel padded={false} className="h-full">
            <PanelHeader title="Service Graph (CMDB Dependency Map)" />
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
              {/* Upstream */}
              <div className="flex flex-col items-center space-y-2 mb-8">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Upstream Services</div>
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Network className="w-8 h-8 text-slate-300" />
                </div>
                <span className="text-slate-300 text-sm font-medium">{isServer ? "Core Network Switch" : "Corporate VPN Gateway"}</span>
              </div>

              {/* Connecting Line */}
              <div className="w-0.5 h-12 bg-white/10"></div>

              {/* Current CI */}
              <div className="flex flex-col items-center space-y-2 my-4">
                <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center">
                  <Laptop className="w-10 h-10 text-slate-200" />
                </div>
                <span className="text-white font-semibold bg-white/5 px-3 py-1 rounded-full border border-white/10">{asset.name}</span>
              </div>

              {/* Connecting Lines (Split) */}
              <div className="flex w-64 justify-between relative mt-4">
                <div className="w-1/2 h-0.5 bg-white/10 absolute left-1/4 top-0"></div>
                <div className="w-0.5 h-12 bg-white/10 absolute left-1/4 top-0"></div>
                <div className="w-0.5 h-12 bg-white/10 absolute right-1/4 top-0"></div>
              </div>

              {/* Downstream */}
              <div className="flex justify-between w-[320px] mt-12">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Database className="w-6 h-6 text-slate-300" />
                  </div>
                  <span className="text-slate-300 text-sm font-medium text-center">Local Storage</span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Downstream</span>
                </div>

                <div className="flex flex-col items-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Server className="w-6 h-6 text-slate-300" />
                  </div>
                  <span className="text-slate-300 text-sm font-medium text-center">Identity Agent</span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Downstream</span>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
