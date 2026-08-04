# Migrations

The audit scored disaster recovery **1/10**, and the reason was here: schema
changes were applied with `prisma db push`, which leaves no record of what ran.
Without a migration history there is no reproducible way to rebuild the schema
from scratch, which means there is no tested restore path — and SOC 2 CC8.1
(change management) has nothing to point at.

`00000000000000_baseline` is the full schema as of 2026-08-03.

## Adopting this on an existing database

The baseline describes a database that already exists, so it must be marked as
applied rather than run — running it would fail on the first `CREATE TABLE`.

```bash
npx prisma migrate resolve --applied 00000000000000_baseline
npx prisma migrate deploy   # applies everything after the baseline
```

Do this **once**, against each existing environment.

## On a fresh database

```bash
npx prisma migrate deploy
```

## From here on

Use `npx prisma migrate dev --name <what-changed>` locally, and
`npx prisma migrate deploy` in CI/production.

**Do not use `prisma db push` against an environment holding real data.** It
reconciles the database to the schema with no record and no review step, and on
a destructive change it will offer to reset the database.
