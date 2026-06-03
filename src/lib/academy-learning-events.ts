import { getDb, academyLearningEvents } from "@/db";

export type AcademyVerb =
  | "enrolled"
  | "attended"
  | "quiz_passed"
  | "replay_viewed"
  | "credential_issued"
  | "module_completed";

export async function logAcademyLearningEvent(args: {
  userId: string;
  editionId?: string | null;
  verb: AcademyVerb;
  objectType: string;
  objectId?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    const db = getDb();
    await db.insert(academyLearningEvents).values({
      userId: args.userId,
      editionId: args.editionId ?? null,
      verb: args.verb,
      objectType: args.objectType,
      objectId: args.objectId ?? null,
      meta: args.meta ?? null,
    });
  } catch (e) {
    console.warn("[academy] learning event", e);
  }
}
