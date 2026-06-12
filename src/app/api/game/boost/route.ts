import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { applyGameBpBoost, type GameBpBoostId } from "@/lib/game/bp-boosts";
import { gameErrorResponse } from "@/lib/game/game-api";
import { ensureGameSchema } from "@/lib/game/game-schema-ensure";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await ensureGameSchema();

  const body = (await req.json()) as { boostId?: GameBpBoostId };
  if (!body.boostId) {
    return NextResponse.json({ message: "boostId required" }, { status: 400 });
  }

  const result = await applyGameBpBoost({ userId, boostId: body.boostId });
  if (!result.ok) {
    return gameErrorResponse(result.error);
  }

  return NextResponse.json(result);
}
