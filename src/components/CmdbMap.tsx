"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Server, Database, Globe, Network, Cpu, Laptop, Monitor, Printer, Router, Shield,
  HardDrive, Wifi, Building2, Box, Search, AlertTriangle, X, Crosshair, Minus, Plus,
  Maximize2, ListTree, Share2, type LucideIcon,
} from "lucide-react";
import { PageHeader, Panel, PanelHeader, Button, Input, Badge, StatTile, Select, cn, focusRing } from "@/components/ui";
import { getCiDetail, setCiStatus, type CmdbGraph, type CiDetail } from "@/app/actions/cmdbActions";
import {
  layoutGraph,
  neighbourhood,
  findGroups,
  collapseGroups,
  NODE_W,
  NODE_H,
} from "@/lib/cmdb-layout";
import type { EffectiveState } from "@/lib/cmdb-impact";
import CmdbTree from "@/components/CmdbTree";

// The dependency map: a left-to-right layered graph of every configuration item
// and the links between them.
//
// Layout, link routing, and the broken-link rule all live in `cmdb-layout.ts`
// and `cmdb-impact.ts`. This file is the canvas — pan, zoom, focus, selection —
// and nothing here decides what is true about the estate.
//
// Links are drawn in SVG and nodes as positioned HTML. Nodes carry icons, real
// text, and interactive controls; SVG text and hit-testing would fight all
// three, while SVG is the only sane way to draw a hundred curves.

