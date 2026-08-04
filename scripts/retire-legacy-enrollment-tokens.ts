/**
 * Drop the legacy permanent enrollment tokens so the new schema can be applied.
 *
 * `EnrollmentToken` used to be `{ domain @id, token, createdAt }` — one token
 * per tenant, valid forever, with no way to revoke or rotate it. The replacement
 * is expiring, use-capped, and revocable, which means the table gains a required
 * `expiresAt` and a new `id` primary key. Postgres cannot add those to rows that
 * already exist, and there is no sensible expiry to backfill onto a token whose
 * entire defect was that it never expired.
 *
 * So the legacy rows are deleted rather than migrated. This is deliberate:
 * those token values should stop working. Anyone holding one could enrol a
 * device indefinitely, which is the vulnerability being closed.
 *
 * Devices that are ALREADY enrolled are unaffected — they authenticate with
 * their own per-device `deviceKey`, not with the enrollment token. Only new
 * enrolments need a token, and an admin issues one from the DEX page.
 *
 * Run before `prisma db push`:
 *   npx tsx --env-file=.env scripts/retire-legacy-enrollment-tokens.ts
 *
 * Idempotent: a second run finds nothing to delete.
 */
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const { rows: cols } = await pool.query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'EnrollmentToken'`
  );
  const names = cols.map((c) => c.column_name);

  if (names.length === 0) {
    console.log("EnrollmentToken table does not exist yet — nothing to do.");
    return;
  }
  if (names.includes("id")) {
    console.log("EnrollmentToken already has the new schema — nothing to do.");
    return;
  }

  const { rows: existing } = await pool.query<{ domain: string; token: string }>(
    `SELECT domain, token FROM "EnrollmentToken"`
  );

  if (existing.length === 0) {
    console.log("No legacy enrollment tokens present.");
    return;
  }

  console.log(`Retiring ${existing.length} legacy permanent enrollment token(s):`);
  for (const r of existing) {
    // Never log the token itself — it is a live bearer secret until this commits.
    console.log(`  · tenant ${r.domain} (token ${r.token.slice(0, 8)}…)`);
  }

  await pool.query(`DELETE FROM "EnrollmentToken"`);
  console.log("\nDone. Now run: npx prisma db push");
  console.log("Admins re-issue a token from the DEX page; enrolled devices are unaffected.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
