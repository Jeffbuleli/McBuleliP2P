import { NextResponse } from "next/server";
import {
  countPartnerChatUnread,
  ensurePartnerOrgsSeeded,
} from "@/lib/hackathon/partner-chat";
import { resolvePartnerChatAccess } from "@/lib/hackathon/partner-chat-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const editionId = await ensurePartnerOrgsSeeded();
    if (!editionId) {
      return NextResponse.json({ unreadCount: 0 });
    }
    const auth = await resolvePartnerChatAccess(editionId);
    if (!auth.ok) {
      return NextResponse.json({ unreadCount: 0 });
    }
    const unreadCount = await countPartnerChatUnread(
      editionId,
      auth.session.userId,
    );
    return NextResponse.json({ unreadCount });
  } catch (e) {
    console.error("[hackathon/chat/unread GET]", e);
    return NextResponse.json({ unreadCount: 0 });
  }
}
