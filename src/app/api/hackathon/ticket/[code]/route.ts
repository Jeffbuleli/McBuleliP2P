import { NextResponse } from "next/server";
import { getTicketByCode, ticketPublicUrl } from "@/lib/hackathon/service";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ code: string }> },
) {
  const { code } = await ctx.params;
  try {
    const data = await getTicketByCode(code);
    if (!data || data.registration.paymentStatus !== "paid") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const { registration: reg, edition } = data;
    return NextResponse.json({
      ticketCode: reg.ticketCode,
      ticketUrl: ticketPublicUrl(reg.ticketCode!),
      firstName: reg.firstName,
      lastName: reg.lastName,
      email: reg.email,
      ticketPack: reg.ticketPack,
      projectName: reg.projectName,
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
