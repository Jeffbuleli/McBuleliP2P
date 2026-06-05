import { sql } from "drizzle-orm";
import { getDb } from "@/db";

export function isAcademyDbNotReadyError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  const cause =
    error instanceof Error && error.cause instanceof Error
      ? error.cause.message
      : "";
  const combined = `${msg}\n${cause}`;
  return (
    msg === "academy_db_not_migrated" ||
    /relation "academy_/i.test(combined) ||
    (/column "/i.test(combined) &&
      /academy_/i.test(combined) &&
      /does not exist/i.test(combined)) ||
    (/relation "training_registrations"/i.test(combined) &&
      /does not exist/i.test(combined))
  );
}

/** Fail fast when academy migrations (incl. 0063 Live Studio) were not applied. */
export async function assertAcademyDbReady(): Promise<void> {
  const db = getDb();
  try {
    await db.execute(sql`SELECT 1 FROM academy_programs LIMIT 1`);
    await db.execute(sql`SELECT 1 FROM academy_modules LIMIT 1`);
    await db.execute(sql`SELECT 1 FROM academy_edition_hosts LIMIT 1`);
    await db.execute(sql`SELECT 1 FROM academy_live_purchases LIMIT 1`);
    await db.execute(
      sql`SELECT owner_user_id, source FROM academy_editions LIMIT 1`,
    );
    await db.execute(sql`SELECT 1 FROM training_registrations LIMIT 1`);
  } catch (error) {
    if (isAcademyDbNotReadyError(error)) {
      throw new Error("academy_db_not_migrated");
    }
    throw error;
  }
}
