import { desc, eq } from "drizzle-orm";
import { getDb, userLoginEvents } from "@/db";

export type LoginMethod = "password" | "passkey";

function clientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const real = req.headers.get("x-real-ip")?.trim();
  return real ? real.slice(0, 64) : null;
}

function deviceLabelFromUa(ua: string | null): string | null {
  if (!ua) return null;
  const trimmed = ua.slice(0, 512);
  if (/iPhone|iPad/i.test(trimmed)) return "iOS";
  if (/Android/i.test(trimmed)) return "Android";
  if (/Macintosh/i.test(trimmed)) return "Mac";
  if (/Windows/i.test(trimmed)) return "Windows";
  if (/Linux/i.test(trimmed)) return "Linux";
  return trimmed.slice(0, 48);
}

export async function recordLoginEvent(args: {
  userId: string;
  method: LoginMethod;
  req: Request;
  success?: boolean;
}): Promise<void> {
  const ua = args.req.headers.get("user-agent");
  const db = getDb();
  await db.insert(userLoginEvents).values({
    userId: args.userId,
    method: args.method,
    ipAddress: clientIp(args.req),
    userAgent: ua?.slice(0, 512) ?? null,
    deviceLabel: deviceLabelFromUa(ua),
    success: args.success ?? true,
  });
}

export type LoginEventRow = {
  id: string;
  method: string;
  ipAddress: string | null;
  deviceLabel: string | null;
  success: boolean;
  createdAt: Date;
};

export async function listLoginEvents(
  userId: string,
  limit = 20,
): Promise<LoginEventRow[]> {
  const db = getDb();
  return db
    .select({
      id: userLoginEvents.id,
      method: userLoginEvents.method,
      ipAddress: userLoginEvents.ipAddress,
      deviceLabel: userLoginEvents.deviceLabel,
      success: userLoginEvents.success,
      createdAt: userLoginEvents.createdAt,
    })
    .from(userLoginEvents)
    .where(eq(userLoginEvents.userId, userId))
    .orderBy(desc(userLoginEvents.createdAt))
    .limit(limit);
}
