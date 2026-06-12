import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { VEHICLES } from "@/lib/game/constants";
import { gameErrorResponse } from "@/lib/game/game-api";
import { ensureGameSchema } from "@/lib/game/game-schema-ensure";
import { repairVehicle } from "@/lib/game/vehicle-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await ensureGameSchema();

  const body = (await req.json()) as { vehicleKey?: keyof typeof VEHICLES };
  if (!body.vehicleKey) {
    return NextResponse.json({ message: "vehicleKey required" }, { status: 400 });
  }

  const result = await repairVehicle({ playerId: userId, vehicleKey: body.vehicleKey });
  if (!result.ok) return gameErrorResponse(result.error);

  const meta = VEHICLES[body.vehicleKey];
  return NextResponse.json({
    ...result,
    message: `${meta?.label ?? body.vehicleKey} repaired (−${result.costMcb} McB).`,
    messageFr: `${meta?.labelFr ?? body.vehicleKey} réparé (−${result.costMcb} McB).`,
  });
}
