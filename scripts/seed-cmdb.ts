/**
 * Populate the CMDB with a realistic estate for evaluating the dependency map.
 *
 *   npx tsx --env-file=.env scripts/seed-cmdb.ts
 *
 * Requires SEED_DOMAIN — the Clerk organization id to seed into. This is a
 * deliberate, operator-run script and it will never run on a request path.
 * The audit found demo data being auto-inserted into real tenants on every
 * dashboard load, which silently populated a customer's security posture with
 * fiction; that pattern is not repeated here. If SEED_DOMAIN is unset the
 * script refuses rather than guessing a tenant.
 *
 * Pass --wipe to replace the tenant's existing CIs instead of adding to them.
 *
 * The topology is built to exercise the impact engine, not just to fill a
 * table: two sites behind core routers, distribution switches, wireless APs,
 * hypervisors carrying VMs, applications hosted on those VMs, databases they
 * call, business services delivered by the applications, and end-user devices
 * hanging off the access layer. Everything is reachable from a core router, so
 * marking one DOWN cascades across roughly half the estate.
 */
import { Pool } from "pg";
import { PrismaClient, CiType, CiStatus, CiCriticality, CiRelationType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const DOMAIN = process.env.SEED_DOMAIN?.trim();
const WIPE = process.argv.includes("--wipe");

// Deterministic PRNG so a reseed produces the same estate and screenshots or
// bug reports stay comparable. Math.random would make every run different.
let seed = 20260803;
function rand() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)];

type Draft = {
  ciId: string;
  name: string;
  type: CiType;
  status: CiStatus;
  criticality: CiCriticality;
  location?: string;
  ipAddress?: string;
  owner?: string;
};

const cis: Draft[] = [];
const edges: { source: string; target: string; type: CiRelationType }[] = [];

let counter = 0;
function add(d: Omit<Draft, "ciId">): string {
  counter += 1;
  const ciId = `CI${String(counter).padStart(7, "0")}`;
  cis.push({ ...d, ciId });
  return ciId;
}
// `source` depends on `target`.
function link(source: string, target: string, type: CiRelationType) {
  edges.push({ source, target, type });
}

const SITES = [
  { name: "London HQ", short: "LON", subnet: "10.10" },
  { name: "Manchester Office", short: "MAN", subnet: "10.20" },
];

const OWNERS = ["Network Team", "Platform Team", "Service Desk", "Data Team", "Security"];
const PERSONAS = ["Finance", "Sales", "Engineering", "Support", "HR", "Operations"];

