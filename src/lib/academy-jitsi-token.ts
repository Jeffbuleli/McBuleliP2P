import { SignJWT } from "jose";
import type { LiveJoinMode } from "@/lib/academy-live";

export function jitsiAppId(): string {
  return process.env.JITSI_APP_ID?.trim() || "mcbuleli_live";
}

export function isAcademyJitsiJwtEnabled(): boolean {
  const secret = process.env.JITSI_JWT_SECRET?.trim();
  return Boolean(secret && secret.length >= 16);
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
  const exp = Math.floor(Date.now() / 1000) + (args.ttlSec ?? 12 * 60 * 60);
  // room "*" — évite mismatch URL/JWT ; la gate nginx exige déjà ?jwt=
  const roomClaim = "*";
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
      },
    },
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(appId)
    .setAudience("jitsi")
    .setSubject(jitsiJwtSub())
    .setExpirationTime(exp)
    .sign(key);
}

export function appendJitsiJwtToUrl(baseUrl: string, jwt: string): string {
  const u = new URL(baseUrl.split("#")[0]);
  u.searchParams.set("jwt", jwt);
  const hash = baseUrl.includes("#") ? baseUrl.slice(baseUrl.indexOf("#")) : "";
  return `${u.toString()}${hash}`;
}

/** Pseudo McBuleli dans le hash Jitsi (évite le 2e écran pré-join). */
export function appendJitsiUserToUrl(baseUrl: string, displayName: string): string {
  const name = displayName.trim().slice(0, 64) || "McBuleli";
  const param = `userInfo.displayName=${encodeURIComponent(name)}`;
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
