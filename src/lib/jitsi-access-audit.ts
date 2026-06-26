import { jitsiAccessLog, getDb } from "@/db";
import { clientIpFromRequest } from "@/lib/rate-limit";

export type JitsiAccessMode = "host" | "learner" | "audio";

function userAgent(req: Request | null): string | null {
  if (!req) return null;
  const ua = req.headers.get("user-agent");
  return ua ? ua.slice(0, 512) : null;
}

/** Append-only log when a user receives a gated live join URL. */
export function recordJitsiAccess(args: {
  userId: string;
  room: string;
  editionId?: string | null;
  sessionSlug?: string | null;
  mode: JitsiAccessMode;
  moderator: boolean;
  req?: Request | null;
}): void {
  const db = getDb();
  void db
    .insert(jitsiAccessLog)
    .values({
      userId: args.userId,
      room: args.room.slice(0, 128),
      editionId: args.editionId ?? null,
      sessionSlug: args.sessionSlug?.slice(0, 64) ?? null,
      mode: args.mode,
      moderator: args.moderator,
      ipAddress: args.req ? clientIpFromRequest(args.req) : null,
      userAgent: userAgent(args.req ?? null),
    })
    .catch((err) => {
      console.warn("[jitsi-access-audit]", args.room, err);
    });
}
