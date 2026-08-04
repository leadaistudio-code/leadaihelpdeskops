// Dependency impact propagation for the CMDB.
//
// Pure functions over plain data: no Prisma, no React. The rules that decide
// what turns red are the whole point of a CMDB, so they belong somewhere they
// can be unit-tested against a topology you can read, not buried in a query or
// a component.
//
// The graph is directed and reads `source depends on target`. Impact therefore
// travels *backwards* along edges: a failed target degrades everything pointing
// at it, transitively. Real infrastructure graphs contain cycles (two switches
// uplinked to each other, an app pair that calls both ways), so every traversal
// here is explicitly cycle-safe rather than assuming a tree.

export type CiStatus = "OPERATIONAL" | "DEGRADED" | "DOWN" | "MAINTENANCE" | "RETIRED";

export type CiNode = {
  id: string;
  ciId: string;
  name: string;
  type: string;
  status: CiStatus;
  criticality: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  location?: string | null;
  ipAddress?: string | null;
  owner?: string | null;
};

export type CiEdge = {
  sourceId: string; // depends on ↓
  targetId: string;
  type: string;
};

// What a CI is actually experiencing once its dependencies are taken into
// account.
//
//  - `DOWN`     — this CI itself is down.
//  - `IMPACTED` — this CI is fine, but something it needs is not. This is the
//                 state the old CMDB could not express, and it is the one an
//                 operator cares about: the app is "up" and nobody can use it.
//  - `DEGRADED` — reported as degraded, or downstream of something degraded.
//  - `MAINTENANCE` / `RETIRED` — excluded from impact; planned absence is not
//                 an outage, and propagating it would cry wolf every patch night.
//  - `OPERATIONAL` — genuinely fine.
export type EffectiveState = "DOWN" | "IMPACTED" | "DEGRADED" | "MAINTENANCE" | "RETIRED" | "OPERATIONAL";

export type ImpactResult = {
  // Effective state per CI id.
  state: Map<string, EffectiveState>;
  // For an impacted CI, the ids of the failed CIs responsible. Lets the UI say
  // "down because CORE-RTR-01 is down" instead of just colouring it red.
  causes: Map<string, string[]>;
};

const OUT_OF_SERVICE: ReadonlySet<CiStatus> = new Set<CiStatus>(["MAINTENANCE", "RETIRED"]);

export function buildAdjacency(edges: CiEdge[]) {
  // dependents: target -> [sources that need it]. This is the direction impact
  // flows, so it is the index the propagation walks.
  const dependents = new Map<string, string[]>();
  // dependencies: source -> [targets it needs]. Used for the "why" panel.
  const dependencies = new Map<string, string[]>();

  const push = (m: Map<string, string[]>, key: string, value: string) => {
    const list = m.get(key);
    if (list) list.push(value);
    else m.set(key, [value]);
  };

  for (const e of edges) {
    if (e.sourceId === e.targetId) continue; // a self-edge carries no information
    push(dependents, e.targetId, e.sourceId);
    push(dependencies, e.sourceId, e.targetId);
  }
  return { dependents, dependencies };
}

