// Layered graph layout for the dependency map.
//
// A dependency graph drawn with a force simulation settles into a hairball: the
// eye cannot tell which way a dependency points, and the picture is different
// every time you open it. This is a Sugiyama-style layered layout instead —
// deterministic, left-to-right, and readable at a hundred nodes:
//
//   1. rank nodes into rows by dependency depth
//   2. order each row to cut edge crossings (barycentre sweeps)
//   3. wrap wide rows into blocks and assign coordinates
//   4. route edges as cubic beziers between row boundaries
//
// It runs TOP TO BOTTOM: an edge reads `source depends on target`, so sources
// sit ABOVE the things they need. A business service is at the top and the core
// router everything ultimately rests on is at the bottom — you read the picture
// the same way you say the sentence, and you scroll the way the page already
// scrolls.
//
// Rows wrap. A layer holding thirty endpoints would otherwise make the canvas
// seven thousand pixels wide, which is the same navigation problem as a tall
// column, just rotated. Wrapping a wide layer into a block of a few rows keeps
// the whole map near a screen's own proportions.
//
// Pure: no React, no DOM, no Prisma. The geometry is testable on its own.

import type { CiNode, CiEdge, EffectiveState } from "@/lib/cmdb-impact";

export const NODE_W = 132;
export const NODE_H = 64;
export const COL_GAP = 28; // horizontal space between nodes in a row
export const ROW_GAP = 76; // vertical space between one layer and the next
export const WRAP_GAP = 14; // vertical space between wrapped lines of one layer

// How many nodes a layer draws before wrapping onto another line. Ten keeps the
// canvas near 1500px wide, which fits a laptop screen without zooming out to
// the point where labels stop being readable.
export const MAX_PER_ROW = 10;

export type LaidOutNode = {
  node: CiNode;
  state: EffectiveState;
  x: number;
  y: number;
  layer: number;
};

export type LaidOutEdge = {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  // True when this link is carrying a failure: the target (the dependency) is
  // down or impacted, so everything flowing through it is affected. This is the
  // flag that paints the link red.
  broken: boolean;
  path: string; // SVG cubic bezier
  // Midpoint, for an optional label.
  mx: number;
  my: number;
};

export type Layout = {
  nodes: LaidOutNode[];
  edges: LaidOutEdge[];
  width: number;
  height: number;
  layerCount: number;
};

// Assign each node to a row.
//
// layer(n) = 0 when nothing depends on n (the consumers: business services,
// laptops, printers), otherwise 1 + the deepest layer among its dependents. The
// longest path is used rather than the shortest so a node never sits above
// something that needs it, which would draw the arrow backwards.
//
// Cycles are broken by processing in dependent-count order and refusing to
// revisit — a two-switch uplink pair gets adjacent columns instead of hanging.
export function assignLayers(nodes: CiNode[], edges: CiEdge[]): Map<string, number> {
  const byId = new Set(nodes.map((n) => n.id));
  // target -> sources that depend on it
  const dependents = new Map<string, string[]>();
  for (const e of edges) {
    if (e.sourceId === e.targetId) continue;
    if (!byId.has(e.sourceId) || !byId.has(e.targetId)) continue;
    const list = dependents.get(e.targetId);
    if (list) list.push(e.sourceId);
    else dependents.set(e.targetId, [e.sourceId]);
  }

  const layer = new Map<string, number>();
  const visiting = new Set<string>();

  const resolve = (id: string): number => {
    const cached = layer.get(id);
    if (cached !== undefined) return cached;
    if (visiting.has(id)) return 0; // cycle: treat as a consumer and move on
    visiting.add(id);

    const deps = dependents.get(id) ?? [];
    let best = 0;
    for (const d of deps) best = Math.max(best, resolve(d) + 1);

    visiting.delete(id);
    layer.set(id, best);
    return best;
  };

  for (const n of nodes) resolve(n.id);
  return layer;
}

