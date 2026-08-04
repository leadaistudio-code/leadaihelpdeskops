"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  Server, Database, Globe, Network, Cpu, Laptop, Monitor, Printer, Router, Shield,
  HardDrive, Wifi, Building2, Box, Search, ChevronRight, AlertTriangle, X,
  type LucideIcon,
} from "lucide-react";
import { PageHeader, Panel, PanelHeader, Button, Input, Badge, StatTile, Select, cn, focusRing } from "@/components/ui";
import { getCiDetail, setCiStatus, type CmdbGraph, type CiDetail } from "@/app/actions/cmdbActions";
import type { TreeNode, EffectiveState } from "@/lib/cmdb-impact";

// An indented dependency tree rather than a node-and-wire canvas.
//
// At a hundred CIs a free-floating graph is a hairball nobody can read, and the
// operator's question is not "how is it wired" but "what is broken and what
// does that take down with it". An indented tree answers that: the vertical
// rail between a CI and its children IS the dependency link, so colouring the
// rail red shows the failure travelling down the estate without drawing a
// single edge crossing.

const ICONS: Record<string, LucideIcon> = {
  BUSINESS_SERVICE: Globe,
  APPLICATION: Cpu,
  DATABASE: Database,
  VIRTUAL_MACHINE: Box,
  SERVER: Server,
  STORAGE: HardDrive,
  LOAD_BALANCER: Network,
  FIREWALL: Shield,
  ROUTER: Router,
  SWITCH: Network,
  WIRELESS_AP: Wifi,
  LAPTOP: Laptop,
  DESKTOP: Monitor,
  PRINTER: Printer,
  SITE: Building2,
};

const TYPE_LABEL: Record<string, string> = {
  BUSINESS_SERVICE: "Business service",
  APPLICATION: "Application",
  DATABASE: "Database",
  VIRTUAL_MACHINE: "Virtual machine",
  SERVER: "Server",
  STORAGE: "Storage",
  LOAD_BALANCER: "Load balancer",
  FIREWALL: "Firewall",
  ROUTER: "Router",
  SWITCH: "Switch",
  WIRELESS_AP: "Wireless AP",
  LAPTOP: "Laptop",
  DESKTOP: "Desktop",
  PRINTER: "Printer",
  SITE: "Site",
};

const RELATION_LABEL: Record<string, string> = {
  HOSTED_ON: "hosted on",
  RUNS_ON: "runs on",
  CONNECTED_TO: "connected to",
  USES: "uses",
  DELIVERED_BY: "delivered by",
  DEPENDS_ON: "depends on",
};

// Semantic colours, straight from the design system's status vocabulary.
const STATE_DOT: Record<EffectiveState, string> = {
  DOWN: "bg-rose-500",
  IMPACTED: "bg-rose-400",
  DEGRADED: "bg-amber-400",
  MAINTENANCE: "bg-slate-500",
  RETIRED: "bg-slate-600",
  OPERATIONAL: "bg-emerald-500",
};

function isBroken(s: EffectiveState) {
  return s === "DOWN" || s === "IMPACTED" || s === "DEGRADED";
}

// Collect ids matching a query, plus every ancestor, so a hit deep in the tree
// can be revealed rather than merely counted.
function matchingIds(nodes: TreeNode[], q: string) {
  const query = q.trim().toLowerCase();
  const matches = new Set<string>();
  const reveal = new Set<string>();
  if (!query) return { matches, reveal };

  const walk = (t: TreeNode, trail: string[]): boolean => {
    const here = [...trail, t.node.id];
    const hit =
      t.node.name.toLowerCase().includes(query) ||
      t.node.ciId.toLowerCase().includes(query) ||
      (TYPE_LABEL[t.node.type] ?? t.node.type).toLowerCase().includes(query) ||
      (t.node.ipAddress ?? "").toLowerCase().includes(query);
    if (hit) {
      matches.add(t.node.id);
      trail.forEach((id) => reveal.add(id));
    }
    let childHit = false;
    for (const c of t.children) childHit = walk(c, here) || childHit;
    if (childHit) trail.forEach((id) => reveal.add(id));
    return hit || childHit;
  };

  nodes.forEach((n) => walk(n, []));
  return { matches, reveal };
}

