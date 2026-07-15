export const dynamic = "force-dynamic";

import Link from "next/link";
import { getAssets } from "@/app/actions/assetActions";
import { Laptop, Plus } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import {
  PageHeader,
  Button,
  Panel,
  Badge,
  humanize,
  DataTable,
  THead,
  TH,
  TBody,
  TR,
  TD,
  focusRing,
  cn,
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

export default async function AssetsPage() {
  const assets = await getAssets();

  return (
    <div className="p-8 h-full overflow-auto custom-scrollbar relative z-10">
      <PageHeader
        title="Asset Management"
        description="Hardware and software inventory"
        action={
          <Button href="/assets/new" icon={Plus}>
            New Asset
          </Button>
        }
      />

      <Panel className="overflow-hidden">
        <DataTable>
          <THead>
            <tr>
              <TH>Asset Tag</TH>
              <TH>Name</TH>
              <TH>Category</TH>
              <TH>Status</TH>
              <TH>Assigned To</TH>
            </tr>
          </THead>
          <TBody>
            {assets.length === 0 ? (
              <tr>
                <TD colSpan={5}>
                  <EmptyState
                    icon={Laptop}
                    title="No assets registered"
                    description="Add your first hardware or software asset to start tracking inventory, assignments, and lifecycle."
                    ctaHref="/assets/new"
                    ctaLabel="New Asset"
                  />
                </TD>
              </tr>
            ) : (
              assets.map((asset) => (
                <TR key={asset.id} className="cursor-pointer">
                  <TD>
                    <Link
                      href={`/assets/${asset.id}`}
                      className={cn("font-semibold text-slate-100 hover:text-[#00926f] transition-colors rounded-sm", focusRing)}
                    >
                      {asset.assetTag}
                    </Link>
                  </TD>
                  <TD className="font-medium text-slate-200">{asset.name}</TD>
                  <TD className="text-slate-400">{asset.category}</TD>
                  <TD>
                    <Badge tone={assetStatusTone(asset.status)}>{humanize(asset.status)}</Badge>
                  </TD>
                  <TD className="text-slate-400">{asset.assignee?.name || "Unassigned"}</TD>
                </TR>
              ))
            )}
          </TBody>
        </DataTable>
      </Panel>
    </div>
  );
}
