import { sql } from "drizzle-orm";
import { getDb } from "@/db";

export function isAcademyDbNotReadyError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg === "academy_db_not_migrated" ||
    /relation "academy_/i.test(msg) ||
    (/relation "training_registrations"/i.test(msg) && /does not exist/i.test(msg))
  );
}

/** Fail fast when migrations 0055–0057 were not applied. */
export async function assertAcademyDbReady(): Promise<void> {
  const db = getDb();
  try {
    await db.execute(sql`SELECT 1 FROM academy_programs LIMIT 1`);
    await db.execute(sql`SELECT 1 FROM training_registrations LIMIT 1`);
  } catch (error) {
    if (isAcademyDbNotReadyError(error)) {
      throw new Error("academy_db_not_migrated");
    }
    throw error;
  }
}
