import { currentUser, auth } from "@clerk/nextjs/server";
import { Role } from "@prisma/client";
import prisma from "@/lib/prisma";

// Coerce arbitrary Clerk publicMetadata into a valid Role, defaulting to EMPLOYEE.
function toRole(value: unknown): Role {
  return typeof value === "string" && value in Role
    ? (value as Role)
    : Role.EMPLOYEE;
}

export async function getSessionUser() {
  const user = await currentUser();
  if (!user) return null;

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  let dbUser = await prisma.user.findUnique({
    where: { email }
  });

  const clerkRole = toRole(user.publicMetadata?.role);
  const clerkModules = Array.isArray(user.publicMetadata?.modules)
    ? (user.publicMetadata.modules as string[])
    : ["SELF_SERVICE"];
  
  // The active organization is the tenant; mirror it onto the user row so
  // per-tenant user lists resolve correctly.
  const { orgId } = await auth();
  const activeDomain = orgId ?? "global";

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
        role: clerkRole,
        moduleAccess: clerkModules,
        domain: activeDomain,
      }
    });
  } else if (
    (user.publicMetadata?.role && clerkRole !== dbUser.role) ||
    dbUser.domain !== activeDomain ||
    (user.publicMetadata?.modules && JSON.stringify(clerkModules) !== JSON.stringify(dbUser.moduleAccess))
  ) {
    // Keep the database in sync with Clerk (role + active tenant).
    dbUser = await prisma.user.update({
      where: { email },
      data: { role: clerkRole, moduleAccess: clerkModules, domain: activeDomain }
    });
  }

  return dbUser;
}

// The signed-in user, asserted to be IT staff. Throws otherwise.
//
// Server actions are public HTTP endpoints: hiding a control in the UI does not
// stop anyone from invoking the action directly, so every staff-only mutation
// must call this rather than rely on the page not rendering a button.
export async function requireAgent() {
  const user = await getSessionUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "IT_AGENT")) {
    throw new Error("Not authorized");
  }
  return user;
}
