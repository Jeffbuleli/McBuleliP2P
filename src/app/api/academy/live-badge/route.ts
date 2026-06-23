import { NextResponse } from "next/server";
import { getAcademyLiveBadge, type AcademyViewerRole } from "@/lib/academy-service";
import { getLocale } from "@/lib/get-locale";
import { getSessionUser } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const locale = await getLocale();
  const viewerRole: AcademyViewerRole =
    user.role === "agent" || user.role === "super_admin" ? "staff" : "learner";

  try {
    const badge = await getAcademyLiveBadge({
      userId: user.id,
      locale,
      viewerRole,
    });
    return NextResponse.json(badge);
  } catch {
    return NextResponse.json({ live: false, title: null, href: null });
  }
}
