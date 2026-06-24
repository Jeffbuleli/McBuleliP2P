import { NextResponse } from "next/server";
import { z } from "zod";
import { communityEnabled } from "@/lib/community/config";
import {
  createCommunityStory,
  expireOldStories,
  listActiveStoryRings,
} from "@/lib/community/stories-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const createZ = z.object({
  type: z.enum(["text", "image", "video"]),
  body: z.string().max(280).optional(),
  mediaId: z.string().uuid().optional(),
  bgColor: z.string().max(32).optional(),
});

export async function GET() {
  if (!communityEnabled()) {
    return NextResponse.json({ rings: [] });
  }

  await expireOldStories();
  const viewerId = await getSessionUserId();
  const result = await listActiveStoryRings({ viewerId });
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!communityEnabled()) {
    return NextResponse.json({ error: "community_disabled" }, { status: 503 });
  }

  const json = await req.json().catch(() => null);
  const parsed = createZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const result = await createCommunityStory({
    authorId: userId,
    type: parsed.data.type,
    body: parsed.data.body,
    mediaId: parsed.data.mediaId,
    bgColor: parsed.data.bgColor,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ id: result.id });
}