// Propagate outages across the graph.
//
// Breadth-first from every genuinely failed CI, marking everything that reaches
// it through a dependency edge. BFS rather than DFS so `causes` records the
// nearest failure first, which is the one an operator should look at.
export function computeImpact(nodes: CiNode[], edges: CiEdge[]): ImpactResult {
  const { dependents } = buildAdjacency(edges);
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const state = new Map<string, EffectiveState>();
  const causes = new Map<string, string[]>();

  // Seed with each CI's own reported status.
  for (const n of nodes) {
    if (n.status === "DOWN") state.set(n.id, "DOWN");
    else if (n.status === "DEGRADED") state.set(n.id, "DEGRADED");
    else if (n.status === "MAINTENANCE") state.set(n.id, "MAINTENANCE");
    else if (n.status === "RETIRED") state.set(n.id, "RETIRED");
    else state.set(n.id, "OPERATIONAL");
  }

  // Only genuine failures propagate. Planned maintenance does not — see the
  // note on EffectiveState.
  const sources = nodes.filter((n) => n.status === "DOWN" || n.status === "DEGRADED");

  for (const origin of sources) {
    const originIsDown = origin.status === "DOWN";
    const seen = new Set<string>([origin.id]);
    let frontier = dependents.get(origin.id) ?? [];

    while (frontier.length > 0) {
      const next: string[] = [];

      for (const id of frontier) {
        if (seen.has(id)) continue; // cycle guard
        seen.add(id);

        const node = byId.get(id);
        if (!node) continue;
        // A CI that is itself out of service does not get relabelled, and does
        // not pass the failure on: nothing downstream of a retired box is
        // "impacted" by an outage further up.
        if (OUT_OF_SERVICE.has(node.status)) continue;

        const current = state.get(id);
        // Its own failure outranks an inherited one.
        if (current !== "DOWN") {
          if (originIsDown) {
            if (current !== "IMPACTED") state.set(id, "IMPACTED");
          } else if (current === "OPERATIONAL") {
            state.set(id, "DEGRADED");
          }
        }

        const list = causes.get(id) ?? [];
        if (!list.includes(origin.id)) list.push(origin.id);
        causes.set(id, list);

        for (const d of dependents.get(id) ?? []) next.push(d);
      }

      frontier = next;
    }
  }

  return { state, causes };
}

// Everything that stops working if `rootId` fails — the blast radius.
//
// Answers "what breaks if I reboot this switch?" before you reboot it, which is
// the question that makes a CMDB worth maintaining.
export function blastRadius(rootId: string, edges: CiEdge[]): Set<string> {
  const { dependents } = buildAdjacency(edges);
  const hit = new Set<string>();
  let frontier = dependents.get(rootId) ?? [];

  while (frontier.length > 0) {
    const next: string[] = [];
    for (const id of frontier) {
      if (id === rootId || hit.has(id)) continue;
      hit.add(id);
      for (const d of dependents.get(id) ?? []) next.push(d);
    }
    frontier = next;
  }
  return hit;
}

// ---------------------------------------------------------------------------
// Tree shaping
// ---------------------------------------------------------------------------

export type TreeNode = {
  node: CiNode;
  state: EffectiveState;
  // True when the edge from this node's parent is carrying a failure, i.e. the
  // parent (the thing this CI depends on) is down or impacted. This is the flag
  // the UI paints the connector rail with.
  linkBroken: boolean;
  relation: string | null;
  depth: number;
  children: TreeNode[];
  // A CI can depend on several things but appears once in the tree, under one
  // of them. The rest are listed on the detail panel so the extra edges are not
  // silently lost.
  otherDependencyCount: number;
};

// Rank types so the tree hangs off infrastructure rather than off whichever CI
// happened to be created first. Lower sorts closer to the root.
const TYPE_DEPTH: Record<string, number> = {
  SITE: 0,
  ROUTER: 1,
  FIREWALL: 2,
  SWITCH: 3,
  WIRELESS_AP: 4,
  LOAD_BALANCER: 5,
  STORAGE: 6,
  SERVER: 7,
  VIRTUAL_MACHINE: 8,
  DATABASE: 9,
  APPLICATION: 10,
  BUSINESS_SERVICE: 11,
  DESKTOP: 12,
  LAPTOP: 13,
  PRINTER: 14,
};

function typeDepth(t: string) {
  return TYPE_DEPTH[t] ?? 50;
}

