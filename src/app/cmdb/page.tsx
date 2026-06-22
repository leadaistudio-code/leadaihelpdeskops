export const dynamic = "force-dynamic";

import { getAssets } from "@/app/actions/assetActions";
import CmdbView, { type CmdbNode } from "@/components/CmdbView";

type Status = CmdbNode["status"];

// Map an asset's lifecycle status to a CI health state.
function assetStatus(status: string): Status {
  if (status === "MISSING") return "Critical";
  if (status === "RETIRED") return "Warning";
  return "Healthy"; // IN_USE, IN_STOCK
}

// A parent rolls up the worst health of its children.
function rollUp(children: CmdbNode[]): Status {
  if (children.some((c) => c.status === "Critical")) return "Critical";
  if (children.some((c) => c.status === "Warning")) return "Warning";
  return "Healthy";
}

// Pick a node icon based on the asset category.
function iconForCategory(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("server")) return "server";
  if (c.includes("data") || c.includes("db")) return "db";
  if (c.includes("network")) return "group";
  if (c.includes("hardware") || c.includes("laptop") || c.includes("device")) return "laptop";
  if (c.includes("software") || c.includes("cloud") || c.includes("app")) return "cpu";
  return "box";
}

export default async function CMDBPage() {
  const assets = await getAssets();

  let tree: CmdbNode | null = null;

  if (assets.length > 0) {
    // Group assets by category into mid-level nodes under a root business service.
    const byCategory = new Map<string, typeof assets>();
    for (const a of assets) {
      const key = a.category || "Uncategorized";
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key)!.push(a);
    }

    const groups: CmdbNode[] = Array.from(byCategory.entries()).map(([category, items]) => {
      const leaves: CmdbNode[] = items.map((a) => ({
        id: a.assetTag,
        name: a.name,
        type: a.category,
        status: assetStatus(a.status),
        iconKey: iconForCategory(a.category),
        assignee: a.assignee?.name ?? null,
        children: [],
      }));
      return {
        id: `GRP-${category.toUpperCase().replace(/\s+/g, "-")}`,
        name: category,
        type: "CI Group",
        status: rollUp(leaves),
        iconKey: "group",
        children: leaves,
      };
    });

    tree = {
      id: "BS-001",
      name: "IT Infrastructure",
      type: "Business Service",
      status: rollUp(groups),
      iconKey: "service",
      children: groups,
    };
  }

  return <CmdbView tree={tree} />;
}
