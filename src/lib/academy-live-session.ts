import type { LiveJoinMode } from "@/lib/academy-live";
import { isLiveSessionJoinOpen } from "@/lib/academy-live";
import { canUserHostAcademyLive } from "@/lib/academy-live-service";
import {
  markResolvedLiveSessionStarted,
  resolveLiveSessionByEdition,
} from "@/lib/academy-live-resolve";
import type { UserRoleType } from "@/lib/roles";

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
  | {
      ok: false;
      code:
        | "academy_live_waiting_host"
        | "academy_edition_not_found"
        | "academy_live_session_ended";
    }
> {
  const row = await resolveLiveSessionByEdition(args);
  if (!row) {
    return { ok: false, code: "academy_edition_not_found" };
  }
  if (
    !isLiveSessionJoinOpen({
      startsAt: row.startsAt,
      endsAt: row.endsAt,
    })
  ) {
    return { ok: false, code: "academy_live_session_ended" };
  }
  if (!learnerMayEnterLive({ liveStartedAt: row.liveStartedAt, mode: args.mode })) {
    return { ok: false, code: "academy_live_waiting_host" };
  }
  return { ok: true, sessionId: row.recordId };
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

  const row = await resolveLiveSessionByEdition({
    editionId: args.editionId,
    sessionSlug: args.sessionSlug,
  });
  if (!row) return;

  await markResolvedLiveSessionStarted(row);
}