for (const site of SITES) {
  const siteId = add({
    name: site.name,
    type: CiType.SITE,
    status: CiStatus.OPERATIONAL,
    criticality: CiCriticality.CRITICAL,
    location: site.name,
  });

  // --- Core network -------------------------------------------------------
  const router = add({
    name: `${site.short}-CORE-RTR-01`,
    type: CiType.ROUTER,
    status: CiStatus.OPERATIONAL,
    criticality: CiCriticality.CRITICAL,
    location: site.name,
    ipAddress: `${site.subnet}.0.1`,
    owner: "Network Team",
  });
  link(router, siteId, CiRelationType.DEPENDS_ON);

  const firewall = add({
    name: `${site.short}-FW-01`,
    type: CiType.FIREWALL,
    status: CiStatus.OPERATIONAL,
    criticality: CiCriticality.CRITICAL,
    location: site.name,
    ipAddress: `${site.subnet}.0.2`,
    owner: "Security",
  });
  link(firewall, router, CiRelationType.CONNECTED_TO);

  // --- Distribution / access layer ---------------------------------------
  const switches: string[] = [];
  const switchCount = site.short === "LON" ? 4 : 2;
  for (let s = 1; s <= switchCount; s++) {
    const sw = add({
      name: `${site.short}-SW-${String(s).padStart(2, "0")}`,
      type: CiType.SWITCH,
      status: CiStatus.OPERATIONAL,
      criticality: CiCriticality.HIGH,
      location: `${site.name} · Floor ${s}`,
      ipAddress: `${site.subnet}.${s}.1`,
      owner: "Network Team",
    });
    link(sw, router, CiRelationType.CONNECTED_TO);
    switches.push(sw);

    const ap = add({
      name: `${site.short}-AP-${String(s).padStart(2, "0")}`,
      type: CiType.WIRELESS_AP,
      status: CiStatus.OPERATIONAL,
      criticality: CiCriticality.MEDIUM,
      location: `${site.name} · Floor ${s}`,
      ipAddress: `${site.subnet}.${s}.2`,
      owner: "Network Team",
    });
    link(ap, sw, CiRelationType.CONNECTED_TO);
    switches.push(ap);
  }

  // --- Compute (London only; Manchester is a branch office) ---------------
  if (site.short === "LON") {
    const lb = add({
      name: "LON-LB-01",
      type: CiType.LOAD_BALANCER,
      status: CiStatus.OPERATIONAL,
      criticality: CiCriticality.CRITICAL,
      location: site.name,
      ipAddress: "10.10.5.10",
      owner: "Platform Team",
    });
    link(lb, switches[0], CiRelationType.CONNECTED_TO);

    const san = add({
      name: "LON-SAN-01",
      type: CiType.STORAGE,
      status: CiStatus.OPERATIONAL,
      criticality: CiCriticality.CRITICAL,
      location: `${site.name} · Data hall`,
      ipAddress: "10.10.6.10",
      owner: "Platform Team",
    });
    link(san, switches[0], CiRelationType.CONNECTED_TO);

    const apps: string[] = [];

    for (let h = 1; h <= 3; h++) {
      const host = add({
        name: `LON-ESX-${String(h).padStart(2, "0")}`,
        type: CiType.SERVER,
        status: CiStatus.OPERATIONAL,
        criticality: CiCriticality.CRITICAL,
        location: `${site.name} · Data hall`,
        ipAddress: `10.10.6.${20 + h}`,
        owner: "Platform Team",
      });
      link(host, switches[0], CiRelationType.CONNECTED_TO);
      link(host, san, CiRelationType.DEPENDS_ON);

      for (let v = 1; v <= 4; v++) {
        const vm = add({
          name: `LON-VM-${h}${String(v).padStart(2, "0")}`,
          type: CiType.VIRTUAL_MACHINE,
          status: CiStatus.OPERATIONAL,
          criticality: CiCriticality.HIGH,
          location: `${site.name} · Data hall`,
          ipAddress: `10.10.7.${h * 10 + v}`,
          owner: "Platform Team",
        });
        link(vm, host, CiRelationType.RUNS_ON);

        // Two of every four VMs carry a database; the rest carry applications.
        if (v % 2 === 0) {
          const db = add({
            name: `${pick(["Orders", "Billing", "Identity", "Inventory", "Reporting", "CRM"])} DB (VM-${h}${v})`,
            type: CiType.DATABASE,
            status: CiStatus.OPERATIONAL,
            criticality: CiCriticality.CRITICAL,
            owner: "Data Team",
          });
          link(db, vm, CiRelationType.HOSTED_ON);
        } else {
          const app = add({
            name: pick(["Payroll", "Expenses", "Timesheets", "Helpdesk Portal", "Warehouse", "Analytics"]) + ` (VM-${h}${v})`,
            type: CiType.APPLICATION,
            status: CiStatus.OPERATIONAL,
            criticality: CiCriticality.HIGH,
            owner: "Platform Team",
          });
          link(app, vm, CiRelationType.HOSTED_ON);
          link(app, lb, CiRelationType.DEPENDS_ON);
          apps.push(app);
        }
      }
    }

    // Databases are shared: each application calls one, so a single database
    // outage crosses hosts. This is what makes the map worth having — the
    // blast radius is not the rack diagram.
    const dbs = cis.filter((c) => c.type === CiType.DATABASE).map((c) => c.ciId);
    for (const app of apps) link(app, pick(dbs), CiRelationType.USES);

    for (const svc of ["Employee Services", "Customer Portal", "Finance Operations"]) {
      const service = add({
        name: svc,
        type: CiType.BUSINESS_SERVICE,
        status: CiStatus.OPERATIONAL,
        criticality: CiCriticality.CRITICAL,
        owner: "Service Desk",
      });
      // Each service is delivered by two applications.
      link(service, pick(apps), CiRelationType.DELIVERED_BY);
      link(service, pick(apps), CiRelationType.DELIVERED_BY);
    }
  }

  // --- End-user devices ---------------------------------------------------
  const endpointCount = site.short === "LON" ? 34 : 18;
  for (let d = 1; d <= endpointCount; d++) {
    const isLaptop = rand() > 0.3;
    const persona = pick(PERSONAS);
    const device = add({
      name: `${site.short}-${isLaptop ? "LT" : "DT"}-${String(d).padStart(3, "0")}`,
      type: isLaptop ? CiType.LAPTOP : CiType.DESKTOP,
      status: CiStatus.OPERATIONAL,
      criticality: CiCriticality.LOW,
      location: site.name,
      ipAddress: `${site.subnet}.${(d % switchCount) + 1}.${100 + d}`,
      owner: persona,
    });
    link(device, switches[(d * 2) % switches.length], CiRelationType.CONNECTED_TO);
  }

  const printer = add({
    name: `${site.short}-PRN-01`,
    type: CiType.PRINTER,
    status: CiStatus.OPERATIONAL,
    criticality: CiCriticality.LOW,
    location: site.name,
    ipAddress: `${site.subnet}.1.50`,
    owner: "Service Desk",
  });
  link(printer, switches[0], CiRelationType.CONNECTED_TO);
}

