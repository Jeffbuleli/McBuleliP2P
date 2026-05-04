import { NextResponse } from "next/server";
import { StaffAuthError, requireStaff } from "@/lib/session-user";
import { listDisputedOrdersForAdmin } from "@/lib/p2p-service";

export async function GET() {
  try {
    await requireStaff();
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ message: e.message }, { status: 403 });
    }
    throw e;
  }
  const disputes = await listDisputedOrdersForAdmin();
  return NextResponse.json({ disputes });
}
