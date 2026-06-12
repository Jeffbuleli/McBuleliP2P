import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { type MineralKey } from "@/lib/game/constants";
import { gameErrorResponse } from "@/lib/game/game-api";
import { ensureGameSchema } from "@/lib/game/game-schema-ensure";
import { getRefineryAccess, refineMinerals } from "@/lib/game/refinery-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await ensureGameSchema();
  const access = await getRefineryAccess(userId);
  return NextResponse.json(access);
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await ensureGameSchema();

  const body = (await req.json()) as {
    mineralKey?: MineralKey;
    quantityKg?: number;
  };

  if (!body.mineralKey || !body.quantityKg) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  const result = await refineMinerals({
    playerId: userId,
    mineralKey: body.mineralKey,
    quantityKg: body.quantityKg,
  });

  if (!result.ok) {
    return gameErrorResponse(result.error);
  }

  return NextResponse.json(result);
}
