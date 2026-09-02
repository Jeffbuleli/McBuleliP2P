import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;

if (!url) {
  console.warn("[ngemba] DATABASE_URL missing — DB client not initialized");
}

const client = url ? postgres(url, { max: 5 }) : null;

export const db = client ? drizzle(client, { schema }) : null;
