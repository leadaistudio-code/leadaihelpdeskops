export const dynamic = "force-dynamic";

import { getCmdbGraph } from "@/app/actions/cmdbActions";
import CmdbMap from "@/components/CmdbMap";

// The CMDB reads from real configuration items and their relationships.
//
// It previously derived a fixed three-level tree from the asset register,
// grouped by category — which meant it could never answer the question a CMDB
// exists for: if this router fails, what stops working? Grouping is not a
// dependency, so nothing could be propagated along it.
export default async function CMDBPage() {
  const graph = await getCmdbGraph();
  return <CmdbMap graph={graph} />;
}