// Build a forest rooted at the CIs nothing else supports.
//
// The graph is a DAG-with-cycles, not a tree, so this picks each CI's *primary*
// dependency — the one closest to the infrastructure layer — as its parent and
// counts the rest. That keeps the view a readable tree while making it obvious,
// per node, that other edges exist.
export function buildForest(nodes: CiNode[], edges: CiEdge[], impact: ImpactResult): TreeNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const { dependencies } = buildAdjacency(edges);

  const relationOf = new Map<string, string>();
  for (const e of edges) relationOf.set(`${e.sourceId}->${e.targetId}`, e.type);

  // Choose one parent per CI: the dependency sitting nearest the infrastructure
  // layer, tie-broken by name so the tree is stable between renders.
  const parentOf = new Map<string, string>();
  const otherCount = new Map<string, number>();

  for (const n of nodes) {
    const deps = (dependencies.get(n.id) ?? []).filter((d) => byId.has(d));
    if (deps.length === 0) continue;
    const sorted = [...deps].sort((a, b) => {
      const da = typeDepth(byId.get(a)!.type);
      const db = typeDepth(byId.get(b)!.type);
      if (da !== db) return da - db;
      return byId.get(a)!.name.localeCompare(byId.get(b)!.name);
    });
    parentOf.set(n.id, sorted[0]);
    otherCount.set(n.id, deps.length - 1);
  }

  // Break any parent cycle: walking up must terminate. If it does not, the CI
  // becomes a root rather than hanging the renderer.
  for (const id of [...parentOf.keys()]) {
    const seen = new Set<string>([id]);
    let cur = parentOf.get(id);
    while (cur) {
      if (seen.has(cur)) {
        parentOf.delete(id);
        break;
      }
      seen.add(cur);
      cur = parentOf.get(cur);
    }
  }

  const childrenOf = new Map<string, string[]>();
  for (const [child, parent] of parentOf) {
    const list = childrenOf.get(parent);
    if (list) list.push(child);
    else childrenOf.set(parent, [child]);
  }

  const isBroken = (s: EffectiveState | undefined) => s === "DOWN" || s === "IMPACTED" || s === "DEGRADED";

  const build = (id: string, depth: number, parentId: string | null): TreeNode => {
    const node = byId.get(id)!;
    const kids = (childrenOf.get(id) ?? [])
      .map((c) => build(c, depth + 1, id))
      .sort((a, b) => {
        // Trouble first — a 40-child switch should not hide its one dead port
        // at the bottom of the list.
        const rank = (t: TreeNode) => (t.state === "DOWN" ? 0 : t.state === "IMPACTED" ? 1 : t.state === "DEGRADED" ? 2 : 3);
        const r = rank(a) - rank(b);
        return r !== 0 ? r : a.node.name.localeCompare(b.node.name);
      });

    return {
      node,
      state: impact.state.get(id) ?? "OPERATIONAL",
      linkBroken: parentId != null && isBroken(impact.state.get(parentId)),
      relation: parentId ? relationOf.get(`${id}->${parentId}`) ?? null : null,
      depth,
      children: kids,
      otherDependencyCount: otherCount.get(id) ?? 0,
    };
  };

  const roots = nodes.filter((n) => !parentOf.has(n.id));
  return roots
    .map((r) => build(r.id, 0, null))
    .sort((a, b) => {
      const d = typeDepth(a.node.type) - typeDepth(b.node.type);
      return d !== 0 ? d : a.node.name.localeCompare(b.node.name);
    });
}

// Count every node in a forest, for the header summary.
export function countTree(nodes: TreeNode[]): number {
  return nodes.reduce((n, t) => n + 1 + countTree(t.children), 0);
}

// Ids of every node on the path from a root down to `targetId`, so a search hit
// deep in the tree can be revealed rather than merely matched.
export function pathTo(forest: TreeNode[], targetId: string): string[] {
  const walk = (t: TreeNode, trail: string[]): string[] | null => {
    const here = [...trail, t.node.id];
    if (t.node.id === targetId) return here;
    for (const c of t.children) {
      const hit = walk(c, here);
      if (hit) return hit;
    }
    return null;
  };
  for (const r of forest) {
    const hit = walk(r, []);
    if (hit) return hit;
  }
  return [];
}