// Order nodes within each layer so edges cross as little as possible.
//
// The barycentre heuristic: repeatedly place each node at the average position
// of its neighbours in the adjacent layer, then re-sort. A handful of sweeps
// gets most of the benefit; this is not worth an exact algorithm, because the
// exact one is NP-hard and nobody can see the difference.
function orderLayers(
  columns: string[][],
  edges: CiEdge[],
  sweeps = 4
): string[][] {
  const cols = columns.map((c) => [...c]);
  const left = new Map<string, string[]>(); // node -> neighbours one layer above
  const right = new Map<string, string[]>();

  for (const e of edges) {
    // source sits above target
    const l = right.get(e.sourceId);
    if (l) l.push(e.targetId);
    else right.set(e.sourceId, [e.targetId]);
    const r = left.get(e.targetId);
    if (r) r.push(e.sourceId);
    else left.set(e.targetId, [e.sourceId]);
  }

  const indexIn = (col: string[]) => new Map(col.map((id, i) => [id, i]));

  for (let s = 0; s < sweeps; s++) {
    const forward = s % 2 === 0;
    const order = forward ? [...cols.keys()] : [...cols.keys()].reverse();

    for (const ci of order) {
      const neighbourCol = forward ? cols[ci - 1] : cols[ci + 1];
      if (!neighbourCol) continue;
      const pos = indexIn(neighbourCol);
      const adj = forward ? left : right;

      const score = new Map<string, number>();
      cols[ci].forEach((id, i) => {
        const ns = (adj.get(id) ?? []).map((n) => pos.get(n)).filter((v): v is number => v !== undefined);
        // No neighbour in that layer: keep the current position so a node does
        // not jump to the start on every sweep.
        score.set(id, ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : i);
      });

      cols[ci].sort((a, b) => (score.get(a) ?? 0) - (score.get(b) ?? 0));
    }
  }

  return cols;
}

// ---------------------------------------------------------------------------
// Sibling grouping
// ---------------------------------------------------------------------------
//
// Real estates are mostly leaves. Thirty-five laptops hanging off one access
// switch is topologically correct and visually useless: it buries the three
// layers that carry the interesting structure under a wall of identical boxes. Every service map handles this by collapsing identical siblings
// into one node with a count — the "+2" chips you see in ServiceNow.
//
// A group is formed from CIs that share a type AND a single dependency AND have
// nothing depending on them. Those three conditions mean the members are
// genuinely interchangeable on the picture: they all live or die with the same
// parent, and none of them is load-bearing for anything else.

// Three is the point where a fan stops being readable as individuals. Below it,
// drawing the members costs less than making the operator click to see them.
export const MIN_GROUP_SIZE = 3;

export type GroupMember = { id: string; name: string; state: EffectiveState };

export type CiGroup = {
  key: string;
  type: string;
  parentId: string;
  relation: string;
  members: GroupMember[];
  // Worst state among the members: a group containing one dead laptop must not
  // read as healthy.
  state: EffectiveState;
  downCount: number;
};

const SEVERITY: Record<EffectiveState, number> = {
  DOWN: 0,
  IMPACTED: 1,
  DEGRADED: 2,
  MAINTENANCE: 3,
  RETIRED: 4,
  OPERATIONAL: 5,
};

export function findGroups(
  nodes: CiNode[],
  edges: CiEdge[],
  state: Map<string, EffectiveState>
): CiGroup[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const outgoing = new Map<string, CiEdge[]>();
  const hasDependents = new Set<string>();

  for (const e of edges) {
    if (e.sourceId === e.targetId) continue;
    if (!byId.has(e.sourceId) || !byId.has(e.targetId)) continue;
    const l = outgoing.get(e.sourceId);
    if (l) l.push(e);
    else outgoing.set(e.sourceId, [e]);
    hasDependents.add(e.targetId);
  }

  const buckets = new Map<string, { edge: CiEdge; node: CiNode }[]>();
  for (const n of nodes) {
    if (hasDependents.has(n.id)) continue; // something needs it — keep it visible
    const out = outgoing.get(n.id) ?? [];
    if (out.length !== 1) continue; // multi-homed CIs are not interchangeable
    const e = out[0];
    const key = `${e.targetId}|${n.type}|${e.type}`;
    const b = buckets.get(key);
    if (b) b.push({ edge: e, node: n });
    else buckets.set(key, [{ edge: e, node: n }]);
  }

  const groups: CiGroup[] = [];
  for (const [key, members] of buckets) {
    if (members.length < MIN_GROUP_SIZE) continue;
    const memberStates = members.map((m) => ({
      id: m.node.id,
      name: m.node.name,
      state: state.get(m.node.id) ?? ("OPERATIONAL" as EffectiveState),
    }));
    const worst = memberStates.reduce(
      (acc, m) => (SEVERITY[m.state] < SEVERITY[acc] ? m.state : acc),
      "OPERATIONAL" as EffectiveState
    );
    groups.push({
      key,
      type: members[0].node.type,
      parentId: members[0].edge.targetId,
      relation: members[0].edge.type,
      members: memberStates.sort((a, b) => SEVERITY[a.state] - SEVERITY[b.state] || a.name.localeCompare(b.name)),
      state: worst,
      downCount: memberStates.filter((m) => m.state === "DOWN" || m.state === "IMPACTED").length,
    });
  }
  return groups;
}

