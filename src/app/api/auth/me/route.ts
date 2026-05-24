import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { getSessionUserId } from "@/lib/session";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ user: null });
  }
  reconcileKycIfNeeded(userId);
  const db = getDb();
  const [u] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      balance: users.balance,
      countryCode: users.countryCode,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      piUsername: users.piUsername,
      staffScopes: users.staffScopes,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({ user: u });
}

function reconcileKycIfNeeded(userId: string) {
  void import("@/lib/didit/try-refresh-pending")
    .then(({ tryRefreshKycIfPending }) => tryRefreshKycIfPending(userId))
    .catch((err) => console.warn("[auth/me] kyc reconcile", err));
}
