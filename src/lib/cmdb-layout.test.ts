import { describe, it, expect } from "vitest";
import {
  assignLayers,
  layoutGraph,
  neighbourhood,
  findGroups,
  collapseGroups,
  NODE_H,
  MAX_PER_ROW,
} from "@/lib/cmdb-layout";
import { computeImpact, type CiNode, type CiEdge, type CiStatus } from "@/lib/cmdb-impact";

function ci(id: string, type = "SERVER", status: CiStatus = "OPERATIONAL"): CiNode {
  return { id, ciId: id, name: id, type, status, criticality: "MEDIUM" };
}
function dep(sourceId: string, targetId: string, type = "DEPENDS_ON"): CiEdge {
  return { sourceId, targetId, type };
}

// service → app → vm → server → switch → router
const CHAIN_NODES = ["service", "app", "vm", "server", "switch", "router"].map((n) => ci(n));
const CHAIN_EDGES = [
  dep("service", "app"),
  dep("app", "vm"),
  dep("vm", "server"),
  dep("server", "switch"),
  dep("switch", "router"),
];

describe("assignLayers", () => {
  it("puts consumers at layer 0 and dependencies below them", () => {
    const l = assignLayers(CHAIN_NODES, CHAIN_EDGES);
    expect(l.get("service")).toBe(0);
    expect(l.get("app")).toBe(1);
    expect(l.get("vm")).toBe(2);
    expect(l.get("router")).toBe(5);
  });

  it("uses the longest path so a node never sits above something needing it", () => {
    // `hub` is reachable at depth 1 via `b` and depth 2 via a→b2→hub. It must
    // take the deeper column, or the a→hub link would point backwards.
    const nodes = [ci("a"), ci("b"), ci("b2"), ci("hub")];
    const edges = [dep("a", "hub"), dep("a", "b2"), dep("b2", "b"), dep("b", "hub")];
    const l = assignLayers(nodes, edges);
    expect(l.get("hub")).toBe(3);
    expect(l.get("hub")!).toBeGreaterThan(l.get("a")!);
  });

  it("terminates on a cycle", () => {
    const nodes = [ci("a"), ci("b")];
    const l = assignLayers(nodes, [dep("a", "b"), dep("b", "a")]);
    expect(l.size).toBe(2);
  });

  it("ignores self-edges and edges to unknown nodes", () => {
    const l = assignLayers([ci("a")], [dep("a", "a"), dep("a", "ghost")]);
    expect(l.get("a")).toBe(0);
  });

  it("puts an isolated node at layer 0", () => {
    expect(assignLayers([ci("lonely")], []).get("lonely")).toBe(0);
  });
});

