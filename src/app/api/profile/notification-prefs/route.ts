import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getNotificationPrefs,
  normalizeNotificationPrefs,
  saveNotificationPrefs,
  type NotificationPrefs,
} from "@/lib/notification-prefs";
import { getSessionUserId } from "@/lib/session";

const patchZ = z.object({
  emailSecurity: z.boolean().optional(),
  emailP2p: z.boolean().optional(),
  emailMarketing: z.boolean().optional(),
  inAppP2p: z.boolean().optional(),
  inAppCommunity: z.boolean().optional(),
  inAppAcademy: z.boolean().optional(),
});

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const prefs = await getNotificationPrefs(userId);
  return NextResponse.json({ ok: true, prefs });
}

export async function PATCH(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = patchZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "profile_invalid_input" }, { status: 400 });
  }

  const current = await getNotificationPrefs(userId);
  const next: NotificationPrefs = normalizeNotificationPrefs({
    ...current,
    ...parsed.data,
  });
  const prefs = await saveNotificationPrefs(userId, next);
  return NextResponse.json({ ok: true, prefs });
}
