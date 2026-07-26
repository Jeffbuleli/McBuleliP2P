import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, hackathonPayments, hackathonRegistrations } from "@/db";
import { reconcileHackathonPaymentByReference } from "@/lib/hackathon/reconcile-payment";

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

    // Heal missed webhooks: poll pawaPay while still open (wallet already does this).
    if (
      pay.rail === "momo" &&
      (pay.status === "INITIATED" || pay.status === "PROCESSING")
    ) {
      await reconcileHackathonPaymentByReference(reference).catch((e) => {
        console.warn("[hackathon/payment] reconcile", reference, e);
      });
    }

    const [freshPay] = await db
      .select()
      .from(hackathonPayments)
      .where(eq(hackathonPayments.reference, reference))
      .limit(1);
    const row = freshPay ?? pay;

    const [reg] = await db
      .select({
        paymentStatus: hackathonRegistrations.paymentStatus,
        ticketCode: hackathonRegistrations.ticketCode,
        firstName: hackathonRegistrations.firstName,
        locale: hackathonRegistrations.locale,
      })
      .from(hackathonRegistrations)
      .where(eq(hackathonRegistrations.id, row.registrationId))
      .limit(1);

    return NextResponse.json({
      reference: row.reference,
      status: row.status,
      paymentStatus: reg?.paymentStatus ?? "pending",
      ticketCode: reg?.ticketCode ?? null,
      firstName: reg?.firstName ?? null,
      locale: reg?.locale ?? null,
      checkoutUrl: row.checkoutUrl,
      provider: row.provider,
      rail: row.rail,
    });
  } catch (e) {
    console.error("[hackathon/payment]", e);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
