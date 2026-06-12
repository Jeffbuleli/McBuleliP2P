import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { VEHICLES, type MineralKey } from "@/lib/game/constants";
import { startTransport } from "@/lib/game/economy-engine";
import { ensureGameSchema } from "@/lib/game/game-schema-ensure";
import { gameErrorResponse } from "@/lib/game/game-api";
import { getOrCreatePlayer } from "@/lib/game/player-state";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await ensureGameSchema();

  const body = (await req.json()) as {
    mineralKey?: MineralKey;
    quantityKg?: number;
    vehicleKey?: keyof typeof VEHICLES;
    routeKey?: string;
  };

  if (!body.mineralKey || !body.quantityKg || !body.vehicleKey || !body.routeKey) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  const player = await getOrCreatePlayer(userId);

  const result = await startTransport({
    playerId: userId,
    mineralKey: body.mineralKey,
    quantityKg: body.quantityKg,
    vehicleKey: body.vehicleKey,
    routeKey: body.routeKey,
    xp: player.xp,
  });

  if (!result.ok) {
    return gameErrorResponse(result.error);
  }

  return NextResponse.json(result);
}
