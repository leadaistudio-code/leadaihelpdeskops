import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  console.log('Devices:', await prisma.device.findMany({ select: { id: true, deviceKey: true, domain: true } }));
  console.log('Tokens:', await prisma.enrollmentToken.findMany());
}
run().then(() => process.exit(0));
