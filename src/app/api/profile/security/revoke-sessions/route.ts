import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { assertStepUp, bumpSessionVersion } from "@/lib/auth/step-up";
import { sessionCookieName, signSessionToken } from "@/lib/jwt";
import { getSessionCookieWriteOptions } from "@/lib/session-cookie";
import { z } from "zod";

const bodyZ = z.object({
  totpCode: z.string().optional(),
});

/** Invalidate all sessions except current - re-issues cookie for this device. */
export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodyZ.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const step = await assertStepUp({
    userId,
    totpCode: parsed.data.totpCode ?? null,
  });
  if (!step.ok) {
    return NextResponse.json({ error: step.error }, { status: 403 });
  }

  const sessionVersion = await bumpSessionVersion(userId);
  const token = await signSessionToken(userId, sessionVersion);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookieName(), token, getSessionCookieWriteOptions());
  return res;
}
