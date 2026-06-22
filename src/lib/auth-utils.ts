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
        domain: activeDomain,
      }
    });
  } else if (
    (user.publicMetadata?.role && clerkRole !== dbUser.role) ||
    dbUser.domain !== activeDomain
  ) {
    // Keep the database in sync with Clerk (role + active tenant).
    dbUser = await prisma.user.update({
      where: { email },
      data: { role: clerkRole, domain: activeDomain }
    });
  }

  return dbUser;
}
