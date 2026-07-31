import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ensurePartnerOrgsSeeded,
  listChatMessages,
  postChatMessage,
} from "@/lib/hackathon/partner-chat";
import { requirePartnerChatAuth } from "@/lib/hackathon/partner-chat-auth";
import { getCommunityR2Config } from "@/lib/community/media-r2";

export const dynamic = "force-dynamic";

const postZ = z.object({
  body: z.string().trim().max(4000).optional().default(""),
  imageUrl: z.string().url().max(2000).optional().nullable(),
});

function isAllowedChatImageUrl(url: string): boolean {
  const cfg = getCommunityR2Config();
  if (!cfg?.publicBaseUrl) return false;
  try {
    const u = new URL(url);
    const base = new URL(cfg.publicBaseUrl);
    return u.origin === base.origin && u.pathname.includes("hackathon-chat/");
  } catch {
    return false;
  }
}

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
    const messages = await listChatMessages(editionId, {
      viewerUserId: auth.session.userId,
    });
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
    const body = parsed.data.body?.trim() ?? "";
    const imageUrlRaw = parsed.data.imageUrl?.trim() || null;
    if (imageUrlRaw && !isAllowedChatImageUrl(imageUrlRaw)) {
      return NextResponse.json({ error: "invalid_image" }, { status: 400 });
    }
    const imageUrl = imageUrlRaw;
    if (!body && !imageUrl) {
      return NextResponse.json({ error: "empty_body" }, { status: 400 });
    }

    await postChatMessage({
      editionId,
      orgId: auth.session.orgId,
      senderUserId: auth.session.userId,
      senderLabel: auth.session.displayName,
      body,
      imageUrl,
    });
    const messages = await listChatMessages(editionId, {
      viewerUserId: auth.session.userId,
    });
    return NextResponse.json({ ok: true, messages });
  } catch (e) {
    console.error("[hackathon/chat/messages POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
