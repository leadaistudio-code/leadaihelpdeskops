"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CiStatus } from "@prisma/client";
import { getActiveDomain } from "@/lib/tenant";
import { getSessionUser, requireAgent } from "@/lib/auth-utils";
import { logAudit } from "@/lib/audit";
import { computeImpact, buildForest, blastRadius, type CiNode, type CiEdge } from "@/lib/cmdb-impact";

// Everything in this file is a public HTTP endpoint by virtue of "use server",
// so every export authorizes its caller and scopes its queries to the tenant.

// Hard ceiling on how much of the estate one request will pull. A CMDB is the
// model most likely to grow without anyone noticing, and the whole graph has to
// be in memory to compute impact — so the bound is explicit and the UI is told
// when it has been hit rather than silently shown a partial map.
const MAX_CIS = 2_000;
const MAX_EDGES = 8_000;

export type CmdbGraph = {
  // The raw graph, for the map: it needs to lay out its own columns and route
  // its own links, which a pre-shaped tree cannot express.
  nodes: CiNode[];
  edges: CiEdge[];
  // The same data pre-shaped as a tree, for the list view.
  forest: ReturnType<typeof buildForest>;
  // Effective state per CI id, as pairs so it survives the server → client
  // boundary (a Map does not serialise).
  states: [string, string][];
  total: number;
  truncated: boolean;
  counts: { down: number; impacted: number; degraded: number; operational: number };
};

export async function getCmdbGraph(): Promise<CmdbGraph> {
  // A read of the estate's shape. Any signed-in member of the tenant may see
  // it — the domain filter below does the isolation — but it is not public.
  if (!(await getSessionUser())) throw new Error("Not authorized");
  const domain = await getActiveDomain();

  const [items, rels] = await Promise.all([
    prisma.configurationItem.findMany({
      where: { domain },
      select: {
        id: true,
        ciId: true,
        name: true,
        type: true,
        status: true,
        criticality: true,
        location: true,
        ipAddress: true,
        owner: true,
      },
      orderBy: { ciId: "asc" },
      take: MAX_CIS,
    }),
    prisma.ciRelationship.findMany({
      where: { domain },
      select: { sourceId: true, targetId: true, type: true },
      take: MAX_EDGES,
    }),
  ]);

  const nodes: CiNode[] = items.map((i) => ({ ...i, type: i.type as string, status: i.status as CiNode["status"] }));

  // Drop edges pointing at CIs outside the page. Keeping them would make the
  // impact engine reference nodes it cannot see and quietly under-report.
  const known = new Set(nodes.map((n) => n.id));
  const edges: CiEdge[] = rels.filter((r) => known.has(r.sourceId) && known.has(r.targetId));

  const impact = computeImpact(nodes, edges);
  const forest = buildForest(nodes, edges, impact);

  const counts = { down: 0, impacted: 0, degraded: 0, operational: 0 };
  for (const s of impact.state.values()) {
    if (s === "DOWN") counts.down++;
    else if (s === "IMPACTED") counts.impacted++;
    else if (s === "DEGRADED") counts.degraded++;
    else counts.operational++;
  }

  return {
    nodes,
    edges,
    forest,
    states: [...impact.state.entries()],
    total: nodes.length,
    truncated: items.length === MAX_CIS,
    counts,
  };
}

export type CiDetail = {
  id: string;
  ciId: string;
  name: string;
  type: string;
  status: string;
  criticality: string;
  location: string | null;
  ipAddress: string | null;
  owner: string | null;
  notes: string | null;
  dependsOn: { id: string; ciId: string; name: string; type: string; status: string; relation: string }[];
  supports: { id: string; ciId: string; name: string; type: string; status: string; relation: string }[];
  // How many CIs stop working if this one fails — computed over the whole
  // graph, not just the direct neighbours the panel lists.
  blastRadiusCount: number;
};

export async function getCiDetail(id: string): Promise<CiDetail | null> {
  if (!(await getSessionUser())) throw new Error("Not authorized");
  const domain = await getActiveDomain();

  const ci = await prisma.configurationItem.findFirst({
    where: { id, domain },
    include: {
      dependencies: { include: { target: true }, take: 100 },
      dependents: { include: { source: true }, take: 100 },
    },
  });
  if (!ci) return null;

  const rels = await prisma.ciRelationship.findMany({
    where: { domain },
    select: { sourceId: true, targetId: true, type: true },
    take: MAX_EDGES,
  });

  return {
    id: ci.id,
    ciId: ci.ciId,
    name: ci.name,
    type: ci.type,
    status: ci.status,
    criticality: ci.criticality,
    location: ci.location,
    ipAddress: ci.ipAddress,
    owner: ci.owner,
    notes: ci.notes,
    dependsOn: ci.dependencies.map((r) => ({
      id: r.target.id,
      ciId: r.target.ciId,
      name: r.target.name,
      type: r.target.type,
      status: r.target.status,
      relation: r.type,
    })),
    supports: ci.dependents.map((r) => ({
      id: r.source.id,
      ciId: r.source.ciId,
      name: r.source.name,
      type: r.source.type,
      status: r.source.status,
      relation: r.type,
    })),
    blastRadiusCount: blastRadius(ci.id, rels).size,
  };
}

// Set a CI's operational status. Staff-only: this drives the impact map, and
// therefore what everyone else believes is broken.
export async function setCiStatus(id: string, status: CiStatus) {
  const actor = await requireAgent();
  const domain = await getActiveDomain();

  const before = await prisma.configurationItem.findFirst({
    where: { id, domain },
    select: { ciId: true, name: true, status: true },
  });
  if (!before) throw new Error("Configuration item not found");

  // updateMany, not update: the tenant must be part of the WHERE clause.
  const res = await prisma.configurationItem.updateMany({ where: { id, domain }, data: { status } });
  if (res.count === 0) throw new Error("Configuration item not found");

  await logAudit({
    domain,
    action: "STATE_CHANGE",
    entityType: "ConfigurationItem",
    entityId: id,
    entityLabel: before.ciId,
    summary: `${before.name} status changed to ${status}`,
    field: "status",
    oldValue: before.status,
    newValue: status,
    actor: { id: actor.id, name: actor.name, email: actor.email },
  });

  revalidatePath("/cmdb");
  return { ok: true };
}
