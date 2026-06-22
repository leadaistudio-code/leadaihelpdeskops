import { auth } from "@clerk/nextjs/server";

// The tenant to scope every query to for the current request.
//
// The tenant IS the active Clerk Organization: `orgId` uniquely identifies the
// customer's dedicated space. Signed-in users without an active org are routed
// to onboarding (see middleware), so authenticated app traffic always carries
// one. Unauthenticated contexts (e.g. the public walk-up kiosk) fall back to
// the shared "global" space.
export async function getActiveDomain(): Promise<string> {
  try {
    const { orgId } = await auth();
    return orgId ?? "global";
  } catch {
    return "global";
  }
}
