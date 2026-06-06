import { and, eq, isNull } from "drizzle-orm";
import { academySessions, getDb } from "@/db";
import type { LiveJoinMode } from "@/lib/academy-live";
import { canUserHostAcademyLive } from "@/lib/academy-live-service";
import type { UserRoleType } from "@/lib/roles";

export async function getLiveSessionRow(args: {
  editionId: string;
  sessionSlug: string;
}): Promise<{ id: string; liveStartedAt: Date | null } | null> {
  const db = getDb();
  const [row] = await db
    .select({
      id: academySessions.id,
      liveStartedAt: academySessions.liveStartedAt,
    })
    .from(academySessions)
    .where(
      and(
        eq(academySessions.editionId, args.editionId),
        eq(academySessions.slug, args.sessionSlug),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** Invités : session démarrée par l'animateur. Host : toujours autorisé. */
export function learnerMayEnterLive(args: {
  liveStartedAt: Date | null;
  mode: LiveJoinMode;
}): boolean {
  return args.mode === "host" || args.liveStartedAt != null;
}

export async function assertLearnerMayEnterLive(args: {
  editionId: string;
  sessionSlug: string;
  mode: LiveJoinMode;
}): Promise<
  | { ok: true; sessionId: string }
  | { ok: false; code: "academy_live_waiting_host" | "academy_edition_not_found" }
> {
  const row = await getLiveSessionRow(args);
  if (!row) {
    return { ok: false, code: "academy_edition_not_found" };
  }
  if (!learnerMayEnterLive({ liveStartedAt: row.liveStartedAt, mode: args.mode })) {
    return { ok: false, code: "academy_live_waiting_host" };
  }
  return { ok: true, sessionId: row.id };
}

/** Host « Démarrer le live » — ouvre la vidéo et débloque les invités. */
export async function markLiveSessionStartedByHost(args: {
  userId: string;
  editionId: string;
  sessionSlug: string;
  appRole: UserRoleType | null | undefined;
}): Promise<void> {
  const canHost = await canUserHostAcademyLive({
    userId: args.userId,
    editionId: args.editionId,
    appRole: args.appRole,
  });
  if (!canHost) return;

  const row = await getLiveSessionRow(args);
  if (!row || row.liveStartedAt) return;

  const db = getDb();
  await db
    .update(academySessions)
    .set({ liveStartedAt: new Date() })
    .where(
      and(
        eq(academySessions.id, row.id),
        isNull(academySessions.liveStartedAt),
      ),
    );
}
