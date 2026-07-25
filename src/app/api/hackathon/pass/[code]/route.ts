import { NextResponse } from "next/server";
import {
  canViewPass,
  getPassByCode,
  passPublicUrl,
} from "@/lib/hackathon/access";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ code: string }> },
) {
  const { code } = await ctx.params;
  try {
    const data = await getPassByCode(code);
    if (!data?.pass?.valid) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const access = await canViewPass(data.pass);
    if (!access.ok) {
      return NextResponse.json(
        { error: access.reason },
        { status: access.reason === "login_required" ? 401 : 403 },
      );
    }
    const { pass, edition } = data;
    return NextResponse.json({
      subjectType: pass.subjectType,
      ticketCode: pass.ticketCode,
      passUrl: passPublicUrl(pass.ticketCode),
      displayName: pass.displayName,
      orgOrEmail: pass.orgOrEmail,
      roleLabel: pass.roleLabel,
      badgeKind: pass.badgeKind,
      presenceStatus: pass.presenceStatus,
      edition: edition
        ? {
            nameFr: edition.nameFr,
            nameEn: edition.nameEn,
            city: edition.city,
            venue: edition.venue,
            startDate: edition.startDate?.toISOString() ?? null,
            endDate: edition.endDate?.toISOString() ?? null,
          }
        : null,
    });
  } catch (e) {
    console.error("[hackathon/pass]", e);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
