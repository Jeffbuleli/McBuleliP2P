import { NextResponse } from "next/server";
import {
  listDmReportsForAdmin,
  listHiddenDmMessagesForAdmin,
} from "@/lib/community/dm-service";
import { StaffAuthError, requireStaff } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireStaff();
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }

  const [reports, hidden] = await Promise.all([
    listDmReportsForAdmin(),
    listHiddenDmMessagesForAdmin(),
  ]);

  return NextResponse.json({ reports, hidden });
}
