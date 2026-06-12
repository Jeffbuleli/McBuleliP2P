import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { purchaseUpgrade } from "@/lib/game/economy-engine";
import { gameErrorResponse } from "@/lib/game/game-api";
import { ensureGameSchema } from "@/lib/game/game-schema-ensure";
import { listShopForPlayer } from "@/lib/game/upgrade-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await ensureGameSchema();
  const items = await listShopForPlayer(userId);

  return NextResponse.json({
    items,
    count: items.length,
    categories: ["tool", "upgrade", "consumable", "license"] as const,
  });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await ensureGameSchema();

  const body = (await req.json()) as { itemKey?: string };
  if (!body.itemKey) {
    return NextResponse.json({ message: "itemKey required" }, { status: 400 });
  }

  const result = await purchaseUpgrade({ playerId: userId, itemKey: body.itemKey });
  if (!result.ok) {
    return gameErrorResponse(result.error);
  }

  return NextResponse.json(result);
}