// Rewrite the graph so each collapsed group is a single synthetic node.
//
// Synthetic ids are prefixed `group:` so callers can tell them apart, and the
// group's members are still reachable through `findGroups` for the detail
// panel — nothing is lost, only folded.
export function collapseGroups(
  nodes: CiNode[],
  edges: CiEdge[],
  groups: CiGroup[],
  expanded: ReadonlySet<string>,
  state: Map<string, EffectiveState>
): {
  nodes: CiNode[];
  edges: CiEdge[];
  collapsed: Map<string, CiGroup>;
  // `state` plus an entry per synthetic group node, so the layout can colour a
  // folded group by its worst member instead of defaulting it to healthy.
  state: Map<string, EffectiveState>;
} {
  const active = groups.filter((g) => !expanded.has(g.key));
  if (active.length === 0) return { nodes, edges, collapsed: new Map(), state };

  const memberToGroup = new Map<string, CiGroup>();
  for (const g of active) for (const m of g.members) memberToGroup.set(m.id, g);

  const collapsed = new Map<string, CiGroup>();
  const outNodes: CiNode[] = nodes.filter((n) => !memberToGroup.has(n.id));
  const outState = new Map(state);

  for (const g of active) {
    const id = `group:${g.key}`;
    collapsed.set(id, g);
    outState.set(id, g.state);
    outNodes.push({
      id,
      ciId: `${g.members.length} items`,
      name: `${g.members.length} × ${g.type.replace(/_/g, " ").toLowerCase()}`,
      type: g.type,
      // The group carries the worst member's state, so a dead laptop inside a
      // folded group still shows red on the map.
      status: g.state === "DOWN" ? "DOWN" : g.state === "DEGRADED" ? "DEGRADED" : "OPERATIONAL",
      criticality: "LOW",
    });
  }

  const seen = new Set<string>();
  const outEdges: CiEdge[] = [];
  for (const e of edges) {
    const gs = memberToGroup.get(e.sourceId);
    const gt = memberToGroup.get(e.targetId);
    const sourceId = gs ? `group:${gs.key}` : e.sourceId;
    const targetId = gt ? `group:${gt.key}` : e.targetId;
    if (sourceId === targetId) continue;
    const k = `${sourceId}->${targetId}-${e.type}`;
    if (seen.has(k)) continue;
    seen.add(k);
    outEdges.push({ sourceId, targetId, type: e.type });
  }

  return { nodes: outNodes, edges: outEdges, collapsed, state: outState };
}

