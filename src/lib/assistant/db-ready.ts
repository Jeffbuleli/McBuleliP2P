import { sql } from "drizzle-orm";
import { getDb } from "@/db";

export function isAssistantDbNotReadyError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg === "assistant_db_not_migrated" ||
    /relation "ai_assistant_/i.test(msg) ||
    /does not exist/i.test(msg)
  );
}

/** Fail fast with a clear code when migration 0051 was not applied. */
export async function assertAssistantDbReady(): Promise<void> {
  const db = getDb();
  try {
    await db.execute(
      sql`SELECT 1 FROM ai_assistant_conversations LIMIT 1`,
    );
  } catch (error) {
    if (isAssistantDbNotReadyError(error)) {
      throw new Error("assistant_db_not_migrated");
    }
    throw error;
  }
}
