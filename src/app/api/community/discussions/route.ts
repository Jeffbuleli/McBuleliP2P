import { NextResponse } from "next/server";
import { z } from "zod";
import { communityEnabled } from "@/lib/community/config";
import {
  createDiscussion,
  listDiscussionCategories,
  listDiscussions,
} from "@/lib/community/discussion-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

const createZ = z.object({
  title: z.string().min(8).max(200),
  body: z.string().min(20).max(4000),
  categoryId: z.string().uuid().optional(),
});

export async function GET(req: Request) {
  if (!communityEnabled()) {
    return NextResponse.json({ discussions: [], categories: [], nextCursor: null });
  }

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const limit = Number(url.searchParams.get("limit") ?? "20");
  const sort = url.searchParams.get("sort") as
    | "recent"
    | "popular"
    | "following"
    | null;
  const category = url.searchParams.get("category") ?? undefined;
  const viewerId = await getSessionUserId();

  const [result, categories] = await Promise.all([
    listDiscussions({
      viewerId,
      cursor,
      limit,
      sort: sort ?? "recent",
      categorySlug: category,
    }),
    listDiscussionCategories(),
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

  const result = await createDiscussion({
    authorId: userId,
    ...parsed.data,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ discussion: result.discussion });
}
