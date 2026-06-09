import { NextResponse } from "next/server";
import {
  COMMUNITY_IMAGE_MIMES,
  COMMUNITY_VIDEO_MIMES,
} from "@/lib/community/config";
import {
  uploadCommunityImageBuffer,
  uploadCommunityVideoBuffer,
} from "@/lib/community/media-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const KINDS = ["posts", "blogs", "covers", "avatars"] as const;

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  const isVideo = COMMUNITY_VIDEO_MIMES.includes(
    mime as (typeof COMMUNITY_VIDEO_MIMES)[number],
  );
  const isImage = COMMUNITY_IMAGE_MIMES.includes(
    mime as (typeof COMMUNITY_IMAGE_MIMES)[number],
  );

  if (!isVideo && !isImage) {
    return NextResponse.json({ error: "community_media_invalid_mime" }, { status: 400 });
  }

  const kindRaw = form.get("kind");
  const kind =
    typeof kindRaw === "string" &&
    KINDS.includes(kindRaw as (typeof KINDS)[number])
      ? (kindRaw as (typeof KINDS)[number])
      : "posts";

  const buffer = new Uint8Array(await file.arrayBuffer());
  const result = isVideo
    ? await uploadCommunityVideoBuffer({
        ownerId: userId,
        buffer,
        mimeType: mime,
        kind: kind === "avatars" ? "posts" : kind,
      })
    : await uploadCommunityImageBuffer({
        ownerId: userId,
        buffer,
        mimeType: mime,
        kind,
      });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ id: result.id, url: result.url });
}
