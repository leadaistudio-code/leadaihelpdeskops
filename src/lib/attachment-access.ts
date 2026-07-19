import { Prisma, Role } from "@prisma/client";

type Viewer = { id: string; role: Role };

// Attachment carries no `domain` column of its own — it hangs off either an
// incident or a knowledge article. So tenant isolation has to be expressed
// through the parent relation rather than a flat `where: { domain }`.
//
// An orphaned attachment (neither parent set) matches nothing and is therefore
// unreachable, which is the safe default.
export function attachmentVisibleTo(viewer: Viewer, domain: string): Prisma.AttachmentWhereInput {
  const isAgent = viewer.role === "ADMIN" || viewer.role === "IT_AGENT";
  return {
    OR: [
      // Staff see any ticket in their tenant; an employee only their own.
      { incident: { domain, ...(isAgent ? {} : { callerId: viewer.id }) } },
      // Knowledge articles are readable tenant-wide.
      { article: { domain } },
    ],
  };
}
