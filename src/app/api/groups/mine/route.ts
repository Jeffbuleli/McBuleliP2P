import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { listMyGroups } from "@/lib/group-savings-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await listMyGroups({ userId });
  return NextResponse.json(data);
}
