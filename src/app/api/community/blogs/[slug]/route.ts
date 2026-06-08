import { NextResponse } from "next/server";
import { communityEnabled } from "@/lib/community/config";
import { getBlogBySlug, publishBlogPost } from "@/lib/community/blog-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  if (!communityEnabled()) {
    return NextResponse.json({ error: "community_disabled" }, { status: 503 });
  }

  const { slug } = await ctx.params;
  const post = await getBlogBySlug(slug);
  if (!post) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ post });
}

export async function PATCH(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!communityEnabled()) {
    return NextResponse.json({ error: "community_disabled" }, { status: 503 });
  }

  const { slug } = await ctx.params;
  const result = await publishBlogPost({ authorId: userId, slug });
  if (!result.ok) {
    const status =
      result.error === "forbidden"
        ? 403
        : result.error === "not_found"
          ? 404
          : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    post: result.post,
    bpGranted: result.bpGranted,
  });
}
