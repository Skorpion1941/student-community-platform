// db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsDrizzleDb?: ReturnType<typeof drizzle>;
};

function getPool(): Pool {
  if (globalForDb.__arenaNextJsPostgresqlPool) {
    return globalForDb.__arenaNextJsPostgresqlPool;
  }

  const databaseUrl = "postgresql://postgres:DN1SNTmrlngEmeYM@db.uextrrocfjxqozslaybr.supabase.co:5432/postgres";
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const pool = new Pool({ connectionString: databaseUrl });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaNextJsPostgresqlPool = pool;
  }

  return pool;
}

export function getDb() {
  if (!globalForDb.__arenaNextJsDrizzleDb) {
    globalForDb.__arenaNextJsDrizzleDb = drizzle(getPool());
  }
  return globalForDb.__arenaNextJsDrizzleDb;
}