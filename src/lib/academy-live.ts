import { ACADEMY_CHECKIN_WINDOW_MIN } from "@/lib/academy-config";

/** First minutes of each session: règlement, micro, caméra, partage d'écran. */
export const ACADEMY_LIVE_SETUP_MIN = 20;

export type LivePhase = "upcoming" | "warmup" | "setup" | "main" | "ended";

/** Build sovereign or Jitsi fallback URL for a live session (low-bandwidth defaults). */
export function buildLiveJoinUrl(args: {
  editionSlug: string;
  sessionSlug: string;
  sessionLiveUrl: string | null;
  liveBaseUrl: string | null;
  /** Host / animateur — slightly higher video cap. */
  asHost?: boolean;
}): string {
  if (args.sessionLiveUrl?.trim()) {
    return args.sessionLiveUrl.trim();
  }
  const base =
    args.liveBaseUrl?.trim() ||
    process.env.NEXT_PUBLIC_ACADEMY_LIVE_BASE_URL?.trim() ||
    "";
  if (base) {
    return `${base.replace(/\/$/, "")}/${args.sessionSlug}`;
  }
  const room = `mcbuleli-${args.editionSlug}-${args.sessionSlug}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  return `https://meet.jit.si/${room}${buildJitsiLowBandwidthHash(args.asHost)}`;
}

/** Jitsi Meet hash: partage écran, lever la main, qualité adaptée connexion faible. */
export function buildJitsiLowBandwidthHash(asHost?: boolean): string {
  const resolution = asHost ? 480 : 360;
  const toolbar = [
    "microphone",
    "camera",
    "desktop",
    "raisehand",
    "chat",
    "tileview",
    "fullscreen",
    "hangup",
  ];
  const params: string[] = [
    "config.prejoinPageEnabled=true",
    "config.startWithAudioMuted=false",
    `config.startWithVideoMuted=${asHost ? "false" : "true"}`,
    `config.resolution=${resolution}`,
    "config.channelLastN=8",
    "config.enableNoisyMicDetection=true",
    "config.enableTalkWhileMuted=false",
    "config.disableThirdPartyRequests=true",
    "config.enableLayerSuspension=true",
    "config.hideConferenceSubject=true",
    "config.disableDeepLinking=true",
    `interfaceConfig.TOOLBAR_BUTTONS=${encodeURIComponent(JSON.stringify(toolbar))}`,
    "interfaceConfig.SHOW_JITSI_WATERMARK=false",
    "interfaceConfig.MOBILE_APP_PROMO=false",
    "interfaceConfig.DISABLE_JOIN_LEAVE_NOTIFICATIONS=true",
  ];
  return `#${params.join("&")}`;
}

export function getLivePhase(args: {
  startsAt: Date;
  endsAt: Date | null;
  setupMin?: number;
}): LivePhase {
  const setupMin = args.setupMin ?? ACADEMY_LIVE_SETUP_MIN;
  const now = Date.now();
  const start = args.startsAt.getTime();
  const end = args.endsAt?.getTime() ?? start + 2 * 60 * 60 * 1000;
  const setupEnd = start + setupMin * 60 * 1000;
  const warmupStart = start - ACADEMY_CHECKIN_WINDOW_MIN * 60 * 1000;

  if (now > end + 5 * 60 * 1000) return "ended";
  if (now < warmupStart) return "upcoming";
  if (now < start) return "warmup";
  if (now < setupEnd) return "setup";
  if (now <= end) return "main";
  return "ended";
}

export function setupEndsAtIso(startsAt: Date, setupMin?: number): string {
  const min = setupMin ?? ACADEMY_LIVE_SETUP_MIN;
  return new Date(startsAt.getTime() + min * 60 * 1000).toISOString();
}

/** Session ended — replay may be available. */
export function isSessionEnded(args: {
  startsAt: Date;
  endsAt: Date | null;
}): boolean {
  const end = args.endsAt?.getTime() ?? args.startsAt.getTime() + 2 * 60 * 60 * 1000;
  return Date.now() > end + 5 * 60 * 1000;
}

export function isSessionLiveNow(args: {
  startsAt: Date;
  endsAt: Date | null;
  windowMin?: number;
}): boolean {
  const win = (args.windowMin ?? ACADEMY_CHECKIN_WINDOW_MIN) * 60 * 1000;
  const now = Date.now();
  const start = args.startsAt.getTime();
  const end = args.endsAt?.getTime() ?? start + 2 * 60 * 60 * 1000;
  return now >= start - win && now <= end + win;
}
