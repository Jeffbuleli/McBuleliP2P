import { SignJWT } from "jose";
import type { LiveJoinMode } from "@/lib/academy-live";

export function jitsiAppId(): string {
  return process.env.JITSI_APP_ID?.trim() || "mcbuleli_live";
}

export function isAcademyJitsiJwtEnabled(): boolean {
  const secret = process.env.JITSI_JWT_SECRET?.trim();
  return Boolean(secret && secret.length >= 16);
}

/** JWT lifetime for Jitsi Prosody (default 2 h). */
export function jitsiJwtTtlSec(): number {
  const raw = Number(process.env.JITSI_JWT_TTL_SEC ?? "7200");
  if (!Number.isFinite(raw) || raw < 300) return 7200;
  return Math.min(Math.floor(raw), 24 * 60 * 60);
}

function jitsiJwtSub(): string {
  return (
    process.env.JITSI_JWT_SUB?.trim() ||
    process.env.NEXT_PUBLIC_ACADEMY_LIVE_BASE_URL?.replace(/^https?:\/\//, "").replace(/\/$/, "") ||
    "live.mcbuleli.org"
  );
}

/** Jitsi Meet token (Prosody `token_verification`). */
export async function signAcademyJitsiToken(args: {
  userId: string;
  displayName: string;
  room: string;
  moderator: boolean;
  ttlSec?: number;
}): Promise<string> {
  const secret = process.env.JITSI_JWT_SECRET?.trim();
  const appId = jitsiAppId();
  if (!secret || secret.length < 16) {
    throw new Error("jitsi_jwt_not_configured");
  }
  const key = new TextEncoder().encode(secret);
  const exp = Math.floor(Date.now() / 1000) + (args.ttlSec ?? jitsiJwtTtlSec());
  const roomClaim = args.room.trim() || "*";
  return new SignJWT({
    room: roomClaim,
    moderator: args.moderator,
    context: {
      user: {
        id: args.userId,
        name: args.displayName,
        email: `${args.userId}@users.mcbuleli.org`,
        moderator: args.moderator,
        affiliation: args.moderator ? "owner" : "member",
        // Prosody token_lobby_bypass (si installé) — invités dans la même MUC que le host
        lobby_bypass: true,
      },
    },
  })
    // Prosody luajwtjitsi exige header typ === "JWT" (sinon: Invalid typ)
    .setProtectedHeader({ alg: "HS256", typ: "JWT", kid: appId })
    .setIssuer(appId)
    .setAudience("jitsi")
    .setSubject(jitsiJwtSub())
    .setExpirationTime(exp)
    .sign(key);
}

/**
 * Paramètre hash Jitsi (#config.x=…) — les strings doivent être du JSON valide
 * (ex. %22focus.live...%22), sinon parseURLParams → SyntaxError → ping-only.
 */
export function jitsiHashParam(
  key: string,
  value: string | boolean | number,
): string {
  if (typeof value === "string") {
    return `${key}=${encodeURIComponent(JSON.stringify(value))}`;
  }
  return `${key}=${value}`;
}

export function appendJitsiJwtToUrl(baseUrl: string, jwt: string): string {
  const u = new URL(baseUrl.split("#")[0]);
  u.searchParams.set("jwt", jwt);
  const hash = baseUrl.includes("#") ? baseUrl.slice(baseUrl.indexOf("#")) : "";
  return `${u.toString()}${hash}`;
}

/** Après QUITTER sur live.mcbuleli.org → retour companion (évite re-login nginx gate). */
export function appendMcbLiveReturnUrl(baseUrl: string, returnUrl: string): string {
  const trimmed = returnUrl.trim();
  if (!trimmed) return baseUrl;
  const u = new URL(baseUrl.split("#")[0]);
  u.searchParams.set("mcbReturn", trimmed);
  const hash = baseUrl.includes("#") ? baseUrl.slice(baseUrl.indexOf("#")) : "";
  return `${u.toString()}${hash}`;
}

/** Pseudo McBuleli dans le hash Jitsi (évite le 2e écran pré-join). */
export function appendJitsiUserToUrl(baseUrl: string, displayName: string): string {
  const name = displayName.trim().slice(0, 64) || "McBuleli";
  const param = jitsiHashParam("userInfo.displayName", name);
  if (baseUrl.includes("#")) {
    return `${baseUrl}&${param}`;
  }
  return `${baseUrl}#${param}`;
}

export function liveRoomNameFromSessionSlug(sessionSlug: string): string {
  return sessionSlug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function jitsiModeratorForMode(mode: LiveJoinMode): boolean {
  return mode === "host";
}