// A few CIs start unhealthy so the map shows something on first load. Chosen to
// demonstrate both propagation paths the feature exists for: one access switch
// down (endpoints go red) and one database down (applications and the business
// services above them go red).
function markStatus(predicate: (c: Draft) => boolean, status: CiStatus, limit = 1) {
  let n = 0;
  for (const c of cis) {
    if (n >= limit) break;
    if (predicate(c)) {
      c.status = status;
      n++;
    }
  }
}
markStatus((c) => c.type === CiType.SWITCH && c.name.startsWith("MAN-"), CiStatus.DOWN, 1);
markStatus((c) => c.type === CiType.DATABASE, CiStatus.DOWN, 1);
markStatus((c) => c.type === CiType.WIRELESS_AP, CiStatus.DEGRADED, 1);
markStatus((c) => c.type === CiType.LAPTOP, CiStatus.MAINTENANCE, 2);

async function main() {
  if (!DOMAIN) {
    console.error(
      "SEED_DOMAIN is not set. Set it to the Clerk organization id to seed into —\n" +
        "this script will not guess a tenant and write fabricated infrastructure into it."
    );
    process.exitCode = 1;
    return;
  }

  const existing = await prisma.configurationItem.count({ where: { domain: DOMAIN } });
  if (existing > 0 && !WIPE) {
    console.error(
      `Tenant ${DOMAIN} already has ${existing} configuration item(s).\n` +
        "Rerun with --wipe to replace them, or seed a different tenant."
    );
    process.exitCode = 1;
    return;
  }

  if (WIPE && existing > 0) {
    // Relationships cascade from the CI delete.
    await prisma.configurationItem.deleteMany({ where: { domain: DOMAIN } });
    console.log(`Removed ${existing} existing configuration item(s).`);
  }

  await prisma.configurationItem.createMany({
    data: cis.map((c) => ({
      ciId: c.ciId,
      name: c.name,
      type: c.type,
      status: c.status,
      criticality: c.criticality,
      location: c.location ?? null,
      ipAddress: c.ipAddress ?? null,
      owner: c.owner ?? null,
      domain: DOMAIN,
    })),
  });

  // Resolve the human ciIds to database ids for the relationship rows.
  const saved = await prisma.configurationItem.findMany({
    where: { domain: DOMAIN },
    select: { id: true, ciId: true },
  });
  const idOf = new Map(saved.map((s) => [s.ciId, s.id]));

  const relationshipRows = edges
    .map((e) => ({
      sourceId: idOf.get(e.source),
      targetId: idOf.get(e.target),
      type: e.type,
      domain: DOMAIN,
    }))
    .filter((r): r is { sourceId: string; targetId: string; type: CiRelationType; domain: string } =>
      Boolean(r.sourceId && r.targetId && r.sourceId !== r.targetId)
    );

  await prisma.ciRelationship.createMany({ data: relationshipRows, skipDuplicates: true });

  const byType = cis.reduce<Record<string, number>>((acc, c) => {
    acc[c.type] = (acc[c.type] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`\nSeeded ${cis.length} configuration items and ${relationshipRows.length} relationships into ${DOMAIN}.\n`);
  for (const [type, n] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(3)}  ${type}`);
  }
  const unhealthy = cis.filter((c) => c.status !== CiStatus.OPERATIONAL);
  console.log(`\nStarting with ${unhealthy.length} item(s) not operational, so the map has something to show:`);
  for (const c of unhealthy) console.log(`  · ${c.name} — ${c.status}`);
  console.log("\nOpen /cmdb. Set any CI to DOWN from the detail panel to watch the impact travel.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
