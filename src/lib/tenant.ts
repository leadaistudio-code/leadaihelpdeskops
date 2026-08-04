import { auth } from "@clerk/nextjs/server";

// The tenant to scope every query to for the current request.
//
// The tenant IS the active Clerk Organization: `orgId` uniquely identifies the
// customer's dedicated space.
//
// This function throws rather than returning a fallback, and that is the whole
// point. It previously returned the literal string "global" both when there was
// no active org and when `auth()` threw — which made "global" a real, writable
// tenant that unassigned users and any transient auth error dropped into,
// sharing one bucket. A tenancy resolver that fails open is not a tenancy
// resolver. If you reach a caller that has no session, that caller needs an
// explicit tenant (see `getKioskDomain`), not a default.
export async function getActiveDomain(): Promise<string> {
  const { orgId } = await auth();
  if (!orgId) {
    throw new Error(
      "No active tenant for this request. The caller must belong to an organization."
    );
  }
  return orgId;
}

// The tenant a physically-sited, unauthenticated kiosk belongs to.
//
// The walk-up kiosk has no session, so it cannot resolve a tenant from auth. It
// must be told which one it stands in, via deployment config. Unset means the
// kiosk refuses to open tickets — the safe outcome. Silently filing them into a
// shared space is what this replaces.
export function getKioskDomain(): string {
  const domain = process.env.WALKUP_TENANT_DOMAIN?.trim();
  if (!domain) {
    throw new Error(
      "Walk-up kiosk is not bound to a tenant. Set WALKUP_TENANT_DOMAIN to the Clerk organization id this kiosk serves."
    );
  }
  return domain;
}
