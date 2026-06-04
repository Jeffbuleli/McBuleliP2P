import { NextResponse } from "next/server";
import {
  getActiveLivePurchase,
  listLiveStudioPlansForUi,
} from "@/lib/academy-live-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const purchase = await getActiveLivePurchase(userId);
  return NextResponse.json({
    plans: listLiveStudioPlansForUi(),
    purchase,
  });
}