function collectIds(nodes: TreeNode[], into = new Set<string>()) {
  for (const t of nodes) {
    into.add(t.node.id);
    collectIds(t.children, into);
  }
  return into;
}

export default function CmdbTree({ graph, embedded = false }: { graph: CmdbGraph; embedded?: boolean }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CiDetail | null>(null);
  const [showOnlyProblems, setShowOnlyProblems] = useState(false);
  const [pending, startTransition] = useTransition();

  // Roots and their immediate children open by default: enough to see the shape
  // of the estate without rendering a hundred rows on arrival.
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const root of graph.forest) {
      initial.add(root.node.id);
      for (const child of root.children) initial.add(child.node.id);
    }
    return initial;
  });

  const { matches, reveal } = useMemo(() => matchingIds(graph.forest, query), [graph.forest, query]);

  // `requestId` guards against a slow response for a CI the user has already
  // clicked away from overwriting a newer one.
  const requestId = useRef(0);

  const selectCi = (id: string | null) => {
    setSelectedId(id);
    setDetail(null);
    if (!id) return;
    const mine = ++requestId.current;
    getCiDetail(id)
      .then((d) => {
        if (requestId.current === mine) setDetail(d);
      })
      .catch(() => {
        if (requestId.current === mine) setDetail(null);
      });
  };

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const expandAll = () => setExpanded(collectIds(graph.forest));
  const collapseAll = () => setExpanded(new Set(graph.forest.map((r) => r.node.id)));

  const changeStatus = (id: string, status: string) => {
    startTransition(async () => {
      try {
        await setCiStatus(id, status as Parameters<typeof setCiStatus>[1]);
        // The whole map re-derives from this, so a full refresh is the honest
        // response — a local patch would show impact that the server has not
        // actually recomputed.
        window.location.reload();
      } catch {
        /* the server action is the authority; a failure leaves the map as-is */
      }
    });
  };

  const searching = query.trim() !== "";

  const renderRow = (t: TreeNode, isLast: boolean, ancestorRails: boolean[]) => {
    const { node } = t;
    const hasChildren = t.children.length > 0;
    const isOpen = expanded.has(node.id);
    const Icon = ICONS[node.type] ?? Box;
    const dimmed = searching && !matches.has(node.id);

    // Hidden entirely when filtering to problems and neither this CI nor
    // anything beneath it is in trouble.
    if (showOnlyProblems && !subtreeHasProblem(t)) return null;
    if (searching && !matches.has(node.id) && !reveal.has(node.id)) return null;

    return (
      <div key={node.id}>
        <div
          className={cn(
            "group relative flex items-center gap-2 rounded-lg pr-3 transition-colors",
            selectedId === node.id ? "bg-white/[0.06]" : "hover:bg-white/[0.03]",
            dimmed && "opacity-40"
          )}
        >
          {/* Ancestor rails. Each is a dependency link from a CI higher up; a
              broken one stays red the whole way down so you can trace an
              outage from a leaf back to its cause. */}
          {ancestorRails.map((broken, i) => (
            <span
              key={i}
              aria-hidden
              className={cn(
                "absolute top-0 bottom-0 w-px",
                broken ? "bg-rose-500/50" : "bg-white/10"
              )}
              style={{ left: `${12 + i * 20}px` }}
            />
          ))}

          {/* The elbow joining this row to its parent's rail. */}
          {t.depth > 0 && (
            <>
              <span
                aria-hidden
                className={cn(
                  "absolute top-0 w-px",
                  isLast ? "h-1/2" : "bottom-0",
                  t.linkBroken ? "bg-rose-500/50" : "bg-white/10"
                )}
                style={{ left: `${12 + (t.depth - 1) * 20}px` }}
              />
              <span
                aria-hidden
                className={cn("absolute top-1/2 h-px w-3", t.linkBroken ? "bg-rose-500/50" : "bg-white/10")}
                style={{ left: `${12 + (t.depth - 1) * 20}px` }}
              />
            </>
          )}

          <div style={{ paddingLeft: `${t.depth * 20}px` }} className="flex min-w-0 flex-1 items-center gap-2 py-1.5">
            <button
              onClick={() => hasChildren && toggle(node.id)}
              aria-label={hasChildren ? (isOpen ? `Collapse ${node.name}` : `Expand ${node.name}`) : undefined}
              aria-expanded={hasChildren ? isOpen : undefined}
              disabled={!hasChildren}
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors",
                hasChildren ? "text-slate-400 hover:bg-white/10 hover:text-slate-200" : "opacity-0",
                focusRing
              )}
            >
              <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-90")} />
            </button>

            <button
              onClick={() => selectCi(node.id)}
              className={cn("flex min-w-0 flex-1 items-center gap-2.5 rounded text-left", focusRing)}
            >
              <span className={cn("h-2 w-2 shrink-0 rounded-full", STATE_DOT[t.state])} aria-hidden />
              <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <span
                className={cn(
                  "truncate text-sm",
                  isBroken(t.state) ? "font-medium text-slate-100" : "text-slate-300"
                )}
              >
                {node.name}
              </span>
              <span className="shrink-0 font-mono text-xs text-slate-600">{node.ciId}</span>

              {t.state === "IMPACTED" && (
                <span className="shrink-0 text-xs font-medium text-rose-400">impacted</span>
              )}
              {t.state === "DOWN" && <span className="shrink-0 text-xs font-semibold text-rose-400">down</span>}
              {t.state === "DEGRADED" && (
                <span className="shrink-0 text-xs font-medium text-amber-400">degraded</span>
              )}

              <span className="ml-auto shrink-0 text-xs text-slate-600">
                {TYPE_LABEL[node.type] ?? node.type}
              </span>
              {hasChildren && !isOpen && (
                <span className="shrink-0 rounded bg-white/5 px-1.5 text-[10px] font-semibold tabular-nums text-slate-400">
                  {t.children.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {hasChildren && isOpen && (
          <div>
            {t.children.map((c, i) =>
              renderRow(c, i === t.children.length - 1, [...ancestorRails, t.linkBroken])
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative z-10 flex h-full flex-col">
      {!embedded && (
        <div className="flex-shrink-0 p-8 pb-0">
          <PageHeader
            title="Dependency map"
            description="Every configuration item and what it depends on. A red rail means the link is carrying an outage."
            action={
              <>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                    aria-hidden
                  />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    type="search"
                    placeholder="Search name, CI, IP…"
                    aria-label="Search configuration items"
                    className="w-64 pl-9"
                  />
                </div>
                <Button variant="secondary" onClick={() => setShowOnlyProblems((v) => !v)}>
                  {showOnlyProblems ? "Show all" : "Only problems"}
                </Button>
              </>
            }
          />

          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="Configuration items" value={graph.total} hint={graph.truncated ? "Showing the first 2,000" : undefined} />
            <StatTile label="Down" tone={graph.counts.down > 0 ? "critical" : "neutral"} value={graph.counts.down} hint="Failed directly" />
            <StatTile
              label="Impacted"
              tone={graph.counts.impacted > 0 ? "critical" : "neutral"}
              value={graph.counts.impacted}
              hint="Broken by a dependency"
            />
            <StatTile
              label="Degraded"
              tone={graph.counts.degraded > 0 ? "warning" : "neutral"}
              value={graph.counts.degraded}
              hint="Reduced service"
            />
          </div>
        </div>
      )}

      <div className={cn("flex min-h-0 flex-1 gap-6", embedded ? "" : "p-8 pt-0")}>
        <Panel className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <PanelHeader
            title="Estate"
            action={
              <div className="flex gap-2">
                <button onClick={expandAll} className={cn("rounded px-2 py-1 text-xs text-slate-400 hover:text-slate-200", focusRing)}>
                  Expand all
                </button>
                <button onClick={collapseAll} className={cn("rounded px-2 py-1 text-xs text-slate-400 hover:text-slate-200", focusRing)}>
                  Collapse
                </button>
              </div>
            }
          />
          <div className="custom-scrollbar min-h-0 flex-1 overflow-auto p-3">
            {graph.forest.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <Network className="mb-4 h-12 w-12 text-slate-600" aria-hidden />
                <h2 className="mb-2 text-lg font-semibold text-white">No configuration items yet</h2>
                <p className="max-w-sm text-sm text-slate-400">
                  Populate the CMDB to see the estate and how an outage travels through it.
                </p>
              </div>
            ) : (
              graph.forest.map((r, i) => renderRow(r, i === graph.forest.length - 1, []))
            )}
          </div>
        </Panel>

        {/* Detail panel. Sits beside the tree rather than floating over it, so
            selecting a CI never hides the row you selected. */}
        {selectedId && (
          <Panel className="flex w-[380px] shrink-0 flex-col overflow-hidden">
            <PanelHeader
              title={detail?.name ?? "Loading…"}
              action={
                <button
                  onClick={() => selectCi(null)}
                  aria-label="Close details"
                  className={cn("rounded p-1 text-slate-400 hover:bg-white/10 hover:text-slate-200", focusRing)}
                >
                  <X className="h-4 w-4" />
                </button>
              }
            />
            <div className="custom-scrollbar min-h-0 flex-1 overflow-auto p-5">
              {!detail ? (
                <p className="text-sm text-slate-500">Loading…</p>
              ) : (
                <>
                  <dl className="mb-5 space-y-2 text-sm">
                    <Row label="CI" value={<span className="font-mono text-xs">{detail.ciId}</span>} />
                    <Row label="Type" value={TYPE_LABEL[detail.type] ?? detail.type} />
                    <Row label="Criticality" value={detail.criticality} />
                    {detail.location && <Row label="Location" value={detail.location} />}
                    {detail.ipAddress && <Row label="Address" value={<span className="font-mono text-xs">{detail.ipAddress}</span>} />}
                    {detail.owner && <Row label="Owner" value={detail.owner} />}
                  </dl>

                  <div className="mb-5">
                    <label htmlFor="ci-status" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Status
                    </label>
                    <Select
                      id="ci-status"
                      value={detail.status}
                      disabled={pending}
                      onChange={(e) => changeStatus(detail.id, e.target.value)}
                    >
                      <option value="OPERATIONAL">Operational</option>
                      <option value="DEGRADED">Degraded</option>
                      <option value="DOWN">Down</option>
                      <option value="MAINTENANCE">Maintenance</option>
                      <option value="RETIRED">Retired</option>
                    </Select>
                  </div>

                  {detail.blastRadiusCount > 0 && (
                    <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2.5">
                      <AlertTriangle className="mt-px h-4 w-4 shrink-0 text-amber-400" aria-hidden />
                      <p className="text-xs text-amber-200">
                        <strong className="font-semibold tabular-nums">{detail.blastRadiusCount}</strong>{" "}
                        {detail.blastRadiusCount === 1 ? "item stops" : "items stop"} working if this fails.
                      </p>
                    </div>
                  )}

                  <RelationList
                    title="Depends on"
                    empty="Nothing — this is a root of the estate."
                    items={detail.dependsOn}
                    onSelect={selectCi}
                  />
                  <RelationList
                    title="Supports"
                    empty="Nothing depends on this."
                    items={detail.supports}
                    onSelect={selectCi}
                  />
                </>
              )}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

function subtreeHasProblem(t: TreeNode): boolean {
  return isBroken(t.state) || t.children.some(subtreeHasProblem);
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="min-w-0 truncate text-right text-slate-200">{value}</dd>
    </div>
  );
}

function RelationList({
  title,
  empty,
  items,
  onSelect,
}: {
  title: string;
  empty: string;
  items: CiDetail["dependsOn"];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="mb-5">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {title}
        {items.length > 0 && <span className="ml-1.5 tabular-nums text-slate-600">{items.length}</span>}
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-slate-500">{empty}</p>
      ) : (
        <ul className="space-y-1">
          {items.map((r) => {
            const Icon = ICONS[r.type] ?? Box;
            const down = r.status === "DOWN";
            return (
              <li key={`${r.id}-${r.relation}`}>
                <button
                  onClick={() => onSelect(r.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/[0.04]",
                    focusRing
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-xs text-slate-300">{r.name}</span>
                  {down && <Badge tone="critical">Down</Badge>}
                  <span className="shrink-0 text-[10px] text-slate-600">
                    {RELATION_LABEL[r.relation] ?? r.relation.toLowerCase()}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
