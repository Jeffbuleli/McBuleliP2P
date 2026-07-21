import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, hackathonPayments, hackathonRegistrations } from "@/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ reference: string }> },
) {
  const { reference } = await ctx.params;
  try {
    const db = getDb();
    const [pay] = await db
      .select()
      .from(hackathonPayments)
      .where(eq(hackathonPayments.reference, reference))
      .limit(1);
    if (!pay) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const [reg] = await db
      .select({
        paymentStatus: hackathonRegistrations.paymentStatus,
        ticketCode: hackathonRegistrations.ticketCode,
        firstName: hackathonRegistrations.firstName,
        locale: hackathonRegistrations.locale,
      })
      .from(hackathonRegistrations)
      .where(eq(hackathonRegistrations.id, pay.registrationId))
      .limit(1);

    return NextResponse.json({
      reference: pay.reference,
      status: pay.status,
      paymentStatus: reg?.paymentStatus ?? "pending",
      ticketCode: reg?.ticketCode ?? null,
      firstName: reg?.firstName ?? null,
      locale: reg?.locale ?? null,
      checkoutUrl: pay.checkoutUrl,
    });
  } catch (e) {
    console.error("[hackathon/payment]", e);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
