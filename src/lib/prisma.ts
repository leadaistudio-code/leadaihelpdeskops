import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { env } from '@/lib/env'

// Importing `env` here is what makes configuration validation happen at boot:
// almost every request path reaches Prisma, so a malformed DATABASE_URL now
// fails loudly at startup instead of at the first query that needs it.
//
// Pool sizing matters on serverless. Each lambda instance opens its own pool, so
// the effective connection count is `max × instances`. Postgres defaults to ~100
// connections and Supabase's pooler less than that, meaning an unbounded `max`
// exhausts the server under modest concurrency and every subsequent request
// fails to connect. Keep `max` small per instance and put a pooler
// (PgBouncer/Supavisor) in front in production.
const pool = new Pool({
  connectionString: env.DATABASE_URL ?? process.env.DATABASE_URL,
  max: Number(process.env.DATABASE_POOL_MAX ?? 5),
  // Reap idle connections quickly so scaled-down lambda instances stop holding
  // slots the live ones need.
  idleTimeoutMillis: 10_000,
  // Fail fast rather than queueing a request behind an exhausted pool until the
  // platform's own timeout kills it with no useful error.
  connectionTimeoutMillis: 10_000,
})

const adapter = new PrismaPg(pool)

const prismaClientSingleton = () => {
  return new PrismaClient({ adapter })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
