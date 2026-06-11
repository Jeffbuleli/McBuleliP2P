import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { VEHICLES, type MineralKey } from "@/lib/game/constants";
import { startTransport } from "@/lib/game/economy-engine";
import { ensureGameSchema } from "@/lib/game/game-schema-ensure";

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
    fromLocation?: string;
    toLocation?: string;
  };

  if (!body.mineralKey || !body.quantityKg || !body.vehicleKey) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  const result = await startTransport({
    playerId: userId,
    mineralKey: body.mineralKey,
    quantityKg: body.quantityKg,
    vehicleKey: body.vehicleKey,
    fromLocation: body.fromLocation ?? "mining_site",
    toLocation: body.toLocation ?? "lubumbashi_market",
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
