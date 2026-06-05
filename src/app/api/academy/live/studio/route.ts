import { NextResponse } from "next/server";
import {
  ensureAcademyLiveStudioProgram,
  getActiveLivePurchase,
  getUserUsdtBalance,
  listLiveStudioPlansForUi,
} from "@/lib/academy-live-service";
import {
  listOwnerWebinars,
  listPublishedWebinars,
} from "@/lib/academy-webinar-service";
import {
  assertAcademyDbReady,
  isAcademyDbNotReadyError,
} from "@/lib/academy-db-ready";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plans = listLiveStudioPlansForUi();

  try {
    await assertAcademyDbReady();
  } catch (e) {
    if (isAcademyDbNotReadyError(e)) {
      return NextResponse.json(
        {
          error: "academy_db_not_migrated",
          plans,
          purchase: null,
          mine: [],
          catalog: [],
          balanceUsdt: 0,
        },
        { status: 503 },
      );
    }
    console.error("[academy/live/studio] db ready", e);
  }

  await safe(() => ensureAcademyLiveStudioProgram(), undefined);

  const [purchase, mine, catalog, balanceUsdt] = await Promise.all([
    safe(() => getActiveLivePurchase(userId), null),
    safe(() => listOwnerWebinars(userId), []),
    safe(() => listPublishedWebinars(), []),
    safe(() => getUserUsdtBalance(userId), 0),
  ]);

  return NextResponse.json({
    plans,
    purchase,
    mine,
    catalog,
    balanceUsdt,
  });
}
