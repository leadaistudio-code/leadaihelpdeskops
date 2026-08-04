/**
 * Assign per-tenant sequence numbers to audit rows that predate the hash chain.
 *
 * `AuditLog` gained a `(domain, seq)` unique constraint so concurrent writers
 * cannot both claim the same position in the chain. Existing rows all carry the
 * column default of 0, so the constraint cannot be created until they are given
 * distinct positions.
 *
 * Backfilled rows keep `hash = NULL` on purpose. Their contents were never
 * hashed, so claiming they are chain-verified would be a false guarantee;
 * `verifyAuditChain()` skips null-hash rows and starts the real chain at the
 * first row written after this migration.
 *
 * Run before `prisma db push`:
 *   npx tsx --env-file=.env scripts/backfill-audit-seq.ts
 *
 * Idempotent: reruns are a no-op once every row has a distinct seq.
 */
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const { rows: cols } = await pool.query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'AuditLog'`
  );
  if (cols.length === 0) {
    console.log("AuditLog table does not exist yet — nothing to do.");
    return;
  }
  // Add the chain columns here rather than via `prisma db push`, because push
  // creates the column and its unique index in one step and the index cannot be
  // built while every existing row shares the default seq of 0. Adding the
  // columns first, numbering the rows, then letting push add the index is the
  // ordering that works. `IF NOT EXISTS` keeps this rerunnable.
  if (!cols.some((c) => c.column_name === "seq")) {
    console.log("Adding chain columns to AuditLog…");
    await pool.query(`
      ALTER TABLE "AuditLog"
        ADD COLUMN IF NOT EXISTS "seq" INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "prevHash" TEXT,
        ADD COLUMN IF NOT EXISTS "hash" TEXT
    `);
  }

  const { rows: dupes } = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM (
       SELECT domain, seq FROM "AuditLog" GROUP BY domain, seq HAVING COUNT(*) > 1
     ) d`
  );
  if (dupes[0]?.count === "0") {
    console.log("Every audit row already has a distinct sequence — nothing to do.");
    return;
  }

  // Order by creation time so the sequence reflects the order events actually
  // happened; `id` breaks ties deterministically for rows sharing a timestamp.
  const { rowCount } = await pool.query(`
    WITH numbered AS (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY domain ORDER BY "createdAt" ASC, id ASC) AS rn
      FROM "AuditLog"
    )
    UPDATE "AuditLog" a
    SET seq = n.rn
    FROM numbered n
    WHERE a.id = n.id
  `);

  console.log(`Numbered ${rowCount} audit row(s) per tenant.`);
  console.log("These stay unhashed — the verifiable chain begins with the next entry written.");
  console.log("\nNow run: npx prisma db push");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
