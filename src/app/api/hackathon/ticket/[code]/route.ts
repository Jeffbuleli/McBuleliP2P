import { NextResponse } from "next/server";
import {
  canViewPass,
  getPassByCode,
  passPublicUrl,
} from "@/lib/hackathon/access";

export const dynamic = "force-dynamic";

/**
 * Legacy ticket API — same owner gate as /api/hackathon/pass/[code].
 * Knowledge of the code alone is no longer enough.
 */
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
    const [firstName, ...rest] = pass.displayName.split(" ");
    return NextResponse.json({
      ticketCode: pass.ticketCode,
      ticketUrl: passPublicUrl(pass.ticketCode),
      firstName: firstName || pass.displayName,
      lastName: rest.join(" ") || "",
      email: pass.ownerEmail,
      ticketPack: null,
      projectName: null,
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
    console.error("[hackathon/ticket]", e);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
