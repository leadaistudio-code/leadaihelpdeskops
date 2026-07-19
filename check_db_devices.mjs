import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const tokens = await prisma.enrollmentToken.findMany();
  console.log("Tokens:", tokens);
  
  const devices = await prisma.device.findMany({
    select: { hostname: true, domain: true, lastSeenAt: true }
  });
  console.log("Devices:", devices);
}

main().finally(() => prisma.$disconnect())
