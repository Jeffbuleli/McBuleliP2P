import { NextResponse } from "next/server";
import { getAcademyHub, listCommunityUpcomingEvents } from "@/lib/academy-service";
import { communityEnabled } from "@/lib/community/config";
import { listFormationPosts } from "@/lib/community/feed-service";
import { getLocale } from "@/lib/get-locale";
import { getSessionUser } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!communityEnabled()) {
    return NextResponse.json({ sessions: [], editions: [], formationPosts: [] });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const locale = await getLocale();
    const [hub, formations, upcomingEvents] = await Promise.all([
      getAcademyHub({
        userId: user.id,
        locale,
        viewerRole:
          user.role === "agent" || user.role === "super_admin" ? "staff" : "learner",
      }),
      listFormationPosts({ viewerId: user.id, limit: 12 }),
      listCommunityUpcomingEvents({ userId: user.id, locale }),
    ]);

    return NextResponse.json({
      upcomingSessions: hub.upcomingSessions,
      upcomingEvents,
      editions: hub.editions.map((e) => ({
        slug: e.slug,
        title: e.title,
        startsAt: e.startsAt,
        enrolled: e.enrolled,
        programSlug: e.programSlug,
        priceUsdt: e.priceUsdt,
        requiresKyc: e.requiresKyc,
      })),
      formationPosts: formations.posts.map((p) => ({
        id: p.id,
        body: p.body,
        publishedAt: p.publishedAt,
        formationMeta: p.formationMeta,
        author: p.author,
        likeCount: p.likeCount,
        commentCount: p.commentCount,
      })),
    });
  } catch {
    return NextResponse.json({
      upcomingSessions: [],
      upcomingEvents: [],
      editions: [],
      formationPosts: [],
    });
  }
}
