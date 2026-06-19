import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function getSessionUser() {
  const user = await currentUser();
  if (!user) return null;
  
  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  let dbUser = await prisma.user.findUnique({
    where: { email }
  });

  if (!dbUser) {
    const clerkRole = (user.publicMetadata?.role as string) || "EMPLOYEE";
    dbUser = await prisma.user.create({
      data: {
        email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
        role: clerkRole,
      }
    });
  } else if (user.publicMetadata?.role && user.publicMetadata.role !== dbUser.role) {
    // Keep database in sync with Clerk metadata if it changes
    dbUser = await prisma.user.update({
      where: { email },
      data: { role: user.publicMetadata.role as string }
    });
  }

  return dbUser;
}
