import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.softwareUsage.deleteMany({
    where: { id: { startsWith: 'cuid_sw_' } }
  });
  console.log(`Deleted ${result.count} mock software usages.`);
}
main().finally(() => prisma.$disconnect());
