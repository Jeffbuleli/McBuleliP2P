import { NextResponse } from "next/server";
import { z } from "zod";
import { COMMUNITY_IMAGE_MAX_BYTES, COMMUNITY_IMAGE_MIMES } from "@/lib/community/config";
import { presignCommunityImageUpload } from "@/lib/community/media-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const postZ = z.object({
  mime: z.enum(COMMUNITY_IMAGE_MIMES),
  sizeBytes: z.number().int().min(1).max(COMMUNITY_IMAGE_MAX_BYTES),
  kind: z.enum(["posts", "blogs", "covers", "avatars", "stories"]).optional(),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = postZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const result = await presignCommunityImageUpload({
    ownerId: userId,
    mimeType: parsed.data.mime,
    sizeBytes: parsed.data.sizeBytes,
    kind: parsed.data.kind,
  });

  if (!result.ok) {
    const status = result.error === "r2_not_configured" ? 503 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    id: result.id,
    uploadUrl: result.uploadUrl,
    publicUrl: result.publicUrl,
  });
}
