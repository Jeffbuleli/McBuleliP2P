import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ensurePartnerOrgsSeeded,
  listChatMessages,
  postChatMessage,
} from "@/lib/hackathon/partner-chat";
import { requirePartnerChatAuth } from "@/lib/hackathon/partner-chat-auth";

export const dynamic = "force-dynamic";

const postZ = z.object({
  body: z.string().trim().min(1).max(4000),
});

const lastPostBySession = new Map<string, number>();

export async function GET() {
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
    const messages = await listChatMessages(editionId);
    return NextResponse.json({ messages });
  } catch (e) {
    console.error("[hackathon/chat/messages GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
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

    const key = `${auth.session.userId}:${auth.session.orgId ?? "staff"}`;
    const now = Date.now();
    const last = lastPostBySession.get(key) ?? 0;
    if (now - last < 1200) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    lastPostBySession.set(key, now);

    const json = await req.json().catch(() => null);
    const parsed = postZ.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    await postChatMessage({
      editionId,
      orgId: auth.session.orgId,
      senderLabel: auth.session.displayName,
      body: parsed.data.body,
    });
    const messages = await listChatMessages(editionId);
    return NextResponse.json({ ok: true, messages });
  } catch (e) {
    console.error("[hackathon/chat/messages POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
