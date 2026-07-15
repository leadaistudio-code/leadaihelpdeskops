"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Ghost, ShieldX, Check, Activity } from "lucide-react";
import { revokeSoftwareLicense } from "@/app/actions/dexActions";
import { toast } from "@/components/toast";
import { Panel, PanelHeader, Badge, Button, DataTable, THead, TH, TBody, TR, TD } from "@/components/ui";

export default function AnalyticsClient({ initialData, activeData }: { initialData: any[], activeData: any[] }) {
  const [data, setData] = useState(initialData);
  const [revoking, setRevoking] = useState<string | null>(null);

  const handleRevoke = async (id: string, software: string) => {
    setRevoking(id);
    try {
      await revokeSoftwareLicense(id);
      setData((prev) => prev.filter((item) => item.id !== id));
      toast(`Revoked license for ${software}`);
    } catch (error) {
      toast("Failed to revoke license", "error");
    } finally {
      setRevoking(null);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* ZOMBIE LICENSES */}
      {data.length === 0 ? (
        <Panel className="p-12 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
            <Check className="w-7 h-7 text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Zombie Licenses Found</h3>
          <p className="text-sm text-slate-400 max-w-sm">All expensive SaaS licenses are actively being used across the organization. Great job!</p>
        </Panel>
      ) : (
        <Panel className="overflow-hidden">
          <PanelHeader
            title="Zombie Licenses (Actionable)"
            icon={Ghost}
            action={<Badge tone="warning">{data.length} Identified</Badge>}
          />
          <DataTable>
            <THead>
              <tr>
                <TH>Employee / Device</TH>
                <TH>Software</TH>
                <TH>Monthly Cost</TH>
                <TH>Last Activity</TH>
                <TH align="right">Action</TH>
              </tr>
            </THead>
            <TBody>
              {data.map((item) => (
                <TR key={item.id}>
                  <TD>
                    <div className="font-semibold text-white">{item.user}</div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{item.device}</div>
                  </TD>
                  <TD>
                    <div className="font-medium text-slate-300 capitalize">{item.software.replace(".exe", "")}</div>
                  </TD>
                  <TD className="font-mono font-semibold text-rose-400 tabular-nums">${item.cost}</TD>
                  <TD className="text-slate-400">
                    {item.lastUsedAt ? <>{formatDistanceToNow(new Date(item.lastUsedAt))} ago</> : "Never opened"}
                  </TD>
                  <TD align="right">
                    <Button
                      variant="danger"
                      size="sm"
                      icon={ShieldX}
                      loading={revoking === item.id}
                      onClick={() => handleRevoke(item.id, item.software)}
                      disabled={revoking === item.id}
                    >
                      {revoking === item.id ? "Revoking…" : "Revoke License"}
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </DataTable>
        </Panel>
      )}

      {/* LIVE TELEMETRY DATA */}
      <Panel className="overflow-hidden">
        <PanelHeader
          title="Active Applications (Real-Time Telemetry)"
          icon={Activity}
          action={<Badge tone="neutral">{activeData.length} Discovered</Badge>}
        />

        {activeData.length === 0 ? (
          <div className="p-8 text-center text-slate-400">Waiting for agent telemetry…</div>
        ) : (
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs text-slate-500 bg-black/20 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="px-6 py-3 font-semibold">Device Hostname</th>
                  <th className="px-6 py-3 font-semibold">Process Name</th>
                  <th className="px-6 py-3 font-semibold">Classification</th>
                  <th className="px-6 py-3 font-semibold text-right">Last Reported</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {activeData.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white font-mono">{item.device}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-300">{item.software}</div>
                    </td>
                    <td className="px-6 py-4">
                      {item.cost > 0 ? (
                        <Badge tone="warning">Paid SaaS</Badge>
                      ) : (
                        <Badge tone="neutral">Standard App</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-400">
                      {item.lastUsedAt ? <>{formatDistanceToNow(new Date(item.lastUsedAt))} ago</> : "Just now"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
