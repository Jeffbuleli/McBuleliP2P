import { NextResponse } from "next/server";
import { StaffAuthError, requireSuperAdmin } from "@/lib/session-user";

/** OpenWA removed — keep route so old admin clients get a clear 410. */
export async function GET() {
  try {
    await requireSuperAdmin();
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }
  return NextResponse.json(
    { error: "openwa_removed", configured: false },
    { status: 410 },
  );
}

export async function POST() {
  return GET();
}
