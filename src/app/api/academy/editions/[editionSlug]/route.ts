import { NextResponse } from "next/server";
import { getEditionDetail } from "@/lib/academy-service";
import { resolveAcademyLiveRoleForEdition } from "@/lib/academy-live-role";
import { resolveEditionIdBySlug } from "@/lib/academy-cohort-messaging";
import { getLocale } from "@/lib/get-locale";
import { getSessionUser } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ editionSlug: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { editionSlug } = await ctx.params;
  const programSlug =
    new URL(req.url).searchParams.get("program")?.trim() || undefined;
  const locale = await getLocale();
  const editionId = await resolveEditionIdBySlug({ editionSlug, programSlug });
  if (!editionId) {
    return NextResponse.json({ error: "academy_edition_not_found" }, { status: 404 });
  }

  const liveRole = await resolveAcademyLiveRoleForEdition({
    userId: user.id,
    editionId,
    appRole: user.role,
  });

  const detail = await getEditionDetail({
    userId: user.id,
    editionSlug,
    programSlug,
    locale,
    viewerLiveRole: liveRole,
  });

  if (!detail) {
    return NextResponse.json({ error: "academy_edition_not_found" }, { status: 404 });
  }

  return NextResponse.json(detail);
}
