import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Lazy DB — avoids requiring DATABASE_URL during `next build` when no env is present.
 * API routes must call this; it throws if DATABASE_URL is missing at request time.
 */
export function getDb() {
  if (_db) return _db;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const g = globalThis as unknown as { __mcbuleli_pg?: ReturnType<typeof postgres> };
  if (!g.__mcbuleli_pg) {
    g.__mcbuleli_pg = postgres(connectionString, {
      max: process.env.VERCEL ? 1 : 10,
      prepare: false,
    });
  }
  _db = drizzle(g.__mcbuleli_pg, { schema });
  return _db;
}

export * from "./schema";
