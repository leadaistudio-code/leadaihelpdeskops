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
    dbUser = await prisma.user.create({
      data: {
        email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
        role: "EMPLOYEE",
      }
    });
  }

  return dbUser;
}
