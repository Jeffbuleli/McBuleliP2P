import { NextResponse } from "next/server";
import { getEditionInstructorAnalytics } from "@/lib/academy-instructor-analytics";
import { getSessionUser } from "@/lib/session-user";
import { UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = await getSessionUser();
  if (!u || u.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const editionSlug = new URL(req.url).searchParams.get("edition")?.trim();
  if (!editionSlug) {
    return NextResponse.json({ error: "edition required" }, { status: 400 });
  }

  const analytics = await getEditionInstructorAnalytics(editionSlug);
  if (!analytics) {
    return NextResponse.json({ error: "edition_not_found" }, { status: 404 });
  }

  return NextResponse.json({ analytics });
}
