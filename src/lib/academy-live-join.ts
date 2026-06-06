import {
  appendJitsiJwtToUrl,
  appendJitsiUserToUrl,
  isAcademyJitsiJwtEnabled,
  jitsiModeratorForMode,
  liveRoomNameFromSessionSlug,
  signAcademyJitsiToken,
} from "@/lib/academy-jitsi-token";
import {
  buildLiveJoinUrl,
  jitsiRoomFromJoinUrl,
  type LiveJoinMode,
} from "@/lib/academy-live";
import {
  canUserHostAcademyLive,
  canUserJoinAcademyLive,
} from "@/lib/academy-live-service";
import {
  assertLearnerMayEnterLive,
  markLiveSessionStartedByHost,
} from "@/lib/academy-live-session";
import { resolveAcademyLiveRoleForEdition } from "@/lib/academy-live-role";
import type { UserRoleType } from "@/lib/roles";

/** True when URL targets our JWT-gated Jitsi host (env or edition live base). */
export function isSelfHostedLiveUrl(
  url: string,
  editionLiveBaseUrl?: string | null,
): boolean {
  const strip = (u: string) => u.replace(/\/$/, "");
  const bases = [
    process.env.NEXT_PUBLIC_ACADEMY_LIVE_BASE_URL?.trim(),
    process.env.ACADEMY_LIVE_BASE_URL?.trim(),
    editionLiveBaseUrl?.trim(),
    "https://live.mcbuleli.org",
  ].filter((b): b is string => Boolean(b));
  const path = url.split("#")[0].split("?")[0];
  return bases.some((b) => path.startsWith(strip(b)));
}

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

  await resolveAcademyLiveRoleForEdition({
    userId: args.userId,
    editionId: args.editionId,
    appRole: args.appRole,
  });
  // wantsHost déjà validé par canUserHostAcademyLive ci-dessus
  const effectiveMode: LiveJoinMode = wantsHost
    ? "host"
    : args.mode === "audio"
      ? "audio"
      : "learner";

  const gate = await assertLearnerMayEnterLive({
    editionId: args.editionId,
    sessionSlug: args.sessionSlug,
    mode: effectiveMode,
  });
  if (!gate.ok) {
    return { ok: false, code: gate.code };
  }

  if (effectiveMode === "host") {
    await markLiveSessionStartedByHost({
      userId: args.userId,
      editionId: args.editionId,
      sessionSlug: args.sessionSlug,
      appRole: args.appRole,
    });
  }

  let url = buildLiveJoinUrl({
    editionSlug: args.editionSlug,
    sessionSlug: args.sessionSlug,
    sessionLiveUrl: args.sessionLiveUrl,
    liveBaseUrl: args.liveBaseUrl,
    sessionTitle: args.sessionTitle,
    mode: effectiveMode,
  });

  const onSelfHosted = isSelfHostedLiveUrl(url, args.liveBaseUrl);
  if (isAcademyJitsiJwtEnabled() && onSelfHosted) {
    const room =
      jitsiRoomFromJoinUrl(url) ??
      liveRoomNameFromSessionSlug(args.sessionSlug);
    const jwt = await signAcademyJitsiToken({
      userId: args.userId,
      displayName: args.displayName,
      room,
      moderator: jitsiModeratorForMode(effectiveMode),
    });
    url = appendJitsiJwtToUrl(url, jwt);
  }

  url = appendJitsiUserToUrl(url, args.displayName);

  return { ok: true, url };
}
