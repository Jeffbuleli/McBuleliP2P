import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, hackathonRegistrations, users } from "@/db";
import { payLaterPublicUrl } from "@/lib/hackathon/service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Prefill + resume context for logged-in McBuleli users on /hackathon#register.
 */
export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ session: null, registration: null });
  }

  const { searchParams } = new URL(req.url);
  const editionId = searchParams.get("editionId")?.trim() || null;

  const db = getDb();
  const [u] = await db
    .select({
      id: users.id,
      email: users.email,
      emailVerifiedAt: users.emailVerifiedAt,
      displayName: users.displayName,
      legalFirstName: users.legalFirstName,
      legalLastName: users.legalLastName,
      recoveryWaPhone: users.recoveryWaPhone,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!u) {
    return NextResponse.json({ session: null, registration: null });
  }

  const nameParts = (u.displayName ?? "").trim().split(/\s+/).filter(Boolean);
  const firstName =
    u.legalFirstName?.trim() || nameParts[0] || "";
  const lastName =
    u.legalLastName?.trim() ||
    (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "");

  const session = {
    email: u.email,
    emailVerified: Boolean(u.emailVerifiedAt),
    firstName,
    lastName,
    phone: u.recoveryWaPhone?.trim() || "",
  };

  if (!editionId) {
    return NextResponse.json({ session, registration: null });
  }

  const [reg] = await db
    .select({
      id: hackathonRegistrations.id,
      paymentStatus: hackathonRegistrations.paymentStatus,
      ticketCode: hackathonRegistrations.ticketCode,
      paymentToken: hackathonRegistrations.paymentToken,
      firstName: hackathonRegistrations.firstName,
      lastName: hackathonRegistrations.lastName,
      phone: hackathonRegistrations.phone,
    })
    .from(hackathonRegistrations)
    .where(
      and(
        eq(hackathonRegistrations.editionId, editionId),
        eq(hackathonRegistrations.email, u.email.toLowerCase()),
      ),
    )
    .limit(1);

  if (!reg) {
    return NextResponse.json({ session, registration: null });
  }

  return NextResponse.json({
    session,
    registration: {
      id: reg.id,
      paymentStatus: reg.paymentStatus,
      ticketCode: reg.ticketCode,
      payUrl:
        reg.paymentStatus === "reserved" && reg.paymentToken
          ? payLaterPublicUrl(reg.paymentToken)
          : null,
      firstName: reg.firstName,
      lastName: reg.lastName,
      phone: reg.phone,
    },
  });
}
