import { PrismaClient, Role, AssetStatus, TicketType, Priority } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting DB seeding...");

  // Seed Users
  const departments = ["Engineering", "Sales", "HR", "Marketing", "Finance", "IT"];
  const userIds: string[] = [];

  for (let i = 1; i <= 50; i++) {
    const user = await prisma.user.upsert({
      where: { email: `user${i}@company.com` },
      update: {},
      create: {
        name: `Employee ${i}`,
        email: `user${i}@company.com`,
        role: Role.EMPLOYEE,
        department: departments[i % departments.length],
      },
    });
    userIds.push(user.id);
  }

  // Ensure Admin exists
  await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@company.com',
      role: Role.ADMIN,
      department: 'IT',
    },
  });

  console.log("Seeded 50 users.");

  // Seed Assets
  const assetTypes = [
    { cat: "Hardware", prefix: "LT", models: ["Dell XPS 15", "Apple MacBook Pro 16", "Lenovo ThinkPad X1", "HP EliteBook"] },
    { cat: "Server", prefix: "SRV", models: ["Dell PowerEdge R740", "HPE ProLiant DL380", "Cisco UCS C220"] },
    { cat: "Network", prefix: "NET", models: ["Cisco Catalyst 9300", "Juniper EX4300", "Palo Alto PA-3200"] },
  ];

  const statuses = [AssetStatus.IN_USE, AssetStatus.IN_STOCK, AssetStatus.RETIRED];

  for (let i = 1; i <= 100; i++) {
    const typeGroup = assetTypes[i % assetTypes.length];
    const model = typeGroup.models[i % typeGroup.models.length];
    const status = statuses[i % statuses.length];
    
    // Assign asset to random user if IN_USE
    const assigneeId = status === AssetStatus.IN_USE ? userIds[i % userIds.length] : null;

    await prisma.asset.upsert({
      where: { assetTag: `${typeGroup.prefix}-${1000 + i}` },
      update: {},
      create: {
        assetTag: `${typeGroup.prefix}-${1000 + i}`,
        name: model,
        category: typeGroup.cat,
        status: status,
        assigneeId: assigneeId,
        notes: "Automatically seeded asset.",
      },
    });
  }

  console.log("Seeded 100 assets.");

  // Seed SLA Definitions
  await prisma.slaDefinition.createMany({
    skipDuplicates: true,
    data: [
      { name: "P1 Critical Incident Resolution", type: TicketType.INCIDENT, priority: Priority.CRITICAL, durationHours: 4 },
      { name: "P2 High Incident Resolution", type: TicketType.INCIDENT, priority: Priority.HIGH, durationHours: 8 },
      { name: "P3 Medium Incident Resolution", type: TicketType.INCIDENT, priority: Priority.MEDIUM, durationHours: 24 },
      { name: "P4 Low Incident Resolution", type: TicketType.INCIDENT, priority: Priority.LOW, durationHours: 72 },
      { name: "High Value Request Fulfillment", type: TicketType.REQUEST, priority: Priority.HIGH, durationHours: 48 },
      { name: "Standard Request Fulfillment", type: TicketType.REQUEST, priority: Priority.MEDIUM, durationHours: 120 },
    ]
  });
  console.log("Seeded SLA Definitions.");

  console.log("DB seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
