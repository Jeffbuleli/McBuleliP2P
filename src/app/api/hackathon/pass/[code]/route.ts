import { NextResponse } from "next/server";
import { getPassByCode, passPublicUrl } from "@/lib/hackathon/access";

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
    const { pass, edition } = data;
    return NextResponse.json({
      subjectType: pass.subjectType,
      ticketCode: pass.ticketCode,
      passUrl: passPublicUrl(pass.ticketCode),
      displayName: pass.displayName,
      orgOrEmail: pass.orgOrEmail,
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
