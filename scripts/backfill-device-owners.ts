/**
 * Link existing devices to their app-user owner.
 *
 * Devices predating the ownerId column have no owner. This best-effort match
 * (same conservative logic as enrollment) links the unambiguous ones so the
 * chatbot's "my device health" resolves without waiting for re-enrollment or
 * manual assignment. Ambiguous devices stay unlinked — assign those in the UI.
 *
 * Run after `prisma db push`:
 *   npx tsx --env-file=.env scripts/backfill-device-owners.ts
 *
 * Idempotent: only touches devices that still have ownerId === null.
 */
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { pickOwner } from "../src/lib/device-owner";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const devices = await prisma.device.findMany({
    where: { ownerId: null },
    select: { id: true, hostname: true, user: true, domain: true },
  });

  if (devices.length === 0) {
    console.log("No unlinked devices — nothing to backfill.");
    return;
  }

  // Candidate users per tenant, fetched once.
  const domains = [...new Set(devices.map((d) => d.domain))];
  const usersByDomain = new Map<string, { id: string; name: string; email: string }[]>();
  for (const domain of domains) {
    usersByDomain.set(
      domain,
      await prisma.user.findMany({ where: { domain }, select: { id: true, name: true, email: true } })
    );
  }

  let linked = 0;
  for (const d of devices) {
    const ownerId = pickOwner(usersByDomain.get(d.domain) ?? [], d.user);
    if (!ownerId) {
      console.log(`  · ${d.hostname} (${d.user ?? "no OS user"}) — no confident match, left unlinked`);
      continue;
    }
    await prisma.device.update({ where: { id: d.id }, data: { ownerId } });
    linked++;
    console.log(`  + ${d.hostname} → owner ${ownerId}`);
  }

  console.log(`\nLinked ${linked} of ${devices.length} unlinked device(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
