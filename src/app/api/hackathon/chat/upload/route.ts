import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { COMMUNITY_IMAGE_MIMES } from "@/lib/community/config";
import {
  communityR2Configured,
  putCommunityObjectToR2,
} from "@/lib/community/media-r2";
import { ensurePartnerOrgsSeeded } from "@/lib/hackathon/partner-chat";
import { requirePartnerChatAuth } from "@/lib/hackathon/partner-chat-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 4 * 1024 * 1024;

/** Upload image for partner chat → Cloudflare R2 (community bucket). */
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
    if (!communityR2Configured()) {
      return NextResponse.json({ error: "r2_not_configured" }, { status: 503 });
    }

    const form = await req.formData().catch(() => null);
    if (!form) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file_required" }, { status: 400 });
    }
    const mime = file.type || "image/jpeg";
    if (
      !COMMUNITY_IMAGE_MIMES.includes(
        mime as (typeof COMMUNITY_IMAGE_MIMES)[number],
      )
    ) {
      return NextResponse.json({ error: "invalid_mime" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "file_too_large" }, { status: 400 });
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const ext =
      mime === "image/png"
        ? "png"
        : mime === "image/webp"
          ? "webp"
          : mime === "image/gif"
            ? "gif"
            : "jpg";
    const objectKey = `mcbuleli-community/hackathon-chat/${editionId}/${auth.session.userId}/${randomUUID()}.${ext}`;
    const url = await putCommunityObjectToR2({
      objectKey,
      body: buffer,
      mimeType: mime,
    });
    if (!url) {
      return NextResponse.json({ error: "upload_failed" }, { status: 502 });
    }
    return NextResponse.json({ url });
  } catch (e) {
    console.error("[hackathon/chat/upload]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
