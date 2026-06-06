import { ACADEMY_CHECKIN_WINDOW_MIN } from "@/lib/academy-config";
import {
  ACADEMY_JITSI_LOGO_URL_LIVE_HOST,
  academyJitsiSubject,
} from "@/lib/academy-jitsi-brand";
import { liveRoomNameFromSessionSlug } from "@/lib/academy-jitsi-token";

/** First minutes of each session: règlement, micro, caméra, partage d'écran. */
export const ACADEMY_LIVE_SETUP_MIN = 20;

export type LivePhase = "upcoming" | "warmup" | "setup" | "main" | "ended";

export type LiveJoinMode = "learner" | "host" | "audio";

function jitsiRoomUrlBase(raw: string): string {
  return raw.split("#")[0].split("?")[0];
}

/** Base https://live.mcbuleli.org depuis une URL Jitsi self-hosted. */
export function selfHostedJitsiBase(url: string): string | null {
  try {
    const u = new URL(jitsiRoomUrlBase(url));
    const host = u.hostname.toLowerCase();
    if (host === "live.mcbuleli.org" || host.endsWith(".mcbuleli.org")) {
      return `${u.protocol}//${u.host}`;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Nom de salle dans l'URL finale (doit correspondre au claim JWT room). */
export function jitsiRoomFromJoinUrl(url: string): string | null {
  try {
    const segment = new URL(url.split("#")[0].split("?")[0])
      .pathname.replace(/^\//, "")
      .split("/")[0];
    return segment || null;
  } catch {
    return null;
  }
}

/** Zoom/YouTube/etc. — skip Jitsi hash params. */
export function isJitsiMeetRoomUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const u = new URL(jitsiRoomUrlBase(trimmed));
    const host = u.hostname.toLowerCase();
    if (host.endsWith(".jit.si") || host.endsWith(".jitsi.net")) return true;
    if (host === "live.mcbuleli.org" || host.endsWith(".mcbuleli.org")) {
      const path = u.pathname.replace(/^\//, "");
      return Boolean(path && !path.includes("."));
    }
    return false;
  } catch {
    return false;
  }
}

/** Build sovereign or Jitsi fallback URL for a live session (low-bandwidth defaults). */
export function buildLiveJoinUrl(args: {
  editionSlug: string;
  sessionSlug: string;
  sessionLiveUrl: string | null;
  liveBaseUrl: string | null;
  sessionTitle?: string;
  /** @deprecated use mode */
  asHost?: boolean;
  mode?: LiveJoinMode;
}): string {
  const mode: LiveJoinMode =
    args.mode ?? (args.asHost ? "host" : "learner");

  if (args.sessionLiveUrl?.trim()) {
    const raw = args.sessionLiveUrl.trim();
    if (!isJitsiMeetRoomUrl(raw)) {
      return raw;
    }
    const hash = buildJitsiLowBandwidthHash(mode, {
      sessionTitle: args.sessionTitle,
      sessionSlug: args.sessionSlug,
    });
    const selfBase = selfHostedJitsiBase(raw);
    if (selfBase) {
      const room = liveRoomNameFromSessionSlug(args.sessionSlug);
      return `${selfBase}/${room}${hash}`;
    }
    return `${jitsiRoomUrlBase(raw)}${hash}`;
  }
  const base =
    args.liveBaseUrl?.trim() ||
    process.env.NEXT_PUBLIC_ACADEMY_LIVE_BASE_URL?.trim() ||
    "";
  if (base) {
    const room = liveRoomNameFromSessionSlug(args.sessionSlug);
    return `${base.replace(/\/$/, "")}/${room}${buildJitsiLowBandwidthHash(mode, {
      sessionTitle: args.sessionTitle,
      sessionSlug: args.sessionSlug,
    })}`;
  }
  const room = `mcbuleli-${args.editionSlug}-${args.sessionSlug}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  const jitsiSelf =
    process.env.NEXT_PUBLIC_ACADEMY_JITSI_BASE_URL?.trim() ||
    process.env.ACADEMY_JITSI_BASE_URL?.trim() ||
    "";
  if (jitsiSelf) {
    return `${jitsiSelf.replace(/\/$/, "")}/${room}${buildJitsiLowBandwidthHash(mode, {
      sessionTitle: args.sessionTitle,
      sessionSlug: args.sessionSlug,
    })}`;
  }
  return `https://meet.jit.si/${room}${buildJitsiLowBandwidthHash(mode, {
    sessionTitle: args.sessionTitle,
    sessionSlug: args.sessionSlug,
  })}`;
}

/** Seconds until session end (during live) or until start (before). 0 if ended. */
export function liveSessionRemainingSec(args: {
  startsAt: Date;
  endsAt: Date | null;
  now?: number;
}): { kind: "until_start" | "until_end" | "ended"; seconds: number } {
  const now = args.now ?? Date.now();
  const start = args.startsAt.getTime();
  const end = args.endsAt?.getTime() ?? start + 2 * 60 * 60 * 1000;
  if (now > end + 5 * 60 * 1000) {
    return { kind: "ended", seconds: 0 };
  }
  if (now < start) {
    return { kind: "until_start", seconds: Math.max(0, Math.ceil((start - now) / 1000)) };
  }
  return { kind: "until_end", seconds: Math.max(0, Math.ceil((end - now) / 1000)) };
}

export function formatLiveCountdown(seconds: number): string {
  const s = Math.max(0, seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/** Jitsi Meet hash: partage écran, lever la main, qualité adaptée connexion faible. */
export function buildJitsiLowBandwidthHash(
  mode: LiveJoinMode | boolean = "learner",
  opts?: { sessionTitle?: string; sessionSlug?: string },
): string {
  const resolved: LiveJoinMode =
    typeof mode === "boolean" ? (mode ? "host" : "learner") : mode;
  const isHost = resolved === "host";
  // Pas de 2e écran « Rejoindre » — McBuleli ouvre la salle, Jitsi entre directement.
  const liveHost =
    process.env.NEXT_PUBLIC_ACADEMY_LIVE_BASE_URL?.trim().replace(/^https?:\/\//, "").replace(/\/$/, "") ||
    "live.mcbuleli.org";
  const params: string[] = [
    "config.prejoinPageEnabled=false",
    "config.prejoinConfig.enabled=false",
    "config.enableLobby=false",
    "config.disableLobby=true",
    "config.enableUserRolesBasedOnToken=false",
    `config.hosts.domain=${encodeURIComponent(liveHost)}`,
    `config.hosts.muc=${encodeURIComponent(`conference.${liveHost}`)}`,
    `config.startWithVideoMuted=${isHost ? "false" : "true"}`,
    `config.defaultLogoUrl=${encodeURIComponent(ACADEMY_JITSI_LOGO_URL_LIVE_HOST)}`,
    "interfaceConfig.SHOW_JITSI_WATERMARK=true",
    "interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=true",
  ];
  if (opts?.sessionTitle?.trim() || opts?.sessionSlug?.trim()) {
    params.push(
      `config.subject=${encodeURIComponent(academyJitsiSubject(opts))}`,
    );
  }
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
