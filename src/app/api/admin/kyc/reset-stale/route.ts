import { NextResponse } from "next/server";
import { resetStalePendingKycUsers } from "@/lib/didit/reconcile-stale-kyc";
import { StaffAuthError, requireSuperAdmin } from "@/lib/session-user";

export const dynamic = "force-dynamic";

/** Super-admin: reset pending KYC stuck >1h (legacy Metamap orphans, Didit 404). */
export async function POST() {
  try {
    await requireSuperAdmin();
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ message: e.message }, { status: 403 });
    }
    throw e;
  }

  const result = await resetStalePendingKycUsers();
  return NextResponse.json({ ok: true, ...result });
}
