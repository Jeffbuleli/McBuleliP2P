import { NextResponse } from "next/server";
import { getAcademyHub } from "@/lib/academy-service";
import { communityEnabled } from "@/lib/community/config";
import { getLocale } from "@/lib/get-locale";
import { getSessionUser } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!communityEnabled()) {
    return NextResponse.json({ sessions: [], editions: [] });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const locale = await getLocale();
    const hub = await getAcademyHub({
      userId: user.id,
      locale,
      viewerRole:
        user.role === "agent" || user.role === "super_admin" ? "staff" : "learner",
    });
    return NextResponse.json({
      upcomingSessions: hub.upcomingSessions,
      editions: hub.editions.map((e) => ({
        slug: e.slug,
        title: e.title,
        startsAt: e.startsAt,
        enrolled: e.enrolled,
        programSlug: e.programSlug,
      })),
    });
  } catch {
    return NextResponse.json({ upcomingSessions: [], editions: [] });
  }
}
