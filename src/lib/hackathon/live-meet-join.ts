import { getAppAbsoluteUrl } from "@/lib/app-url";
import {
  appendJitsiJwtToUrl,
  appendJitsiUserToUrl,
  appendMcbLiveReturnUrl,
  isAcademyJitsiJwtEnabled,
  liveRoomNameFromSessionSlug,
  signAcademyJitsiToken,
} from "@/lib/academy-jitsi-token";
import { buildJitsiLowBandwidthHash } from "@/lib/academy-live";
import { getMcSession } from "@/lib/hackathon/mc-state";
import {
  ensurePartnerMeet,
  type PartnerMeetRow,
} from "@/lib/partner-meet";

const PROJECTOR_USER_ID = "hackathon-live-projector";
const PROJECTOR_DISPLAY_NAME = "Hackathon Live";

function liveBase(): string {
  return (
    process.env.NEXT_PUBLIC_ACADEMY_LIVE_BASE_URL?.trim() ||
    process.env.ACADEMY_LIVE_BASE_URL?.trim() ||
    "https://live.mcbuleli.org"
  ).replace(/\/$/, "");
}

function buildProjectorRoomUrl(meet: PartnerMeetRow): string {
  const room = liveRoomNameFromSessionSlug(meet.roomSlug);
  const hash = buildJitsiLowBandwidthHash("learner", {
    sessionTitle: meet.title,
    sessionSlug: room,
  });
  return `${liveBase()}/${room}${hash}`;
}

/** Gated join URL for the Hackathon Live projector (top-level Jitsi — no iframe). */
export async function resolveHackathonLiveMeetJoinUrl(
  slug: string,
): Promise<{ ok: true; url: string } | { ok: false; code: string }> {
  const key = slug.trim();
  if (!key) return { ok: false, code: "invalid_slug" };

  const mc = getMcSession();
  if (mc.projectorMode !== "meet" || mc.meetSlug !== key) {
    return { ok: false, code: "meet_not_active" };
  }

  const meet = await ensurePartnerMeet(key);
  if (!meet) return { ok: false, code: "meet_not_found" };
  if (meet.status === "cancelled" || meet.status === "done") {
    return { ok: false, code: "meet_closed" };
  }

  const room = liveRoomNameFromSessionSlug(meet.roomSlug);
  let url = buildProjectorRoomUrl(meet);

  if (isAcademyJitsiJwtEnabled()) {
    const jwt = await signAcademyJitsiToken({
      userId: PROJECTOR_USER_ID,
      displayName: PROJECTOR_DISPLAY_NAME,
      room,
      moderator: false,
    });
    url = appendJitsiJwtToUrl(url, jwt);
  }

  url = appendJitsiUserToUrl(url, PROJECTOR_DISPLAY_NAME);
  url = appendMcbLiveReturnUrl(
    url,
    getAppAbsoluteUrl("/hackathon/live"),
  );

  return { ok: true, url };
}