describe("layoutGraph", () => {
  const impact = computeImpact(CHAIN_NODES, CHAIN_EDGES);

  it("lays every node out exactly once", () => {
    const l = layoutGraph(CHAIN_NODES, CHAIN_EDGES, impact.state);
    expect(l.nodes).toHaveLength(CHAIN_NODES.length);
    expect(new Set(l.nodes.map((n) => n.node.id)).size).toBe(CHAIN_NODES.length);
  });

  it("stacks layers top to bottom", () => {
    const l = layoutGraph(CHAIN_NODES, CHAIN_EDGES, impact.state);
    const y = (id: string) => l.nodes.find((n) => n.node.id === id)!.y;
    expect(y("service")).toBeLessThan(y("app"));
    expect(y("app")).toBeLessThan(y("router"));
  });

  it("leaves at least a node's height between layers", () => {
    const l = layoutGraph(CHAIN_NODES, CHAIN_EDGES, impact.state);
    const y = (id: string) => l.nodes.find((n) => n.node.id === id)!.y;
    expect(y("app") - y("service")).toBeGreaterThanOrEqual(NODE_H);
  });

  it("never overlaps two nodes on the same line", () => {
    const nodes = [ci("sw", "SWITCH"), ...Array.from({ length: 6 }, (_, i) => ci(`lt${i}`, "LAPTOP"))];
    const edges = nodes.slice(1).map((n) => dep(n.id, "sw"));
    const l = layoutGraph(nodes, edges, computeImpact(nodes, edges).state);
    const byLine = new Map<number, number[]>();
    for (const n of l.nodes) {
      const xs = byLine.get(n.y) ?? [];
      xs.push(n.x);
      byLine.set(n.y, xs);
    }
    for (const xs of byLine.values()) {
      const sorted = [...xs].sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i++) expect(sorted[i] - sorted[i - 1]).toBeGreaterThanOrEqual(NODE_H);
    }
  });

  it("wraps a wide layer instead of running off the side", () => {
    // 30 endpoints on one switch would otherwise be a 7,000px-wide canvas —
    // the same navigation problem as a tall column, just rotated.
    const nodes = [ci("sw", "SWITCH"), ...Array.from({ length: 30 }, (_, i) => ci(`n${i}`, "LAPTOP"))];
    const edges = nodes.slice(1).map((n) => dep(n.id, "sw"));
    const l = layoutGraph(nodes, edges, computeImpact(nodes, edges).state);

    const lines = new Set(l.nodes.filter((n) => n.layer === 0).map((n) => n.y));
    expect(lines.size).toBe(Math.ceil(30 / MAX_PER_ROW));
    expect(l.width).toBeLessThan(2000);
  });

  it("keeps a wrapped layer on one tier", () => {
    const nodes = [ci("sw", "SWITCH"), ...Array.from({ length: 25 }, (_, i) => ci(`n${i}`, "LAPTOP"))];
    const edges = nodes.slice(1).map((n) => dep(n.id, "sw"));
    const l = layoutGraph(nodes, edges, computeImpact(nodes, edges).state);
    // Every wrapped line still reports the same layer index.
    expect(new Set(l.nodes.filter((n) => n.node.id !== "sw").map((n) => n.layer)).size).toBe(1);
  });

  it("emits a bezier path per edge", () => {
    const l = layoutGraph(CHAIN_NODES, CHAIN_EDGES, impact.state);
    expect(l.edges).toHaveLength(CHAIN_EDGES.length);
    for (const e of l.edges) expect(e.path).toMatch(/^M [\d.-]+ [\d.-]+ C /);
  });

  it("routes links downward, out of the bottom and into the top", () => {
    const l = layoutGraph(CHAIN_NODES, CHAIN_EDGES, impact.state);
    const y = (id: string) => l.nodes.find((n) => n.node.id === id)!.y;
    const e = l.edges.find((x) => x.sourceId === "service")!;
    const [, sy] = e.path.match(/^M [\d.-]+ ([\d.-]+)/)!;
    // Leaves the source's bottom edge.
    expect(Number(sy)).toBeCloseTo(y("service") + NODE_H, 0);
  });

  it("marks a link broken when the dependency it points at has failed", () => {
    // The router dies: every link into it, and every link into the things it
    // took down, must read as broken.
    const nodes = CHAIN_NODES.map((n) => (n.id === "router" ? { ...n, status: "DOWN" as CiStatus } : n));
    const l = layoutGraph(nodes, CHAIN_EDGES, computeImpact(nodes, CHAIN_EDGES).state);
    expect(l.edges.every((e) => e.broken)).toBe(true);
  });

  it("leaves links intact when the estate is healthy", () => {
    const l = layoutGraph(CHAIN_NODES, CHAIN_EDGES, impact.state);
    expect(l.edges.some((e) => e.broken)).toBe(false);
  });

  it("breaks only the links pointing at the failure, not its neighbours", () => {
    const nodes = [ci("a"), ci("b"), ci("dead", "SWITCH", "DOWN"), ci("safe")];
    const edges = [dep("a", "dead"), dep("b", "safe")];
    const l = layoutGraph(nodes, edges, computeImpact(nodes, edges).state);
    expect(l.edges.find((e) => e.targetId === "dead")!.broken).toBe(true);
    expect(l.edges.find((e) => e.targetId === "safe")!.broken).toBe(false);
  });

  it("survives an empty graph", () => {
    const l = layoutGraph([], [], new Map());
    expect(l.nodes).toHaveLength(0);
    expect(l.width).toBeGreaterThan(0);
    expect(l.height).toBeGreaterThan(0);
  });

  it("is deterministic across runs", () => {
    const a = layoutGraph(CHAIN_NODES, CHAIN_EDGES, impact.state);
    const b = layoutGraph([...CHAIN_NODES].reverse(), CHAIN_EDGES, impact.state);
    const key = (l: typeof a) => l.nodes.map((n) => `${n.node.id}:${n.x},${n.y}`).sort().join("|");
    expect(key(a)).toBe(key(b));
  });
});

