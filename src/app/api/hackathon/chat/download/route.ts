import { NextResponse } from "next/server";
import { ensurePartnerOrgsSeeded } from "@/lib/hackathon/partner-chat";
import { requirePartnerChatAuth } from "@/lib/hackathon/partner-chat-auth";
import { getCommunityR2Config } from "@/lib/community/media-r2";

export const dynamic = "force-dynamic";

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

function filenameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const base = path.split("/").pop() || "image";
    return base.includes(".") ? base : `${base}.jpg`;
  } catch {
    return "hackathon-chat-image.jpg";
  }
}

/** Proxy HD download with Content-Disposition (avoids cross-origin download quirks). */
export async function GET(req: Request) {
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

    const url = new URL(req.url).searchParams.get("url")?.trim() || "";
    if (!url || !isAllowedChatImageUrl(url)) {
      return NextResponse.json({ error: "invalid_url" }, { status: 400 });
    }

    const upstream = await fetch(url, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "fetch_failed" }, { status: 502 });
    }

    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream";
    const filename = filenameFromUrl(url);
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (e) {
    console.error("[hackathon/chat/download GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