const ICONS: Record<string, LucideIcon> = {
  BUSINESS_SERVICE: Globe,
  APPLICATION: Cpu,
  DATABASE: Database,
  VIRTUAL_MACHINE: Box,
  SERVER: Server,
  STORAGE: HardDrive,
  LOAD_BALANCER: Share2,
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

// Node tint by effective state. Semantic colours only — the design system
// reserves rose/amber/emerald for status, and this is status.
const NODE_TINT: Record<EffectiveState, string> = {
  DOWN: "border-rose-500/70 bg-rose-500/[0.10]",
  IMPACTED: "border-rose-400/45 bg-rose-500/[0.05]",
  DEGRADED: "border-amber-400/50 bg-amber-500/[0.06]",
  MAINTENANCE: "border-white/10 bg-white/[0.02]",
  RETIRED: "border-white/[0.06] bg-white/[0.01]",
  OPERATIONAL: "border-white/10 bg-white/[0.03]",
};

const ICON_TINT: Record<EffectiveState, string> = {
  DOWN: "text-rose-300",
  IMPACTED: "text-rose-300/80",
  DEGRADED: "text-amber-300",
  MAINTENANCE: "text-slate-500",
  RETIRED: "text-slate-600",
  OPERATIONAL: "text-slate-300",
};

// Healthy links are tinted by relationship type. This is the multicoloured look
// of a service map, and it carries meaning: you can see at a glance that a fan
// of links into a switch is physical connectivity rather than app dependency.
const RELATION_STROKE: Record<string, string> = {
  HOSTED_ON: "#38E8B0",
  RUNS_ON: "#6D5EF6",
  CONNECTED_TO: "#F5B14C",
  USES: "#22B8CF",
  DELIVERED_BY: "#A78BFA",
  DEPENDS_ON: "#64748B",
};

const BROKEN_STROKE = "#FF6B7D";

export default function CmdbMap({ graph }: { graph: CmdbGraph }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CiDetail | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [depth, setDepth] = useState(2);
  const [onlyProblems, setOnlyProblems] = useState(false);
  const [view, setView] = useState<"map" | "list">("map");
  const [pending, startTransition] = useTransition();

  // Folded sibling groups, keyed as they come back from findGroups. Empty
  // means everything is folded; a key present here means the operator opened
  // that group and wants its members drawn individually.
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const [zoom, setZoom] = useState(0.75);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  const states = useMemo(
    () => new Map(graph.states as [string, EffectiveState][]),
    [graph.states]
  );

  // Which CIs are on the canvas. Focus narrows to a neighbourhood; "only
  // problems" keeps anything failing plus whatever it is attached to, so a red
  // node is never left floating without the link that explains it.
  const visibleIds = useMemo(() => {
    let ids = new Set(graph.nodes.map((n) => n.id));

    if (focusId) ids = neighbourhood(focusId, graph.edges, depth);

    if (onlyProblems) {
      const bad = new Set(
        graph.nodes
          .filter((n) => {
            const s = states.get(n.id);
            return s === "DOWN" || s === "IMPACTED" || s === "DEGRADED";
          })
          .map((n) => n.id)
      );
      const keep = new Set(bad);
      for (const e of graph.edges) {
        if (bad.has(e.sourceId)) keep.add(e.targetId);
        if (bad.has(e.targetId)) keep.add(e.sourceId);
      }
      ids = new Set([...ids].filter((id) => keep.has(id)));
    }
    return ids;
  }, [graph.nodes, graph.edges, focusId, depth, onlyProblems, states]);

  // Fold interchangeable siblings before laying out. Without this, 35 laptops
  // on one switch make the canvas six thousand pixels tall and bury the
  // structure that matters.
  const { layout, collapsed } = useMemo(() => {
    const nodes = graph.nodes.filter((n) => visibleIds.has(n.id));
    const edges = graph.edges.filter((e) => visibleIds.has(e.sourceId) && visibleIds.has(e.targetId));

    const groups = findGroups(nodes, edges, states);
    const folded = collapseGroups(nodes, edges, groups, expandedGroups, states);

    return {
      layout: layoutGraph(folded.nodes, folded.edges, folded.state),
      collapsed: folded.collapsed,
    };
  }, [graph.nodes, graph.edges, visibleIds, states, expandedGroups]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return new Set(
      layout.nodes
        .filter(
          (n) =>
            n.node.name.toLowerCase().includes(q) ||
            n.node.ciId.toLowerCase().includes(q) ||
            (TYPE_LABEL[n.node.type] ?? n.node.type).toLowerCase().includes(q) ||
            (n.node.ipAddress ?? "").toLowerCase().includes(q)
        )
        .map((n) => n.node.id)
    );
  }, [query, layout.nodes]);

  // Links touching the selected CI, so hovering the graph is not the only way
  // to trace one dependency out of a hundred.
  const highlightedEdges = useMemo(() => {
    if (!selectedId) return null;
    return new Set(
      layout.edges.filter((e) => e.sourceId === selectedId || e.targetId === selectedId).map((e) => e.id)
    );
  }, [selectedId, layout.edges]);

  // Pan so a node sits in the middle of the viewport. Without this, choosing a
  // CI from the detail panel selects something off-screen and the operator has
  // to go looking for their own selection.
  const centreOn = useCallback(
    (id: string) => {
      const vp = viewportRef.current;
      const target = layout.nodes.find((n) => n.node.id === id);
      if (!vp || !target) return;
      setPan({
        x: vp.clientWidth / 2 - (target.x + NODE_W / 2) * zoom,
        y: vp.clientHeight / 2 - (target.y + NODE_H / 2) * zoom,
      });
    },
    [layout.nodes, zoom]
  );

  const selectCi = useCallback(
    (id: string | null, opts?: { centre?: boolean }) => {
      setSelectedId(id);
      setDetail(null);
      if (!id) return;
      if (opts?.centre) centreOn(id);
      const mine = ++requestId.current;
      getCiDetail(id)
        .then((d) => {
          if (requestId.current === mine) setDetail(d);
        })
        .catch(() => {
          if (requestId.current === mine) setDetail(null);
        });
    },
    [centreOn]
  );

  const fit = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp || layout.width === 0) return;
    const scale = Math.min(vp.clientWidth / (layout.width + 80), vp.clientHeight / (layout.height + 80), 1.2);
    setZoom(Math.max(0.15, scale));
    setPan({ x: 0, y: 0 });
  }, [layout.width, layout.height]);

  // Frame the whole estate once, after the first paint — the viewport has to
  // exist before it can be measured. Guarded so expanding a group or focusing a
  // node never yanks the canvas back from wherever the operator panned it.
  const didFit = useRef(false);
  useEffect(() => {
    if (didFit.current) return;
    didFit.current = true;
    const id = requestAnimationFrame(fit);
    return () => cancelAnimationFrame(id);
  }, [fit]);

  const onPointerDown = (e: React.PointerEvent) => {
    // Only the background drags; pointer-down on a node should select it.
    if ((e.target as HTMLElement).closest("[data-ci-node]")) return;
    dragging.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragging.current;
    if (!d) return;
    setPan({ x: d.panX + (e.clientX - d.x), y: d.panY + (e.clientY - d.y) });
  };
  const onPointerUp = () => {
    dragging.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return; // plain scroll still scrolls the page
    e.preventDefault();
    setZoom((z) => Math.min(2, Math.max(0.15, z - e.deltaY * 0.002)));
  };

  const changeStatus = (id: string, status: string) => {
    startTransition(async () => {
      try {
        await setCiStatus(id, status as Parameters<typeof setCiStatus>[1]);
        // Impact re-derives server-side from this, so a reload is the honest
        // response — patching locally would show impact nobody recomputed.
        window.location.reload();
      } catch {
        /* the server action is the authority */
      }
    });
  };

  const focusNode = focusId ? graph.nodes.find((n) => n.id === focusId) : null;

  return (
    <div className="relative z-10 flex h-full flex-col">
      <div className="flex-shrink-0 px-8 pt-8">
        <PageHeader
          title="Dependency map"
          description="Every configuration item and the links between them. A red link is carrying an outage."
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
                  onKeyDown={(e) => {
                    // Enter jumps to the first match rather than leaving the
                    // operator to find the one un-dimmed node on the canvas.
                    if (e.key !== "Enter" || !matches?.size) return;
                    const first = layout.nodes.find((n) => matches.has(n.node.id));
                    if (first) selectCi(first.node.id, { centre: true });
                  }}
                  type="search"
                  placeholder="Search name, CI, IP…"
                  aria-label="Search configuration items"
                  className="w-56 pl-9"
                />
                {matches != null && (
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums text-slate-500">
                    {matches.size}
                  </span>
                )}
              </div>
              <Button variant="secondary" onClick={() => setOnlyProblems((v) => !v)}>
                {onlyProblems ? "Show all" : "Only problems"}
              </Button>
              {expandedGroups.size > 0 && (
                <Button variant="secondary" onClick={() => setExpandedGroups(new Set())}>
                  Collapse groups
                </Button>
              )}
              <Button
                variant="secondary"
                icon={view === "map" ? ListTree : Share2}
                onClick={() => setView((v) => (v === "map" ? "list" : "map"))}
              >
                {view === "map" ? "List" : "Map"}
              </Button>
            </>
          }
        />

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile
            label="Configuration items"
            value={graph.total}
            hint={graph.truncated ? "Showing the first 2,000" : `${graph.edges.length} links`}
          />
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

      {view === "list" ? (
        <div className="min-h-0 flex-1 px-8 pb-8">
          <CmdbTree graph={graph} embedded />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 gap-6 px-8 pb-8">
          <Panel className="relative min-w-0 flex-1 overflow-hidden">
            {/* Canvas */}
            <div
              ref={viewportRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onWheel={onWheel}
              className="absolute inset-0 cursor-grab touch-none overflow-hidden active:cursor-grabbing"
            >
              {/* Grid, so panning has a sense of movement. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:28px_28px]"
              />

              {layout.nodes.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                  <Network className="mb-4 h-12 w-12 text-slate-600" aria-hidden />
                  <h2 className="mb-2 text-lg font-semibold text-white">
                    {graph.total === 0 ? "No configuration items yet" : "Nothing matches this filter"}
                  </h2>
                  <p className="max-w-sm text-sm text-slate-400">
                    {graph.total === 0
                      ? "Populate the CMDB to see the estate and how an outage travels through it."
                      : "Clear the focus or the problem filter to see the whole estate again."}
                  </p>
                </div>
              ) : (
                <div
                  className="absolute left-0 top-0 origin-top-left"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    width: layout.width,
                    height: layout.height,
                  }}
                >
                  <svg
                    width={layout.width}
                    height={layout.height}
                    className="absolute inset-0 overflow-visible"
                    aria-hidden
                  >
                    {/* Broken links are drawn last so they sit on top of the
                        healthy ones — the outage should never be hidden under
                        a bundle of working dependencies. */}
                    {[...layout.edges]
                      .sort((a, b) => Number(a.broken) - Number(b.broken))
                      .map((e) => {
                        const highlighted = highlightedEdges?.has(e.id) ?? false;
                        const dimmed = highlightedEdges != null && !highlighted;
                        return (
                          <path
                            key={e.id}
                            d={e.path}
                            fill="none"
                            stroke={e.broken ? BROKEN_STROKE : RELATION_STROKE[e.type] ?? RELATION_STROKE.DEPENDS_ON}
                            strokeWidth={e.broken ? 2 : highlighted ? 2 : 1.25}
                            strokeOpacity={dimmed ? 0.12 : e.broken ? 0.85 : highlighted ? 0.9 : 0.42}
                            strokeLinecap="round"
                          />
                        );
                      })}
                  </svg>

                  {layout.nodes.map((n) => {
                    const Icon = ICONS[n.node.type] ?? Box;
                    const group = collapsed.get(n.node.id);
                    const dimmed = matches != null && !matches.has(n.node.id) && !group;
                    const isSelected = selectedId === n.node.id;
                    const failing = n.state === "DOWN" || n.state === "IMPACTED" || n.state === "DEGRADED";

                    return (
                      <button
                        key={n.node.id}
                        data-ci-node
                        onClick={() => {
                          if (group) {
                            setExpandedGroups((prev) => new Set(prev).add(group.key));
                            return;
                          }
                          selectCi(n.node.id);
                        }}
                        onDoubleClick={() => {
                          if (group) return;
                          setFocusId(n.node.id);
                          setTimeout(fit, 0);
                        }}
                        title={
                          group
                            ? `${group.members.length} × ${TYPE_LABEL[n.node.type] ?? n.node.type} — click to expand`
                            : `${n.node.name} — ${TYPE_LABEL[n.node.type] ?? n.node.type}`
                        }
                        style={{ left: n.x, top: n.y, width: NODE_W, height: NODE_H }}
                        className={cn(
                          "absolute flex flex-col items-center justify-center gap-1 rounded-xl border px-2 transition-colors",
                          NODE_TINT[n.state],
                          group && "shadow-[3px_3px_0_0_rgba(255,255,255,0.06)]",
                          isSelected && "ring-2 ring-blue-500/60",
                          dimmed && "opacity-25",
                          "hover:border-white/25",
                          focusRing
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon className={cn("h-4 w-4 shrink-0", ICON_TINT[n.state])} aria-hidden />
                          {failing && (
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                n.state === "DEGRADED" ? "bg-amber-400" : "bg-rose-400"
                              )}
                              aria-hidden
                            />
                          )}
                        </div>
                        <span className="w-full truncate text-center text-[11px] font-medium leading-tight text-slate-200">
                          {n.node.name}
                        </span>
                        <span className="w-full truncate text-center text-[10px] leading-none text-slate-500">
                          {group
                            ? group.downCount > 0
                              ? `${group.downCount} affected`
                              : "click to expand"
                            : TYPE_LABEL[n.node.type] ?? n.node.type}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Focus banner */}
            {focusNode && (
              <div className="absolute left-4 top-4 flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2 backdrop-blur-md">
                <Crosshair className="h-4 w-4 text-blue-400" aria-hidden />
                <div className="text-xs">
                  <p className="font-semibold text-slate-100">{focusNode.name}</p>
                  <p className="text-slate-400">
                    {layout.nodes.length} items within {depth} {depth === 1 ? "hop" : "hops"}
                  </p>
                </div>
                <label className="flex items-center gap-1.5 text-xs text-slate-400">
                  Depth
                  <select
                    value={depth}
                    onChange={(e) => setDepth(Number(e.target.value))}
                    aria-label="Hops from the focused item"
                    className={cn("rounded-lg border border-white/10 bg-black/30 px-1.5 py-1 text-slate-200", focusRing)}
                  >
                    {[1, 2, 3, 4, 5].map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  onClick={() => setFocusId(null)}
                  aria-label="Clear focus"
                  className={cn("rounded p-1 text-slate-400 hover:bg-white/10 hover:text-slate-200", focusRing)}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 rounded-xl border border-white/10 bg-slate-900/90 p-3 backdrop-blur-md">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Link</p>
              <ul className="space-y-1">
                <li className="flex items-center gap-2 text-[11px] text-slate-300">
                  <Stroke color={BROKEN_STROKE} width={2} /> Carrying an outage
                </li>
                {Object.entries(RELATION_LABEL).map(([key, label]) => (
                  <li key={key} className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Stroke color={RELATION_STROKE[key]} /> {label}
                  </li>
                ))}
              </ul>
              <p className="mt-2 border-t border-white/10 pt-2 text-[10px] text-slate-500">
Drag to pan · ⌘/Ctrl + scroll to zoom · double-click a node to focus it
              </p>
            </div>

            {/* Zoom */}
            <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full border border-white/10 bg-slate-900/90 p-1 backdrop-blur-md">
              <IconBtn label="Zoom out" onClick={() => setZoom((z) => Math.max(0.15, z - 0.1))}>
                <Minus className="h-3.5 w-3.5" />
              </IconBtn>
              <span className="w-11 text-center text-xs font-semibold tabular-nums text-slate-200">
                {Math.round(zoom * 100)}%
              </span>
              <IconBtn label="Zoom in" onClick={() => setZoom((z) => Math.min(2, z + 0.1))}>
                <Plus className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn label="Fit to screen" onClick={fit}>
                <Maximize2 className="h-3.5 w-3.5" />
              </IconBtn>
            </div>
          </Panel>

          {selectedId && (
            <Panel className="flex w-[360px] shrink-0 flex-col overflow-hidden">
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
                    <div className="mb-4 flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Crosshair}
                        onClick={() => {
                          setFocusId(detail.id);
                          setTimeout(fit, 0);
                        }}
                      >
                        Focus
                      </Button>
                    </div>

                    <dl className="mb-5 space-y-2 text-sm">
                      <Row label="CI" value={<span className="font-mono text-xs">{detail.ciId}</span>} />
                      <Row label="Type" value={TYPE_LABEL[detail.type] ?? detail.type} />
                      <Row label="Criticality" value={detail.criticality} />
                      {detail.location && <Row label="Location" value={detail.location} />}
                      {detail.ipAddress && (
                        <Row label="Address" value={<span className="font-mono text-xs">{detail.ipAddress}</span>} />
                      )}
                      {detail.owner && <Row label="Owner" value={detail.owner} />}
                    </dl>

                    <div className="mb-5">
                      <label
                        htmlFor="ci-status"
                        className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400"
                      >
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
                      onSelect={(id) => selectCi(id, { centre: true })}
                    />
                    <RelationList
                      title="Supports"
                      empty="Nothing depends on this."
                      items={detail.supports}
                      onSelect={(id) => selectCi(id, { centre: true })}
                    />
                  </>
                )}
              </div>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}

function Stroke({ color, width = 1.5 }: { color: string; width?: number }) {
  return (
    <svg width="18" height="6" aria-hidden className="shrink-0">
      <line x1="0" y1="3" x2="18" y2="3" stroke={color} strokeWidth={width} strokeLinecap="round" />
    </svg>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-white/10",
        focusRing
      )}
    >
      {children}
    </button>
  );
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
                  {r.status === "DOWN" && <Badge tone="critical">Down</Badge>}
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
