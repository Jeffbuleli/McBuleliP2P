import { NextResponse } from "next/server";
import {
  ensurePartnerOrgsSeeded,
  markPartnerChatRead,
} from "@/lib/hackathon/partner-chat";
import { requirePartnerChatAuth } from "@/lib/hackathon/partner-chat-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const editionId = await ensurePartnerOrgsSeeded();
    if (!editionId) {
      return NextResponse.json({ error: "no_edition" }, { status: 404 });
    }
    const auth = await requirePartnerChatAuth(editionId);
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status },
      );
    }
    const lastReadAt = await markPartnerChatRead(
      editionId,
      auth.session.userId,
    );
    return NextResponse.json({
      ok: true,
      lastReadAt: lastReadAt.toISOString(),
    });
  } catch (e) {
    console.error("[hackathon/chat/messages/read POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
