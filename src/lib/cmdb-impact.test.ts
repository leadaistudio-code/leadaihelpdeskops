import { describe, it, expect } from "vitest";
import {
  computeImpact,
  blastRadius,
  buildForest,
  countTree,
  pathTo,
  type CiNode,
  type CiEdge,
  type CiStatus,
} from "@/lib/cmdb-impact";

function ci(id: string, type: string, status: CiStatus = "OPERATIONAL"): CiNode {
  return { id, ciId: id, name: id, type, status, criticality: "MEDIUM" };
}

// source depends on target
function dep(sourceId: string, targetId: string, type = "DEPENDS_ON"): CiEdge {
  return { sourceId, targetId, type };
}

/*
  The reference topology, mirroring the case the feature exists for:

      rtr ──< sw ──< laptop
              │
              └──< srv ──< vm ──< app ──< service
                            │
                            └──< db
*/
const NODES = [
  ci("rtr", "ROUTER"),
  ci("sw", "SWITCH"),
  ci("laptop", "LAPTOP"),
  ci("srv", "SERVER"),
  ci("vm", "VIRTUAL_MACHINE"),
  ci("app", "APPLICATION"),
  ci("db", "DATABASE"),
  ci("service", "BUSINESS_SERVICE"),
];

const EDGES = [
  dep("sw", "rtr", "CONNECTED_TO"),
  dep("laptop", "sw", "CONNECTED_TO"),
  dep("srv", "sw", "CONNECTED_TO"),
  dep("vm", "srv", "RUNS_ON"),
  dep("app", "vm", "HOSTED_ON"),
  dep("db", "vm", "HOSTED_ON"),
  dep("service", "app", "DELIVERED_BY"),
];

function withStatus(id: string, status: CiStatus) {
  return NODES.map((n) => (n.id === id ? { ...n, status } : n));
}

describe("computeImpact", () => {
  it("leaves a healthy estate operational", () => {
    const { state } = computeImpact(NODES, EDGES);
    expect([...state.values()].every((s) => s === "OPERATIONAL")).toBe(true);
  });

  it("marks everything downstream of a failed router as impacted", () => {
    // The headline case: the router dies, and every device carried by it goes
    // red — not just the switch plugged directly into it.
    const { state } = computeImpact(withStatus("rtr", "DOWN"), EDGES);
    expect(state.get("rtr")).toBe("DOWN");
    for (const id of ["sw", "laptop", "srv", "vm", "app", "db", "service"]) {
      expect(state.get(id)).toBe("IMPACTED");
    }
  });

  it("marks applications hosted on a failed server as impacted", () => {
    const { state } = computeImpact(withStatus("srv", "DOWN"), EDGES);
    expect(state.get("srv")).toBe("DOWN");
    expect(state.get("vm")).toBe("IMPACTED");
    expect(state.get("app")).toBe("IMPACTED");
    expect(state.get("db")).toBe("IMPACTED");
    expect(state.get("service")).toBe("IMPACTED");
    // Sideways neighbours are untouched — the laptop does not care about the
    // server, and saying it does would make the whole map useless.
    expect(state.get("laptop")).toBe("OPERATIONAL");
    expect(state.get("rtr")).toBe("OPERATIONAL");
  });

  it("does not propagate upstream to what the failed CI depends on", () => {
    const { state } = computeImpact(withStatus("app", "DOWN"), EDGES);
    expect(state.get("app")).toBe("DOWN");
    expect(state.get("service")).toBe("IMPACTED");
    expect(state.get("vm")).toBe("OPERATIONAL");
    expect(state.get("srv")).toBe("OPERATIONAL");
  });

  it("records which failure caused each impact", () => {
    const { causes } = computeImpact(withStatus("rtr", "DOWN"), EDGES);
    expect(causes.get("laptop")).toEqual(["rtr"]);
    expect(causes.get("service")).toEqual(["rtr"]);
  });

  it("keeps a CI's own outage ahead of an inherited one", () => {
    const nodes = NODES.map((n) =>
      n.id === "rtr" ? { ...n, status: "DOWN" as CiStatus } : n.id === "app" ? { ...n, status: "DOWN" as CiStatus } : n
    );
    const { state } = computeImpact(nodes, EDGES);
    expect(state.get("app")).toBe("DOWN"); // not downgraded to IMPACTED
  });

  it("propagates a degraded dependency as degraded, not as an outage", () => {
    const { state } = computeImpact(withStatus("sw", "DEGRADED"), EDGES);
    expect(state.get("sw")).toBe("DEGRADED");
    expect(state.get("laptop")).toBe("DEGRADED");
    expect(state.get("app")).toBe("DEGRADED");
  });

  it("lets a real outage outrank a degradation reaching the same CI", () => {
    const nodes = NODES.map((n) =>
      n.id === "sw" ? { ...n, status: "DEGRADED" as CiStatus } : n.id === "vm" ? { ...n, status: "DOWN" as CiStatus } : n
    );
    const { state } = computeImpact(nodes, EDGES);
    expect(state.get("app")).toBe("IMPACTED");
  });

  it("does not treat planned maintenance as an outage", () => {
    // Patch night must not light the whole map red, or nobody will trust it.
    const { state } = computeImpact(withStatus("srv", "MAINTENANCE"), EDGES);
    expect(state.get("srv")).toBe("MAINTENANCE");
    expect(state.get("app")).toBe("OPERATIONAL");
  });

  it("does not relabel or propagate through a retired CI", () => {
    const nodes = NODES.map((n) =>
      n.id === "rtr" ? { ...n, status: "DOWN" as CiStatus } : n.id === "sw" ? { ...n, status: "RETIRED" as CiStatus } : n
    );
    const { state } = computeImpact(nodes, EDGES);
    expect(state.get("sw")).toBe("RETIRED");
    expect(state.get("laptop")).toBe("OPERATIONAL");
  });

  it("terminates on a dependency cycle", () => {
    // Two switches uplinked to each other is ordinary, and must not hang.
    const nodes = [ci("a", "SWITCH", "DOWN"), ci("b", "SWITCH"), ci("c", "LAPTOP")];
    const edges = [dep("b", "a"), dep("a", "b"), dep("c", "b")];
    const { state } = computeImpact(nodes, edges);
    expect(state.get("a")).toBe("DOWN");
    expect(state.get("b")).toBe("IMPACTED");
    expect(state.get("c")).toBe("IMPACTED");
  });

  it("ignores a self-referencing edge", () => {
    const nodes = [ci("a", "SWITCH", "DOWN")];
    expect(() => computeImpact(nodes, [dep("a", "a")])).not.toThrow();
  });

  it("handles an estate with no relationships at all", () => {
    const { state } = computeImpact([ci("lonely", "LAPTOP", "DOWN")], []);
    expect(state.get("lonely")).toBe("DOWN");
  });
});

