import { NextResponse } from "next/server";
import { z } from "zod";
import {
  countUnreadNotifications,
  listUserNotifications,
  markAllNotificationsRead,
  markNotificationsRead,
} from "@/lib/notifications-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

const patchZ = z.object({
  markReadIds: z.array(z.string().uuid()).optional(),
  markAllRead: z.boolean().optional(),
});

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const [notifications, unreadCount] = await Promise.all([
    listUserNotifications(userId, 50),
    countUnreadNotifications(userId),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = patchZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid body" }, { status: 400 });
  }

  if (parsed.data.markAllRead) {
    await markAllNotificationsRead(userId);
  } else if (parsed.data.markReadIds && parsed.data.markReadIds.length > 0) {
    await markNotificationsRead(userId, parsed.data.markReadIds);
  }

  const unreadCount = await countUnreadNotifications(userId);
  return NextResponse.json({ ok: true, unreadCount });
}
