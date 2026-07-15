"use client";

import { useMemo, useState } from "react";
import {
  Server, Database, Globe, Network, Cpu, Laptop, Box, Search, Filter, Maximize2,
  AlertTriangle, CheckCircle2, Inbox, type LucideIcon,
} from "lucide-react";
import { PageHeader, Button, Panel, Input, cn, focusRing } from "@/components/ui";

export type CmdbNode = {
  id: string;
  name: string;
  type: string;
  status: "Healthy" | "Warning" | "Critical";
  iconKey: string;
  assignee?: string | null;
  children: CmdbNode[];
};

const ICONS: Record<string, LucideIcon> = {
  service: Globe, group: Network, server: Server, db: Database, cpu: Cpu, laptop: Laptop, box: Box,
};

function NodeIcon({ iconKey, className }: { iconKey: string; className?: string }) {
  const Icon = ICONS[iconKey] ?? Box;
  return <Icon className={className} />;
}

export default function CmdbView({ tree }: { tree: CmdbNode | null }) {
  const [zoom, setZoom] = useState(100);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const selected = useMemo(() => {
    if (!selectedId || !tree) return null;
    const find = (n: CmdbNode): CmdbNode | null => {
      if (n.id === selectedId) return n;
      for (const c of n.children) {
        const hit = find(c);
        if (hit) return hit;
      }
      return null;
    };
    return find(tree);
  }, [selectedId, tree]);

  const matches = (n: CmdbNode) =>
    query.trim() === "" ||
    n.name.toLowerCase().includes(query.toLowerCase()) ||
    n.id.toLowerCase().includes(query.toLowerCase());

  const renderNode = (node: CmdbNode) => {
    const isSelected = selectedId === node.id;
    const dim = query.trim() !== "" && !matches(node);
    return (
      <div key={node.id} className="flex flex-col items-center">
        <div
          onClick={() => setSelectedId(node.id)}
          className={cn(
            "relative z-10 w-64 border rounded-2xl p-4 cursor-pointer transition-colors bg-white/[0.02]",
            dim && "opacity-30",
            isSelected ? "border-[#00d4a4]/60 bg-[#00d4a4]/5"
              : node.status === "Critical" ? "border-rose-500/50 bg-rose-500/5"
              : node.status === "Warning" ? "border-amber-500/50 bg-amber-500/5"
              : "border-white/10 hover:border-white/20"
          )}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
              <NodeIcon iconKey={node.iconKey} className="w-6 h-6 text-slate-300" />
            </div>
            {node.status === "Healthy" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            {node.status === "Warning" && <AlertTriangle className="w-5 h-5 text-amber-500" />}
            {node.status === "Critical" && (
              <div className="flex w-5 h-5 rounded-full bg-rose-500/20 items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white truncate">{node.name}</h3>
            <p className="text-xs font-medium text-slate-400 mt-0.5">{node.id}</p>
            <div className="mt-2 inline-block px-2 py-0.5 bg-white/5 text-slate-300 text-[10px] font-semibold rounded uppercase tracking-wider border border-white/10">
              {node.type}
            </div>
          </div>
        </div>

        {node.children.length > 0 && (
          <div className="relative flex justify-center mt-8">
            <div className="absolute -top-8 left-1/2 w-px h-8 bg-white/15 -translate-x-1/2" />
            {node.children.length > 1 && (
              <div className="absolute -top-4 left-[12%] right-[12%] h-px bg-white/15" />
            )}
            <div className="flex space-x-10 relative pt-4">
              {node.children.map((child) => (
                <div key={child.id} className="relative">
                  <div className="absolute -top-4 left-1/2 w-px h-4 bg-white/15 -translate-x-1/2" />
                  {renderNode(child)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col relative z-10">
      {/* Header */}
      <div className="p-8 border-b border-white/5 bg-slate-950/50 backdrop-blur-md z-20 flex-shrink-0">
        <PageHeader
          className="mb-0"
          title="CMDB Dependency Map"
          description="Live view of your configuration items, grouped from the asset registry"
          action={
            <>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  type="text"
                  placeholder="Search CIs..."
                  className="pl-9 w-64"
                />
              </div>
              <Button variant="secondary" icon={Filter} aria-label="Filter" />
              <Button variant="secondary" icon={Maximize2} aria-label="Reset zoom" onClick={() => setZoom(100)} />
            </>
          }
        />
      </div>

      {/* Map */}
      <div className="flex-1 overflow-auto custom-scrollbar relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        {tree ? (
          <div className="min-w-[1000px] min-h-[700px] p-16 flex items-start justify-center" style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center", transition: "transform 0.3s ease" }}>
            {renderNode(tree)}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center relative z-10">
            <Inbox className="w-14 h-14 text-slate-600 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No configuration items yet</h2>
            <p className="text-slate-400 max-w-sm mb-6">Add assets to the registry and they&apos;ll appear here, grouped into a live dependency map.</p>
            <Button href="/assets/new">Add an Asset</Button>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <Panel className="absolute bottom-8 left-8 right-8 bg-slate-900/95 backdrop-blur-xl p-6 flex items-center justify-between z-30 flex-wrap gap-4">
          <div className="flex items-center space-x-6">
            <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <NodeIcon iconKey={selected.iconKey} className="w-8 h-8 text-slate-300" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-1">{selected.name}</h3>
              <p className="text-sm text-slate-400">
                {selected.id} · {selected.type}
                {selected.assignee ? ` · Assigned to ${selected.assignee}` : ""}
                {` · ${selected.status}`}
              </p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => setSelectedId(null)}>Close</Button>
        </Panel>
      )}

      {/* Zoom controls */}
      <Panel className="absolute bottom-8 right-8 rounded-full flex items-center p-1 space-x-1 z-20">
        <button onClick={() => setZoom((z) => Math.max(50, z - 10))} className={cn("w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-300 font-semibold", focusRing)}>-</button>
        <span className="text-xs font-semibold text-white px-2">{zoom}%</span>
        <button onClick={() => setZoom((z) => Math.min(150, z + 10))} className={cn("w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-300 font-semibold", focusRing)}>+</button>
      </Panel>
    </div>
  );
}