describe("blastRadius", () => {
  it("lists everything that would break, before it breaks", () => {
    expect([...blastRadius("sw", EDGES)].sort()).toEqual(["app", "db", "laptop", "service", "srv", "vm"]);
  });

  it("is empty for a leaf nothing depends on", () => {
    expect(blastRadius("laptop", EDGES).size).toBe(0);
  });

  it("never includes the root itself, even in a cycle", () => {
    const edges = [dep("b", "a"), dep("a", "b")];
    expect(blastRadius("a", edges).has("a")).toBe(false);
  });
});

describe("buildForest", () => {
  it("roots the tree on infrastructure and includes every CI once", () => {
    const impact = computeImpact(NODES, EDGES);
    const forest = buildForest(NODES, EDGES, impact);
    expect(forest).toHaveLength(1);
    expect(forest[0].node.id).toBe("rtr");
    expect(countTree(forest)).toBe(NODES.length);
  });

  it("marks the connector broken on children of a failed CI", () => {
    const nodes = withStatus("rtr", "DOWN");
    const forest = buildForest(nodes, EDGES, computeImpact(nodes, EDGES));
    const rtr = forest[0];
    expect(rtr.linkBroken).toBe(false); // a root has no incoming connector
    expect(rtr.children.every((c) => c.linkBroken)).toBe(true);
  });

  it("leaves connectors intact when the estate is healthy", () => {
    const forest = buildForest(NODES, EDGES, computeImpact(NODES, EDGES));
    const anyBroken = (t: (typeof forest)[number]): boolean =>
      t.linkBroken || t.children.some(anyBroken);
    expect(forest.some(anyBroken)).toBe(false);
  });

  it("counts extra dependencies it could not draw as tree edges", () => {
    // An app on a VM that also calls a database has two dependencies but one
    // parent; the second must be surfaced, not dropped.
    const nodes = [ci("vm", "VIRTUAL_MACHINE"), ci("db", "DATABASE"), ci("app", "APPLICATION")];
    const edges = [dep("app", "vm", "HOSTED_ON"), dep("app", "db", "USES")];
    const forest = buildForest(nodes, edges, computeImpact(nodes, edges));
    const app = forest.flatMap((r) => r.children).find((c) => c.node.id === "app");
    expect(app?.otherDependencyCount).toBe(1);
  });

  it("sorts failing children ahead of healthy ones", () => {
    const nodes = [ci("sw", "SWITCH"), ci("aaa", "LAPTOP"), ci("zzz", "LAPTOP", "DOWN")];
    const edges = [dep("aaa", "sw"), dep("zzz", "sw")];
    const forest = buildForest(nodes, edges, computeImpact(nodes, edges));
    expect(forest[0].children.map((c) => c.node.id)).toEqual(["zzz", "aaa"]);
  });

  it("does not lose CIs caught in a parent cycle", () => {
    const nodes = [ci("a", "SWITCH"), ci("b", "SWITCH")];
    const edges = [dep("a", "b"), dep("b", "a")];
    const forest = buildForest(nodes, edges, computeImpact(nodes, edges));
    expect(countTree(forest)).toBe(2);
  });

  it("returns a path to a node buried in the tree", () => {
    const forest = buildForest(NODES, EDGES, computeImpact(NODES, EDGES));
    expect(pathTo(forest, "service")).toEqual(["rtr", "sw", "srv", "vm", "app", "service"]);
  });

  it("returns an empty path for an unknown id", () => {
    const forest = buildForest(NODES, EDGES, computeImpact(NODES, EDGES));
    expect(pathTo(forest, "nope")).toEqual([]);
  });
});
