import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  communityR2Configured,
  putCommunityObjectToR2,
} from "@/lib/community/media-r2";
import { getFeaturedEditionRow } from "@/lib/hackathon/hub";
import { SessionError, requireUserId } from "@/lib/session";
import {
  getMemberForRegistration,
  getRegistrationForUser,
} from "@/lib/hackathon/teams";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const edition = await getFeaturedEditionRow();
    if (!edition) {
      return NextResponse.json({ error: "no_edition" }, { status: 404 });
    }
    const reg = await getRegistrationForUser(userId, edition.id);
    if (!reg || reg.paymentStatus !== "paid") {
      return NextResponse.json({ error: "payment_required" }, { status: 403 });
    }
    const membership = await getMemberForRegistration(reg.id);
    if (!membership) {
      return NextResponse.json({ error: "no_team" }, { status: 400 });
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
    const mime = file.type || "application/octet-stream";
    if (!ALLOWED.has(mime)) {
      return NextResponse.json({ error: "invalid_mime" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "file_too_large" }, { status: 400 });
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const ext =
      mime === "application/pdf"
        ? "pdf"
        : mime === "image/png"
          ? "png"
          : mime === "image/webp"
            ? "webp"
            : mime === "image/gif"
              ? "gif"
              : "jpg";
    const objectKey = `mcbuleli-community/hackathon-submissions/${edition.id}/${membership.team.id}/${randomUUID()}.${ext}`;
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
    if (e instanceof SessionError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[hackathon/submissions/upload]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
