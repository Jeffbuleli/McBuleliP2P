import { NextResponse } from "next/server";
import { StaffAuthError, requireStaffScope } from "@/lib/session-user";
import { listDisputedOrdersForAdmin } from "@/lib/p2p-service";

export async function GET() {
  try {
    await requireStaffScope("p2p_disputes");
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ message: e.message }, { status: 403 });
    }
    throw e;
  }
  const disputes = await listDisputedOrdersForAdmin();
  return NextResponse.json({ disputes });
}