describe("findGroups / collapseGroups", () => {
  // One switch carrying six identical laptops — the shape that made the
  // ungrouped canvas six thousand pixels tall.
  const nodes = [ci("sw", "SWITCH"), ...Array.from({ length: 6 }, (_, i) => ci(`lt${i}`, "LAPTOP"))];
  const edges = nodes.slice(1).map((n) => dep(n.id, "sw", "CONNECTED_TO"));
  const state = computeImpact(nodes, edges).state;

  it("folds interchangeable siblings into one group", () => {
    const groups = findGroups(nodes, edges, state);
    expect(groups).toHaveLength(1);
    expect(groups[0].members).toHaveLength(6);
    expect(groups[0].type).toBe("LAPTOP");
  });

  it("leaves small fans alone", () => {
    const few = [ci("sw", "SWITCH"), ci("a", "LAPTOP"), ci("b", "LAPTOP")];
    const fewEdges = [dep("a", "sw"), dep("b", "sw")];
    expect(findGroups(few, fewEdges, computeImpact(few, fewEdges).state)).toHaveLength(0);
  });

  it("never folds a CI that something else depends on", () => {
    // A "laptop" other CIs rely on is load-bearing and must stay visible.
    const n = [ci("sw", "SWITCH"), ...Array.from({ length: 5 }, (_, i) => ci(`s${i}`, "SERVER")), ci("app", "APPLICATION")];
    const e = [...n.slice(1, 6).map((x) => dep(x.id, "sw")), dep("app", "s0")];
    const groups = findGroups(n, e, computeImpact(n, e).state);
    expect(groups.flatMap((g) => g.members.map((m) => m.id))).not.toContain("s0");
  });

  it("never folds a multi-homed CI", () => {
    const n = [ci("sw1", "SWITCH"), ci("sw2", "SWITCH"), ...Array.from({ length: 4 }, (_, i) => ci(`lt${i}`, "LAPTOP"))];
    const e = [...n.slice(2).map((x) => dep(x.id, "sw1")), dep("lt0", "sw2")];
    const groups = findGroups(n, e, computeImpact(n, e).state);
    expect(groups.flatMap((g) => g.members.map((m) => m.id))).not.toContain("lt0");
  });

  it("does not separate different types onto one group", () => {
    const n = [
      ci("sw", "SWITCH"),
      ...Array.from({ length: 4 }, (_, i) => ci(`lt${i}`, "LAPTOP")),
      ...Array.from({ length: 4 }, (_, i) => ci(`dt${i}`, "DESKTOP")),
    ];
    const e = n.slice(1).map((x) => dep(x.id, "sw"));
    const groups = findGroups(n, e, computeImpact(n, e).state);
    expect(groups).toHaveLength(2);
    expect(new Set(groups.map((g) => g.type))).toEqual(new Set(["LAPTOP", "DESKTOP"]));
  });

  it("carries the worst member's state so a dead node is never hidden", () => {
    const sick = nodes.map((n) => (n.id === "lt3" ? { ...n, status: "DOWN" as CiStatus } : n));
    const groups = findGroups(sick, edges, computeImpact(sick, edges).state);
    expect(groups[0].state).toBe("DOWN");
    expect(groups[0].downCount).toBe(1);
  });

  it("replaces members with one synthetic node and rewires its links", () => {
    const groups = findGroups(nodes, edges, state);
    const folded = collapseGroups(nodes, edges, groups, new Set(), state);
    expect(folded.nodes).toHaveLength(2); // the switch and one group
    expect(folded.edges).toHaveLength(1);
    expect(folded.collapsed.size).toBe(1);
  });

  it("gives the synthetic node a state so it is not drawn healthy by default", () => {
    const sick = nodes.map((n) => (n.id === "lt3" ? { ...n, status: "DOWN" as CiStatus } : n));
    const st = computeImpact(sick, edges).state;
    const folded = collapseGroups(sick, edges, findGroups(sick, edges, st), new Set(), st);
    const groupId = [...folded.collapsed.keys()][0];
    expect(folded.state.get(groupId)).toBe("DOWN");
  });

  it("expanding a group restores its members", () => {
    const groups = findGroups(nodes, edges, state);
    const folded = collapseGroups(nodes, edges, groups, new Set([groups[0].key]), state);
    expect(folded.nodes).toHaveLength(nodes.length);
    expect(folded.collapsed.size).toBe(0);
  });

  it("shrinks the canvas substantially", () => {
    const many = [ci("sw", "SWITCH"), ...Array.from({ length: 24 }, (_, i) => ci(`lt${i}`, "LAPTOP"))];
    const manyEdges = many.slice(1).map((n) => dep(n.id, "sw"));
    const st = computeImpact(many, manyEdges).state;

    const big = layoutGraph(many, manyEdges, st);
    const folded = collapseGroups(many, manyEdges, findGroups(many, manyEdges, st), new Set(), st);
    const small = layoutGraph(folded.nodes, folded.edges, folded.state);

    expect(small.height).toBeLessThan(big.height);
    expect(small.nodes.length).toBeLessThan(big.nodes.length);
  });
});

describe("neighbourhood", () => {
  it("returns the root alone at depth 0", () => {
    expect([...neighbourhood("vm", CHAIN_EDGES, 0)]).toEqual(["vm"]);
  });

  it("walks both directions, not just dependencies", () => {
    // From the VM you want the app that needs it AND the server it runs on.
    const n = neighbourhood("vm", CHAIN_EDGES, 1);
    expect(n.has("app")).toBe(true);
    expect(n.has("server")).toBe(true);
    expect(n.has("router")).toBe(false);
  });

  it("expands by one hop per depth step", () => {
    expect(neighbourhood("vm", CHAIN_EDGES, 2).size).toBe(5);
  });

  it("stops early when the graph runs out", () => {
    expect(neighbourhood("vm", CHAIN_EDGES, 99).size).toBe(CHAIN_NODES.length);
  });

  it("terminates on a cycle", () => {
    const edges = [dep("a", "b"), dep("b", "a")];
    expect(neighbourhood("a", edges, 10).size).toBe(2);
  });
});
