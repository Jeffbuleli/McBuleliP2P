import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { readEnvKey } from "@/lib/env";
import * as schema from "./schema";

const url =
  process.env.DATABASE_URL?.trim() || readEnvKey("DATABASE_URL") || null;

if (!url) {
  console.warn("[ngemba] DATABASE_URL missing - DB client not initialized");
}

const client = url ? postgres(url, { max: 5 }) : null;

export const db = client ? drizzle(client, { schema }) : null;

export function isDatabaseConfigured(): boolean {
  return Boolean(db);
}
