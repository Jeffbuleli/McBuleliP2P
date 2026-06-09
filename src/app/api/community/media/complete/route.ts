import { NextResponse } from "next/server";
import { z } from "zod";
import { completeCommunityImageUpload } from "@/lib/community/media-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const postZ = z.object({
  mediaId: z.string().uuid(),
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

  const result = await completeCommunityImageUpload({
    ownerId: userId,
    mediaId: parsed.data.mediaId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ id: result.id, url: result.url });
}
