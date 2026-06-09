import { NextResponse } from "next/server";
import { z } from "zod";
import { communityEnabled } from "@/lib/community/config";
import {
  createBlogPost,
  listBlogCategories,
  listPublishedBlogs,
} from "@/lib/community/blog-service";
import { assertOwnedMedia } from "@/lib/community/media-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const createZ = z.object({
  title: z.string().min(10).max(200),
  body: z.string().min(200).max(20000),
  excerpt: z.string().max(320).optional(),
  categoryId: z.string().uuid().optional(),
  coverMediaId: z.string().uuid().optional(),
  publish: z.boolean().optional(),
});

export async function GET(req: Request) {
  if (!communityEnabled()) {
    return NextResponse.json({ posts: [], categories: [], nextCursor: null });
  }

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const limit = Number(url.searchParams.get("limit") ?? "15");
  const category = url.searchParams.get("category") ?? undefined;
  const authorId = url.searchParams.get("authorId") ?? undefined;

  const [result, categories] = await Promise.all([
    listPublishedBlogs({ cursor, limit, categorySlug: category, authorId }),
    listBlogCategories(),
  ]);

  return NextResponse.json({ ...result, categories });
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

  if (parsed.data.coverMediaId) {
    const ok = await assertOwnedMedia(userId, [parsed.data.coverMediaId]);
    if (!ok) {
      return NextResponse.json({ error: "invalid_media" }, { status: 400 });
    }
  }

  const result = await createBlogPost({
    authorId: userId,
    ...parsed.data,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    post: result.post,
    bpGranted: result.bpGranted,
  });
}
