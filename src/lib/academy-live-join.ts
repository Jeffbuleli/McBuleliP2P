import {
  appendJitsiJwtToUrl,
  isAcademyJitsiJwtEnabled,
  jitsiModeratorForMode,
  liveRoomNameFromSessionSlug,
  signAcademyJitsiToken,
} from "@/lib/academy-jitsi-token";
import { buildLiveJoinUrl, type LiveJoinMode } from "@/lib/academy-live";
import {
  canUserHostAcademyLive,
  canUserJoinAcademyLive,
} from "@/lib/academy-live-service";
import { resolveAcademyLiveRoleForEdition } from "@/lib/academy-live-role";
import type { UserRoleType } from "@/lib/roles";

export async function resolveGatedLiveJoinUrl(args: {
  userId: string;
  displayName: string;
  editionId: string;
  editionSlug: string;
  sessionSlug: string;
  sessionLiveUrl: string | null;
  liveBaseUrl: string | null;
  sessionTitle?: string;
  mode: LiveJoinMode;
  appRole: UserRoleType | null | undefined;
}): Promise<{ ok: true; url: string } | { ok: false; code: string }> {
  const wantsHost = args.mode === "host";
  const canJoin = await canUserJoinAcademyLive({
    userId: args.userId,
    editionId: args.editionId,
    appRole: args.appRole,
  });
  if (!canJoin) {
    return { ok: false, code: "academy_live_account_required" };
  }

  if (wantsHost) {
    const canHost = await canUserHostAcademyLive({
      userId: args.userId,
      editionId: args.editionId,
      appRole: args.appRole,
    });
    if (!canHost) {
      return { ok: false, code: "academy_live_host_requires_payment" };
    }
  }

  const liveRole = await resolveAcademyLiveRoleForEdition({
    userId: args.userId,
    editionId: args.editionId,
    appRole: args.appRole,
  });
  const effectiveMode: LiveJoinMode =
    wantsHost && liveRole === "host" ? "host" : args.mode === "audio" ? "audio" : "learner";

  let url = buildLiveJoinUrl({
    editionSlug: args.editionSlug,
    sessionSlug: args.sessionSlug,
    sessionLiveUrl: args.sessionLiveUrl,
    liveBaseUrl: args.liveBaseUrl,
    sessionTitle: args.sessionTitle,
    mode: effectiveMode,
  });

  const liveHost = process.env.NEXT_PUBLIC_ACADEMY_LIVE_BASE_URL?.trim();
  const onSelfHosted =
    liveHost && url.startsWith(liveHost.replace(/\/$/, ""));
  if (isAcademyJitsiJwtEnabled() && onSelfHosted) {
    const room = liveRoomNameFromSessionSlug(args.sessionSlug);
    const jwt = await signAcademyJitsiToken({
      userId: args.userId,
      displayName: args.displayName,
      room,
      moderator: jitsiModeratorForMode(effectiveMode),
    });
    url = appendJitsiJwtToUrl(url, jwt);
  }

  return { ok: true, url };
}
