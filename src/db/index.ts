import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function connectionStringOrThrow(): string {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  return connectionString;
}

/** Shared postgres.js pool (lazy). */
export function getPgClient(): ReturnType<typeof postgres> {
  const g = globalThis as unknown as { __mcbuleli_pg?: ReturnType<typeof postgres> };
  if (!g.__mcbuleli_pg) {
    g.__mcbuleli_pg = postgres(connectionStringOrThrow(), {
      max: process.env.RENDER ? 3 : 10,
      prepare: false,
    });
  }
  return g.__mcbuleli_pg;
}

/**
 * Lazy DB - avoids requiring DATABASE_URL during `next build` when no env is present.
 * API routes must call this; it throws if DATABASE_URL is missing at request time.
 */
export function getDb() {
  if (_db) return _db;
  _db = drizzle(getPgClient(), { schema });
  return _db;
}

export * from "./schema";
