import { NextResponse } from "next/server";
import { communityEnabled } from "@/lib/community/config";
import {
  createPostRepost,
  removePostRepost,
} from "@/lib/community/feed-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!communityEnabled()) {
    return NextResponse.json({ error: "community_disabled" }, { status: 503 });
  }

  const { id } = await ctx.params;
  let quote: string | null = null;
  try {
    const body = (await req.json()) as { quote?: string };
    if (typeof body.quote === "string") quote = body.quote;
  } catch {
    /* empty body ok */
  }

  const result = await createPostRepost({ userId, postId: id, quote });
  if (!result.ok) {
    const status =
      result.error === "not_found"
        ? 404
        : result.error === "community_content_blocked"
          ? 400
          : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    ok: true,
    post: result.post,
    bpGranted: result.bpGranted,
    shareCount: result.shareCount,
    already: result.already,
  });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!communityEnabled()) {
    return NextResponse.json({ error: "community_disabled" }, { status: 503 });
  }

  const { id } = await ctx.params;
  const result = await removePostRepost({ userId, postId: id });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json({ ok: true, shareCount: result.shareCount });
}