export function layoutGraph(
  nodes: CiNode[],
  edges: CiEdge[],
  state: Map<string, EffectiveState>
): Layout {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const valid = edges.filter(
    (e) => e.sourceId !== e.targetId && byId.has(e.sourceId) && byId.has(e.targetId)
  );

  const layerOf = assignLayers(nodes, valid);
  const layerCount = nodes.length === 0 ? 0 : Math.max(...nodes.map((n) => layerOf.get(n.id) ?? 0)) + 1;

  const columns: string[][] = Array.from({ length: layerCount }, () => []);
  // Seed each layer grouped by type, then alphabetically, so the starting order
  // is meaningful before the barycentre sweeps refine it — and so wrapped lines
  // hold like things together.
  const seeded = [...nodes].sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
  for (const n of seeded) columns[layerOf.get(n.id) ?? 0].push(n.id);

  const ordered = orderLayers(columns, valid);

  // Split each layer into wrapped lines, then measure the canvas from the
  // widest line rather than the biggest layer.
  const lines: { layer: number; ids: string[] }[] = [];
  ordered.forEach((layerIds, li) => {
    if (layerIds.length === 0) {
      return;
    }
    for (let i = 0; i < layerIds.length; i += MAX_PER_ROW) {
      lines.push({ layer: li, ids: layerIds.slice(i, i + MAX_PER_ROW) });
    }
  });

  const widestLine = Math.max(1, ...lines.map((l) => l.ids.length));
  const width = widestLine * (NODE_W + COL_GAP) + COL_GAP;

  const laidOut: LaidOutNode[] = [];
  const pos = new Map<string, { x: number; y: number }>();

  let y = ROW_GAP;
  let previousLayer = lines.length > 0 ? lines[0].layer : 0;

  for (const line of lines) {
    // A new layer gets the full row gap; a wrapped continuation of the same
    // layer gets the tighter one, so a block reads as one tier.
    if (line.layer !== previousLayer) {
      y += NODE_H + ROW_GAP;
      previousLayer = line.layer;
    } else if (laidOut.length > 0) {
      y += NODE_H + WRAP_GAP;
    }

    // Centre each line so the map reads as one shape instead of everything
    // jammed against the left edge.
    const lineWidth = line.ids.length * (NODE_W + COL_GAP) - COL_GAP;
    const offset = (width - lineWidth) / 2;

    line.ids.forEach((id, i) => {
      const x = offset + i * (NODE_W + COL_GAP);
      pos.set(id, { x, y });
      laidOut.push({ node: byId.get(id)!, state: state.get(id) ?? "OPERATIONAL", x, y, layer: line.layer });
    });
  }

  const height = y + NODE_H + ROW_GAP;

  const isBroken = (s: EffectiveState | undefined) => s === "DOWN" || s === "IMPACTED" || s === "DEGRADED";

  const laidOutEdges: LaidOutEdge[] = valid.map((e) => {
    const a = pos.get(e.sourceId)!;
    const b = pos.get(e.targetId)!;

    // Leave the source's bottom edge, enter the target's top edge.
    const x1 = a.x + NODE_W / 2;
    const y1 = a.y + NODE_H;
    const x2 = b.x + NODE_W / 2;
    const y2 = b.y;

    // Control points pushed vertically so links leave and arrive straight down.
    // That vertical entry is what turns a fan of thirty links into a readable
    // bundle instead of a starburst.
    const dy = Math.max(30, Math.abs(y2 - y1) * 0.5);
    const path = `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`;

    return {
      id: `${e.sourceId}->${e.targetId}-${e.type}`,
      sourceId: e.sourceId,
      targetId: e.targetId,
      type: e.type,
      // The link is broken when the DEPENDENCY (target) is failing — that is
      // the direction trouble travels.
      broken: isBroken(state.get(e.targetId)),
      path,
      mx: (x1 + x2) / 2,
      my: (y1 + y2) / 2,
    };
  });

  return { nodes: laidOut, edges: laidOutEdges, width, height, layerCount };
}

// Everything within `depth` hops of `rootId`, in either direction.
//
// A hundred CIs at once is the estate; two hops from one switch is the
// question an operator actually has. Undirected on purpose: you want both what
// this depends on and what depends on it.
export function neighbourhood(rootId: string, edges: CiEdge[], depth: number): Set<string> {
  const adj = new Map<string, string[]>();
  const add = (a: string, b: string) => {
    const l = adj.get(a);
    if (l) l.push(b);
    else adj.set(a, [b]);
  };
  for (const e of edges) {
    if (e.sourceId === e.targetId) continue;
    add(e.sourceId, e.targetId);
    add(e.targetId, e.sourceId);
  }

  const seen = new Set([rootId]);
  let frontier = [rootId];
  for (let d = 0; d < depth; d++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const n of adj.get(id) ?? []) {
        if (!seen.has(n)) {
          seen.add(n);
          next.push(n);
        }
      }
    }
    if (next.length === 0) break;
    frontier = next;
  }
  return seen;
}
