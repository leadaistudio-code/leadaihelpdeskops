import "dotenv/config";
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Which tenant this seed writes into. `domain` no longer defaults to "global"
// in the schema, so seeding must say where its rows belong. Pass the Clerk
// organization id you want to populate.
const SEED_DOMAIN = process.env.SEED_DOMAIN?.trim();
if (!SEED_DOMAIN) {
  throw new Error("Set SEED_DOMAIN to the tenant (Clerk org id) this seed should write into.");
}
const domain = SEED_DOMAIN;

async function main() {
  const defaultPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ithelpdesk.com' },
    update: { password: defaultPassword },
    create: {
      email: 'admin@ithelpdesk.com',
      name: 'System Admin',
      password: defaultPassword,
      role: 'ADMIN',
      department: 'IT Infrastructure',
      domain,
    },
  })

  const agent = await prisma.user.upsert({
    where: { email: 'agent@ithelpdesk.com' },
    update: { password: defaultPassword },
    create: {
      email: 'agent@ithelpdesk.com',
      name: 'Marcus Reed',
      password: defaultPassword,
      role: 'IT_AGENT',
      department: 'IT Service Desk',
      domain,
    },
  })

  const user1 = await prisma.user.upsert({
    where: { email: 'jane.doe@company.com' },
    update: { password: defaultPassword },
    create: {
      email: 'jane.doe@company.com',
      name: 'Elena Rossi',
      password: defaultPassword,
      role: 'EMPLOYEE',
      department: 'Marketing',
      domain,
    },
  })

  const asset1 = await prisma.asset.upsert({
    where: { assetTag: 'MAC-2024-042' },
    update: {},
    create: {
      assetTag: 'MAC-2024-042',
      name: 'MacBook Pro 16" M3',
      category: 'Hardware',
      status: 'IN_USE',
      assigneeId: user1.id,
      notes: 'Standard developer laptop',
      domain,
    }
  })

  const asset2 = await prisma.asset.upsert({
    where: { assetTag: 'SFT-O365-911' },
    update: {},
    create: {
      assetTag: 'SFT-O365-911',
      name: 'Office 365 Enterprise',
      category: 'Software License',
      status: 'IN_USE',
      assigneeId: agent.id,
      domain,
    }
  })

  const asset3 = await prisma.asset.upsert({
    where: { assetTag: 'MON-DELL-882' },
    update: {},
    create: {
      assetTag: 'MON-DELL-882',
      name: 'Dell 27" 4K Monitor',
      category: 'Peripherals',
      status: 'IN_STOCK',
      domain,
    }
  })

  console.log({ admin, agent, user1, asset1, asset2, asset3 })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
