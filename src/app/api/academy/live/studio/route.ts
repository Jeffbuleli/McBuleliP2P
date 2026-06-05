import { NextResponse } from "next/server";
import {
  getActiveLivePurchase,
  listLiveStudioPlansForUi,
} from "@/lib/academy-live-service";
import {
  listOwnerWebinars,
  listPublishedWebinars,
} from "@/lib/academy-webinar-service";
import { isAcademyDbNotReadyError } from "@/lib/academy-db-ready";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const [purchase, mine, catalog] = await Promise.all([
      getActiveLivePurchase(userId),
      listOwnerWebinars(userId),
      listPublishedWebinars(),
    ]);
    return NextResponse.json({
      plans: listLiveStudioPlansForUi(),
      purchase,
      mine,
      catalog,
    });
  } catch (e) {
    if (isAcademyDbNotReadyError(e)) {
      return NextResponse.json(
        {
          error: "academy_db_not_migrated",
          plans: listLiveStudioPlansForUi(),
          purchase: null,
          mine: [],
          catalog: [],
        },
        { status: 503 },
      );
    }
    throw e;
  }
}
